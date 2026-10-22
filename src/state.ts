import { markets } from '../config/markets.js';
import { watchlist } from '../config/watchlist.js';
import { activePacks } from '../packs/index.js';
import type { QuoteError, QuotesResponse, Reading } from '../shared/quotes.js';
import { readingsFromSnapshot } from '../shared/snapshot.js';
import { snapshot } from './data.js';
import { checkRules, type RuleCheck } from './rules/engine.js';

export type Feed =
  | { mode: 'files' }
  | { mode: 'api'; checkedAt: string }
  | { mode: 'failed'; checkedAt: string };

export interface ViewState {
  readings: Map<string, Reading>;
  errors: QuoteError[];
  checks: RuleCheck[];
  feed: Feed;
  now: Date;
}

export function stateFromSnapshotFile(now: Date, feed: Feed = { mode: 'files' }): ViewState {
  const fromFile = readingsFromSnapshot(snapshot);
  const readings: Reading[] = fromFile.readings.flatMap((reading) => {
    const market = markets.find((candidate) => candidate.key === reading.key);
    return market ? [{ ...reading, label: market.label, group: market.group }] : [];
  });
  const errors = markets
    .filter((market) => !readings.some((reading) => reading.key === market.key))
    .map((market) => ({ key: market.key, reason: fromFile.missingNotes[market.key] ?? 'Not in the latest snapshot' }));
  return withChecks({ readings: new Map(readings.map((reading) => [reading.key, reading])), errors, feed, now });
}

export function stateFromQuotes(quotes: QuotesResponse, now: Date): ViewState {
  return withChecks({
    readings: new Map(quotes.readings.map((reading) => [reading.key, reading])),
    errors: quotes.errors,
    feed: { mode: 'api', checkedAt: quotes.asOf },
    now,
  });
}

function withChecks(state: Omit<ViewState, 'checks'>): ViewState {
  return { ...state, checks: checkRules(activePacks, state.readings, watchlist) };
}
