import type { LiveSource, Market } from '../../config/markets.js';
import type { ProviderReading } from '../../shared/provider.js';
import { finnhub } from './finnhub.js';

export interface LiveProvider {
  id: string;
  name: string;
  /** False when the provider's API key isn't set; it is then skipped. */
  isConfigured(): boolean;
  /** A reading for the symbol, or null when the provider doesn't cover it. Throws on network or HTTP errors. */
  fetchReading(market: Market, symbol: string, now: Date): Promise<ProviderReading | null>;
}

/**
 * Every live provider the site knows. A market lists the providers it can come from, in order,
 * under `live` in config/markets.ts; the first one that answers wins. To add a backup source,
 * write an adapter like finnhub.ts, add it here, and add it second in the markets that need it.
 */
export const liveProviders: LiveProvider[] = [finnhub];

export interface LiveResult {
  readings: ProviderReading[];
  /** Why each live-capable market got no live reading, for /api/quotes errors and debugging. */
  misses: Record<string, string>;
}

export async function readingsFromLive(liveMarkets: Market[], now: Date, providers: LiveProvider[] = liveProviders): Promise<LiveResult> {
  const results = await Promise.all(liveMarkets.map((market) => firstLiveReading(market, market.live ?? [], now, providers)));
  const readings: ProviderReading[] = [];
  const misses: Record<string, string> = {};
  liveMarkets.forEach((market, index) => {
    const result = results[index];
    if ('reading' in result) readings.push(result.reading);
    else misses[market.key] = result.miss;
  });
  return { readings, misses };
}

async function firstLiveReading(
  market: Market,
  sources: LiveSource[],
  now: Date,
  providers: LiveProvider[],
): Promise<{ reading: ProviderReading } | { miss: string }> {
  const tried: string[] = [];
  for (const source of sources) {
    const provider = providers.find((candidate) => candidate.id === source.provider);
    if (!provider) {
      tried.push(`${source.provider}: unknown provider`);
      continue;
    }
    if (!provider.isConfigured()) {
      tried.push(`${provider.name}: API key not set`);
      continue;
    }
    try {
      const reading = await provider.fetchReading(market, source.symbol, now);
      if (reading) return { reading };
      tried.push(`${provider.name}: no data for ${source.symbol}`);
    } catch (error) {
      tried.push(`${provider.name}: ${error instanceof Error ? error.message : 'request failed'} for ${source.symbol}`);
    }
  }
  return { miss: tried.join('; ') || 'No live source configured' };
}
