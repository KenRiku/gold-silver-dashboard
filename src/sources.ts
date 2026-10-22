import type { Reading } from '../shared/quotes.js';
import { el } from './dom.js';
import { formatAge } from './format.js';

const FRESH_MS = 5 * 60_000;

export function sourceLabel(reading: Reading): string {
  switch (reading.source.kind) {
    case 'daily': return 'FRED daily';
    case 'computed': return 'Computed';
    case 'snapshot': return `Claude snapshot (${reading.source.name})`;
  }
}

export function sourceTag(reading: Reading, now: Date): HTMLButtonElement {
  const tag = el('button', 'src-tag', `${sourceLabel(reading)} · ${formatAge(reading.asOf, now)}`);
  tag.type = 'button';
  tag.dataset.sourceKey = reading.key;
  tag.dataset.fresh = String(now.getTime() - Date.parse(reading.asOf) < FRESH_MS);
  return tag;
}

export function oldestReading(readings: Reading[]): Reading | null {
  return readings.reduce<Reading | null>((oldest, reading) => (!oldest || Date.parse(reading.asOf) < Date.parse(oldest.asOf) ? reading : oldest), null);
}
