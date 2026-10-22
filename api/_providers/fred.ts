import type { Market } from '../../config/markets.js';
import type { ProviderReading } from './types.js';

const FRED_CSV = 'https://fred.stlouisfed.org/graph/fredgraph.csv';
const LOOKBACK_DAYS = 45;
const TIMEOUT_MS = 4000;
const US_CLOSE_UTC = 'T21:00:00Z';

interface Observation {
  date: string;
  value: number;
}

export async function readingsFromFred(fredMarkets: Market[], now: Date): Promise<ProviderReading[]> {
  const results = await Promise.allSettled(fredMarkets.map((market) => fetchSeriesReading(market, now)));
  return results.flatMap((result) => (result.status === 'fulfilled' && result.value ? [result.value] : []));
}

async function fetchSeriesReading(market: Market, now: Date): Promise<ProviderReading | null> {
  const series = market.fredSeries!;
  const observations = await fetchObservations(series, now);
  if (observations.length < 2) return null;
  const [previous, latest] = observations.slice(-2);
  const change = market.changeUnit === 'bp'
    ? { chg_bp: Math.round((latest.value - previous.value) * 100), chg_pct: null }
    : { chg_bp: null, chg_pct: round2((latest.value / previous.value - 1) * 100) };
  return {
    key: market.key,
    value: latest.value,
    prevClose: previous.value,
    ...change,
    chg_1m_pct: null,
    asOf: latest.date + US_CLOSE_UTC,
    delayMinutes: null,
    note: `Daily series, ${latest.date} close`,
    source: { name: 'FRED, St. Louis Fed', url: `https://fred.stlouisfed.org/series/${series}`, kind: 'daily', symbol: series },
  };
}

async function fetchObservations(series: string, now: Date): Promise<Observation[]> {
  const start = new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000).toISOString().slice(0, 10);
  const response = await fetch(`${FRED_CSV}?id=${series}&cosd=${start}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`FRED ${series}: HTTP ${response.status}`);
  return parseFredCsv(await response.text());
}

export function parseFredCsv(csv: string): Observation[] {
  return csv
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => line.split(','))
    .filter(([, raw]) => raw !== undefined && raw.trim() !== '.' && raw.trim() !== '')
    .map(([date, raw]) => ({ date, value: Number(raw) }))
    .filter((observation) => Number.isFinite(observation.value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
