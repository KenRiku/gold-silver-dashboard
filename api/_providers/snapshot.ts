import type { Snapshot, SnapshotRow } from '../../shared/quotes.js';
import type { ProviderReading, ProviderResult } from './types.js';

export function readingsFromSnapshot(snapshot: Snapshot): ProviderResult {
  const readings: ProviderReading[] = [];
  const missingNotes: Record<string, string> = {};
  for (const row of snapshot.readings) {
    if (row.value === null) {
      missingNotes[row.key] = row.note || 'Not found in the latest snapshot';
      continue;
    }
    readings.push({
      key: row.key,
      value: row.value,
      prevClose: previousClose(row.value, row),
      chg_pct: row.chg_pct,
      chg_bp: row.chg_bp,
      chg_1m_pct: row.chg_1m_pct,
      asOf: snapshot.asOf,
      delayMinutes: null,
      note: row.note,
      source: { name: row.source || 'Claude snapshot', url: row.url, kind: 'snapshot' },
    });
  }
  return { readings, missingNotes };
}

function previousClose(value: number, row: SnapshotRow): number | null {
  if (row.chg_pct !== null) return value / (1 + row.chg_pct / 100);
  if (row.chg_bp !== null) return value - row.chg_bp / 100;
  return null;
}
