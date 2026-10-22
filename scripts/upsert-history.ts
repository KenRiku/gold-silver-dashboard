import { readFileSync, writeFileSync } from 'node:fs';
import { markets } from '../config/markets.js';
import type { HistoryRow } from '../shared/data-files.js';
import type { Snapshot } from '../shared/quotes.js';

const HISTORY_FILE = 'data/history.json';
const SNAPSHOT_FILE = 'data/snapshot.json';
const MIDNIGHT_RUN_OFFSET_MS = 12 * 60 * 60_000;

/** The midnight Pacific run records the US session that closed a few hours earlier. */
function defaultMarketDate(now: Date): string {
  return new Date(now.getTime() - MIDNIGHT_RUN_OFFSET_MS).toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

const marketDate = process.argv[2] ?? defaultMarketDate(new Date());
const snapshot: Snapshot = JSON.parse(readFileSync(SNAPSHOT_FILE, 'utf8'));
const closing = new Map(snapshot.readings.map((reading) => [reading.key, reading.value]));

const row: HistoryRow = { date: marketDate };
for (const market of markets) row[market.key] = closing.get(market.key) ?? null;

const history: HistoryRow[] = JSON.parse(readFileSync(HISTORY_FILE, 'utf8'));
const updated = [...history.filter((existing) => existing.date !== marketDate), row].sort((a, b) => a.date.localeCompare(b.date));
writeFileSync(HISTORY_FILE, JSON.stringify(updated, null, 2) + '\n');
console.log(`upsert-history: ${history.length === updated.length ? 'replaced' : 'added'} ${marketDate} (${updated.length} rows)`);
