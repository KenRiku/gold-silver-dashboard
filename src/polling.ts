import type { QuotesResponse } from '../shared/quotes.js';

const OPEN_INTERVAL_MS = 60_000;
const CLOSED_INTERVAL_MS = 5 * 60_000;
const FETCH_TIMEOUT_MS = 10_000;

/** COMEX metals trade Sunday 18:00 to Friday 17:00 New York time with a daily 17:00–18:00 break; this window covers US stock hours. */
export function metalsFuturesOpen(now: Date): boolean {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', hourCycle: 'h23' }).formatToParts(now);
  const weekday = parts.find((part) => part.type === 'weekday')!.value;
  const hour = Number(parts.find((part) => part.type === 'hour')!.value);
  if (weekday === 'Sat') return false;
  if (weekday === 'Sun') return hour >= 18;
  if (weekday === 'Fri') return hour < 17;
  return hour !== 17;
}

export function pollInterval(now: Date): number {
  return metalsFuturesOpen(now) ? OPEN_INTERVAL_MS : CLOSED_INTERVAL_MS;
}

export async function fetchQuotes(): Promise<QuotesResponse> {
  const response = await fetch('/api/quotes', { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`/api/quotes returned ${response.status}`);
  const quotes = (await response.json()) as QuotesResponse;
  if (!Array.isArray(quotes.readings)) throw new Error('/api/quotes returned no readings');
  return quotes;
}
