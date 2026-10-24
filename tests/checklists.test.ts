import { describe, expect, it } from 'vitest';
import { minersEntry } from '../config/checklists.js';
import { watchlist } from '../config/watchlist.js';
import { activePacks } from '../packs/index.js';
import type { CatalystRow } from '../shared/data-files.js';
import { evaluateChecklist, pacificDate, upcomingEvents } from '../src/checklists/engine.js';
import type { ItemStatus } from '../src/checklists/types.js';
import { checkRules, type RuleInputs } from '../src/rules/engine.js';

type Values = Partial<{ value: number; chg_pct: number; chg_bp: number; chg_1m_pct: number }>;

function inputsFrom(markets: Record<string, Values>): RuleInputs {
  return new Map(
    Object.entries(markets).map(([key, values]) => [
      key,
      { value: values.value ?? null, chg_pct: values.chg_pct ?? null, chg_bp: values.chg_bp ?? null, chg_1m_pct: values.chg_1m_pct ?? null },
    ]),
  );
}

// Friday 23 Oct 2026, 8 PM Pacific
const NOW = new Date('2026-10-24T03:00:00Z');

const catalyst = (date: string, event: string): CatalystRow => ({ date, when: date, event, why: '', url: 'https://example.com' });

function evaluate(markets: Record<string, Values>, catalysts: CatalystRow[] = [], now = NOW) {
  const inputs = inputsFrom(markets);
  return evaluateChecklist(minersEntry, checkRules(activePacks, inputs, watchlist), inputs, catalysts, now);
}

function itemStatus(itemId: string, markets: Record<string, Values>, catalysts: CatalystRow[] = []): ItemStatus {
  const item = evaluate(markets, catalysts).items.find((check) => check.item.id === itemId);
  if (!item) throw new Error(`No item ${itemId}`);
  return item.status;
}

describe('miners entry items', () => {
  const cases: Array<[itemId: string, markets: Record<string, Values>, expected: ItemStatus]> = [
    ['forced-selling-over', { gold: { chg_pct: 0.5 }, us10y: { chg_bp: -3 } }, 'Met'],
    ['forced-selling-over', { gold: { chg_pct: -0.5 }, us10y: { chg_bp: -3 } }, 'Not met'],
    ['forced-selling-over', { gold: { chg_pct: -0.5 } }, 'No reading'],

    ['miners-keeping-pace', { gold: { chg_pct: -1 }, gdx: { chg_pct: -1.5 } }, 'Met'],
    ['miners-keeping-pace', { gold: { chg_pct: -1 }, gdx: { chg_pct: -2 } }, 'Not met'],
    ['miners-keeping-pace', { gold: { chg_pct: -1 } }, 'No reading'],

    ['silver-keeping-up', { gs_ratio: { chg_pct: 0 } }, 'Met'],
    ['silver-keeping-up', { gs_ratio: { chg_pct: 0.2 } }, 'Not met'],
    ['silver-keeping-up', { gs_ratio: { value: 74 } }, 'No reading'],

    ['gold-above-4000', { gold: { value: 4000 } }, 'Met'],
    ['gold-above-4000', { gold: { value: 3999 } }, 'Not met'],
    ['gold-above-4000', {}, 'No reading'],

    ['gold-trend-easing', { gold: { chg_1m_pct: -3 } }, 'Met'],
    ['gold-trend-easing', { gold: { chg_1m_pct: -5 } }, 'Not met'],
    ['gold-trend-easing', {}, 'No reading'],

    ['volatility-contained', { vix: { value: 22 } }, 'Met'],
    ['volatility-contained', { vix: { value: 25 } }, 'Not met'],

    ['no-hike-priced', { us2y: { chg_bp: 3 } }, 'Met'],
    ['no-hike-priced', { us2y: { chg_bp: 4 } }, 'Not met'],
  ];

  it.each(cases)('%s with %j is %s', (itemId, markets, expected) => {
    expect(itemStatus(itemId, markets)).toBe(expected);
  });
});

describe('major event window', () => {
  it('uses the Pacific date', () => {
    expect(pacificDate(NOW)).toBe('2026-10-23');
  });

  it('is met when the next big event is more than 2 days away', () => {
    expect(itemStatus('no-big-event', {}, [catalyst('2026-10-28', 'Fed rate decision')])).toBe('Met');
  });

  it('is not met when a big event is within 2 days', () => {
    expect(itemStatus('no-big-event', {}, [catalyst('2026-10-25', 'Agnico Eagle Q3 results')])).toBe('Not met');
  });

  it('ignores events that are not on the keyword list', () => {
    expect(itemStatus('no-big-event', {}, [catalyst('2026-10-24', 'Amazon Q3 results')])).toBe('Met');
  });

  it('ignores events that have passed', () => {
    expect(upcomingEvents([catalyst('2026-10-22', 'Newmont Q3 results')], ['Newmont'], NOW, 2)).toHaveLength(0);
  });
});

describe('22 Oct 2026 fixture', () => {
  it('meets none of the price conditions on a forced-selling day', () => {
    const result = evaluate({
      gold: { value: 4040, chg_pct: -2.4, chg_1m_pct: -5.8 },
      silver: { value: 54.53, chg_pct: -5.75 },
      gs_ratio: { value: 74.1, chg_pct: 3.5 },
      us10y: { value: 4.98, chg_bp: -14 },
      btc: { value: 81700, chg_pct: -2 },
    });
    const byId = Object.fromEntries(result.items.map((check) => [check.item.id, check.status]));
    expect(byId['forced-selling-over']).toBe('Not met');
    expect(byId['silver-keeping-up']).toBe('Not met');
    expect(byId['gold-trend-easing']).toBe('Not met');
    expect(byId['gold-above-4000']).toBe('Met');
    expect(result.total).toBe(minersEntry.items.length);
  });
});
