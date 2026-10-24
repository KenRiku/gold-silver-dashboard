import type { Market } from '../../config/markets.js';
import type { ProviderReading } from '../../shared/provider.js';
import type { LiveProvider } from './live.js';

const QUOTE_URL = 'https://finnhub.io/api/v1/quote';
const TIMEOUT_MS = 4000;

/** Finnhub /quote answer: c current, pc previous close, t last update (Unix seconds). */
export interface FinnhubQuote {
  c?: number;
  d?: number | null;
  dp?: number | null;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
}

export const finnhub: LiveProvider = {
  id: 'finnhub',
  name: 'Finnhub',
  isConfigured: () => Boolean(process.env.FINNHUB_API_KEY),
  async fetchReading(market, symbol, now) {
    const url = `${QUOTE_URL}?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(process.env.FINNHUB_API_KEY ?? '')}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return readingFromFinnhubQuote(market, symbol, (await response.json()) as FinnhubQuote, now);
  },
};

/**
 * Turns a Finnhub quote into a reading, or null when the symbol isn't covered: Finnhub answers
 * unknown or unentitled symbols with zeros rather than an error.
 */
export function readingFromFinnhubQuote(market: Market, symbol: string, quote: FinnhubQuote, now: Date): ProviderReading | null {
  const value = quote.c;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  const prevClose = typeof quote.pc === 'number' && quote.pc > 0 ? quote.pc : null;
  const asOf = typeof quote.t === 'number' && quote.t > 0 ? new Date(quote.t * 1000).toISOString() : now.toISOString();
  return {
    key: market.key,
    value,
    prevClose,
    chg_pct: prevClose === null ? null : round2((value / prevClose - 1) * 100),
    chg_bp: null,
    chg_1m_pct: null,
    asOf,
    delayMinutes: null,
    note: 'Live quote; day change is against the previous close',
    source: { name: 'Finnhub', url: 'https://finnhub.io/docs/api/quote', kind: 'live', symbol },
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
