import { describe, expect, it } from 'vitest';
import { watchlist } from '../config/watchlist.js';
import snapshotFile from '../data/snapshot.json';
import { activePacks } from '../packs/index.js';
import type { Snapshot } from '../shared/quotes.js';
import { checkRules, type RuleInputs } from '../src/rules/engine.js';
import type { Status } from '../src/rules/types.js';

type Values = Partial<{ value: number; chg_pct: number; chg_bp: number; chg_1m_pct: number }>;

function inputsFrom(markets: Record<string, Values>): RuleInputs {
  return new Map(
    Object.entries(markets).map(([key, values]) => [
      key,
      { value: values.value ?? null, chg_pct: values.chg_pct ?? null, chg_bp: values.chg_bp ?? null, chg_1m_pct: values.chg_1m_pct ?? null },
    ]),
  );
}

function statusOf(ruleId: string, markets: Record<string, Values>): Status {
  const check = checkRules(activePacks, inputsFrom(markets), watchlist).find((candidate) => candidate.rule.id === ruleId);
  if (!check) throw new Error(`No rule ${ruleId}`);
  return check.status;
}

const edgeCases: Array<[ruleId: string, markets: Record<string, Values>, expected: Status]> = [
  ['liquidation', { gold: { chg_pct: -0.1 }, us10y: { chg_bp: -1 }, silver: { chg_pct: -3 } }, 'On'],
  ['liquidation', { gold: { chg_pct: -0.1 }, us10y: { chg_bp: -1 }, silver: { chg_pct: -2.9 }, btc: { chg_pct: -0.1 } }, 'On'],
  ['liquidation', { gold: { chg_pct: -0.1 }, us10y: { chg_bp: -1 }, silver: { chg_pct: -2.9 }, btc: { chg_pct: 0.5 } }, 'Watch'],
  ['liquidation', { gold: { chg_pct: -0.1 }, us10y: { chg_bp: -1 } }, 'Watch'],
  ['liquidation', { gold: { chg_pct: 0.1 }, us10y: { chg_bp: -1 }, silver: { chg_pct: -5 } }, 'Off'],
  ['liquidation', { us10y: { chg_bp: -1 }, silver: { chg_pct: -5 } }, 'No reading'],

  ['carry', { usdjpy: { chg_pct: -0.7 } }, 'On'],
  ['carry', { usdjpy: { chg_pct: -0.4 } }, 'Watch'],
  ['carry', { usdjpy: { chg_pct: -0.39 } }, 'Off'],
  ['carry', {}, 'No reading'],

  ['fear', { vix: { value: 25 } }, 'On'],
  ['fear', { vix: { value: 20 } }, 'Watch'],
  ['fear', { vix: { value: 19.9 } }, 'Off'],
  ['fear', { vix: { chg_pct: 30 } }, 'No reading'],

  ['silver', { gs_ratio: { chg_pct: 2, value: 70 } }, 'On'],
  ['silver', { gs_ratio: { value: 80 } }, 'On'],
  ['silver', { gs_ratio: { chg_pct: 1, value: 70 } }, 'Watch'],
  ['silver', { gs_ratio: { value: 75 } }, 'Watch'],
  ['silver', { gs_ratio: { chg_pct: 0.9, value: 74.9 } }, 'Off'],
  ['silver', {}, 'No reading'],

  ['oil', { brent: { value: 100 } }, 'On'],
  ['oil', { brent: { value: 80, chg_pct: 3 } }, 'On'],
  ['oil', { brent: { value: 90 } }, 'Watch'],
  ['oil', { brent: { value: 80, chg_pct: 1.5 } }, 'Watch'],
  ['oil', { brent: { value: 89.99, chg_pct: 1.49 } }, 'Off'],
  ['oil', {}, 'No reading'],

  ['growth', { us10y: { chg_bp: -10 } }, 'On'],
  ['growth', { us10y: { chg_bp: -5 } }, 'Watch'],
  ['growth', { us10y: { chg_bp: -4 } }, 'Off'],
  ['growth', {}, 'No reading'],

  ['hawkish', { us2y: { chg_bp: 8 } }, 'On'],
  ['hawkish', { us2y: { chg_bp: 4 } }, 'Watch'],
  ['hawkish', { us2y: { chg_bp: 3 } }, 'Off'],
  ['hawkish', {}, 'No reading'],

  ['nasdaq', { nasdaq: { chg_pct: -1.5 } }, 'On'],
  ['nasdaq', { nasdaq: { chg_pct: -0.8 } }, 'Watch'],
  ['nasdaq', { nasdaq: { chg_pct: -0.79 } }, 'Off'],
  ['nasdaq', {}, 'No reading'],

  ['miners', { gold: { chg_pct: -1 }, gdx: { chg_pct: -2.5 } }, 'On'],
  ['miners', { gold: { chg_pct: 1 }, gdx: { chg_pct: -0.1 } }, 'On'],
  ['miners', { gold: { chg_pct: -1 }, gdx: { chg_pct: -2 } }, 'Watch'],
  ['miners', { gold: { chg_pct: -1 }, gdx: { chg_pct: -1.9 } }, 'Off'],
  ['miners', { gold: { chg_pct: 1 }, gdx: { chg_pct: 1 } }, 'Off'],
  ['miners', { gold: { chg_pct: -1 } }, 'No reading'],

  ['trend', { gold: { chg_1m_pct: -5 } }, 'On'],
  ['trend', { gold: { chg_1m_pct: -2 } }, 'Watch'],
  ['trend', { gold: { chg_1m_pct: -1.9 } }, 'Off'],
  ['trend', { gold: { chg_pct: -3 } }, 'No reading'],
];

describe('rule edges', () => {
  it.each(edgeCases)('%s with %j is %s', (ruleId, markets, expected) => {
    expect(statusOf(ruleId, markets)).toBe(expected);
  });
});

describe('22 Oct 2026 fixture', () => {
  const fixture = inputsFrom({
    gold: { value: 4040, chg_pct: -2.4, chg_1m_pct: -5.8 },
    silver: { value: 54.53, chg_pct: -5.75 },
    gs_ratio: { value: 74.1, chg_pct: 3.5 },
    us10y: { value: 4.98, chg_bp: -14 },
    usdjpy: { value: 156.83, chg_pct: -0.83 },
    btc: { value: 81700, chg_pct: -2 },
    brent: { value: 111.5 },
    nasdaq: { value: 26150.78, chg_pct: -2.07 },
    spx: { value: 7658.24, chg_pct: -1.27 },
  });

  it('gives 7 On and 3 No reading', () => {
    const statuses = checkRules(activePacks, fixture, watchlist).map((check) => check.status);
    expect(statuses.filter((status) => status === 'On')).toHaveLength(7);
    expect(statuses.filter((status) => status === 'No reading')).toHaveLength(3);
  });

  // The committed snapshot changes with every scheduled run, so only check that it evaluates cleanly.
  it('evaluates every rule against the committed snapshot file', () => {
    const snapshot = snapshotFile as Snapshot;
    const fromFile: RuleInputs = new Map(snapshot.readings.map((row) => [row.key, row]));
    const checks = checkRules(activePacks, fromFile, watchlist);
    expect(checks).toHaveLength(activePacks.flatMap((pack) => pack.rules).length);
    for (const check of checks) expect(['On', 'Watch', 'Off', 'No reading']).toContain(check.status);
  });
});

describe('ticker links derived from the watchlist', () => {
  const referenceTickers: Record<string, string[]> = {
    liquidation: ['GDX', 'GDXU', 'GDXJ', 'SLV', 'AGQ'],
    carry: ['QQQ', 'TQQQ', 'SQQQ', 'SLV', 'AGQ'],
    fear: ['TQQQ', 'SQQQ', 'GDXU', 'AGQ'],
    silver: ['SLV', 'AGQ'],
    oil: ['NRGU', 'GDX', 'GDXU', 'GDXJ'],
    growth: ['GDX', 'GDXU', 'QQQ'],
    hawkish: ['QQQ', 'TQQQ', 'GDX', 'GDXU', 'SLV', 'AGQ'],
    nasdaq: ['QQQ', 'TQQQ', 'SQQQ'],
    miners: ['GDX', 'GDXU', 'GDXJ'],
    trend: ['GDX', 'GDXU', 'GDXJ', 'SLV', 'AGQ'],
  };

  it.each(Object.entries(referenceTickers))('%s touches the reference tickers', (ruleId, expected) => {
    const check = checkRules(activePacks, new Map(), watchlist).find((candidate) => candidate.rule.id === ruleId)!;
    expect([...check.tickers].sort()).toEqual([...expected].sort());
  });
});
