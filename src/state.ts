import { activeChecklists } from '../config/checklists.js';
import { markets } from '../config/markets.js';
import { watchlist } from '../config/watchlist.js';
import { activePacks } from '../packs/index.js';
import type { QuoteError, QuotesResponse, Reading } from '../shared/quotes.js';
import { readingsFromSnapshot } from '../shared/snapshot.js';
import { evaluateChecklist, type ChecklistResult } from './checklists/engine.js';
import { catalysts, snapshot } from './data.js';
import { checkRules, type RuleCheck } from './rules/engine.js';

export type Feed =
  | { mode: 'files' }
  | { mode: 'api'; checkedAt: string }
  | { mode: 'failed'; checkedAt: string };

export interface ViewState {
  /** Latest readings for the tickers, readings and trends sections: live where available. */
  readings: Map<string, Reading>;
  /** The last update's snapshot only, so rules and checklists reflect one moment: the run. */
  ruleReadings: Map<string, Reading>;
  errors: QuoteError[];
  checks: RuleCheck[];
  checklists: ChecklistResult[];
  feed: Feed;
  now: Date;
}

const fromFile = readingsFromSnapshot(snapshot);
const snapshotReadings: Map<string, Reading> = new Map(
  fromFile.readings.flatMap((reading) => {
    const market = markets.find((candidate) => candidate.key === reading.key);
    return market ? [[reading.key, { ...reading, label: market.label, group: market.group }] as [string, Reading]] : [];
  }),
);

export function stateFromSnapshotFile(now: Date, feed: Feed = { mode: 'files' }): ViewState {
  const errors = markets
    .filter((market) => !snapshotReadings.has(market.key))
    .map((market) => ({ key: market.key, reason: fromFile.missingNotes[market.key] ?? 'Not in the latest snapshot' }));
  return withChecks({ readings: new Map(snapshotReadings), errors, feed, now });
}

export function stateFromQuotes(quotes: QuotesResponse, now: Date): ViewState {
  return withChecks({
    readings: new Map(quotes.readings.map((reading) => [reading.key, reading])),
    errors: quotes.errors,
    feed: { mode: 'api', checkedAt: quotes.asOf },
    now,
  });
}

function withChecks(state: Omit<ViewState, 'checks' | 'checklists' | 'ruleReadings'>): ViewState {
  const ruleReadings = snapshotReadings;
  const checks = checkRules(activePacks, ruleReadings, watchlist);
  const checklists = activeChecklists.map((list) => evaluateChecklist(list, checks, ruleReadings, catalysts, state.now));
  return { ...state, ruleReadings, checks, checklists };
}
