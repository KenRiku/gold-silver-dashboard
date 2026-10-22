import { markets, type Market } from '../config/markets.js';
import type { QuoteError, QuotesResponse, Reading, Snapshot } from '../shared/quotes.js';
import { readingsFromFred } from './_providers/fred.js';
import { readingsFromSnapshot } from '../shared/snapshot.js';
import type { ProviderReading } from '../shared/provider.js';

export async function buildQuotes(snapshot: Snapshot, now: Date): Promise<QuotesResponse> {
  const fromSnapshot = readingsFromSnapshot(snapshot);
  const fromFred = await readingsFromFred(markets.filter((market) => market.fredSeries), now);
  const freshest = freshestByKey([...fromSnapshot.readings, ...fromFred]);

  const readings: Reading[] = [];
  const errors: QuoteError[] = [];
  for (const market of markets) {
    const reading = market.key === 'gs_ratio' ? goldSilverRatio(freshest) ?? freshest.get(market.key) : freshest.get(market.key);
    if (reading) readings.push(labelled(reading, market));
    else errors.push({ key: market.key, reason: fromSnapshot.missingNotes[market.key] ?? 'Not covered by the snapshot or FRED' });
  }
  return { asOf: now.toISOString(), readings, errors };
}

function freshestByKey(readings: ProviderReading[]): Map<string, ProviderReading> {
  const byKey = new Map<string, ProviderReading>();
  for (const reading of readings) {
    const current = byKey.get(reading.key);
    if (!current || Date.parse(reading.asOf) > Date.parse(current.asOf)) byKey.set(reading.key, reading);
  }
  return byKey;
}

function goldSilverRatio(freshest: Map<string, ProviderReading>): ProviderReading | null {
  const gold = freshest.get('gold');
  const silver = freshest.get('silver');
  if (!gold || !silver) return null;
  const value = gold.value / silver.value;
  const prevClose = gold.prevClose !== null && silver.prevClose !== null ? gold.prevClose / silver.prevClose : null;
  return {
    key: 'gs_ratio',
    value: round(value, 2),
    prevClose: prevClose === null ? null : round(prevClose, 2),
    chg_pct: prevClose === null ? null : round((value / prevClose - 1) * 100, 2),
    chg_bp: null,
    chg_1m_pct: null,
    asOf: Date.parse(gold.asOf) < Date.parse(silver.asOf) ? gold.asOf : silver.asOf,
    delayMinutes: null,
    note: 'Rising ratio = silver under more stress than gold',
    source: { name: `Computed from gold (${gold.source.name}) and silver (${silver.source.name})`, url: gold.source.url, kind: 'computed' },
  };
}

function labelled(reading: ProviderReading, market: Market): Reading {
  return { ...reading, label: market.label, group: market.group };
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
