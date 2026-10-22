import { dayBp, dayPct, level, monthPct, when } from '../src/rules/inputs.js';
import type { RulePack } from '../src/rules/types.js';

const goldAndYieldsFalling = { allOf: [when(dayPct('gold'), '<', 0), when(dayBp('us10y'), '<', 0)] };

export const preciousMetals: RulePack = {
  id: 'precious-metals',
  name: 'Precious metals',
  rules: [
    {
      id: 'liquidation',
      name: 'Forced selling in metals',
      tags: ['metals-liquidation'],
      requires: { allOf: [dayPct('gold'), dayBp('us10y')] },
      on: { allOf: [goldAndYieldsFalling, { anyOf: [when(dayPct('silver'), '<=', -3), when(dayPct('btc'), '<', 0)] }] },
      watch: goldAndYieldsFalling,
      reading: 'Gold {gold.chg_pct:pct}, 10Y {us10y.chg_bp:bp}, silver {silver.chg_pct:pct}',
      condition: 'Gold falls while the 10Y yield falls, plus silver down 3%+ or bitcoin down',
      pattern: 'Metals sold for cash, not because their case changed. In 2008, 2020 and 2024 this ran 1–10 sessions; gold steadied before stocks and before silver.',
    },
    {
      id: 'silver',
      name: 'Silver under extra stress',
      tags: ['silver'],
      requires: { anyOf: [dayPct('gs_ratio'), level('gs_ratio')] },
      on: { anyOf: [when(dayPct('gs_ratio'), '>=', 2), when(level('gs_ratio'), '>=', 80)] },
      watch: { anyOf: [when(dayPct('gs_ratio'), '>=', 1), when(level('gs_ratio'), '>=', 75)] },
      reading: 'Gold/silver ratio {gs_ratio.value:fixed1} ({gs_ratio.chg_pct:pct})',
      condition: 'Ratio up 2%+ on the day or above 80 (Watch: up 1%+ or above 75)',
      pattern: 'Silver lagging gold. In stress the ratio blows out (above 120 in March 2020) and silver bottoms later than gold.',
    },
    {
      id: 'miners',
      name: 'Miners lagging gold',
      tags: ['gold-miners'],
      requires: { allOf: [dayPct('gdx'), dayPct('gold')] },
      on: {
        anyOf: [
          { allOf: [when(dayPct('gold'), '<', 0), { relative: { a: dayPct('gdx'), b: dayPct('gold'), op: '<=', multiple: 2.5 } }] },
          { allOf: [when(dayPct('gold'), '>', 0), when(dayPct('gdx'), '<', 0)] },
        ],
      },
      watch: { allOf: [when(dayPct('gold'), '<', 0), { relative: { a: dayPct('gdx'), b: dayPct('gold'), op: '<=', multiple: 2 } }] },
      reading: 'GDX {gdx.chg_pct:pct} vs gold {gold.chg_pct:pct}',
      condition: 'GDX falls more than 2.5× gold, or falls while gold rises (Watch from 2×)',
      pattern: 'Equity selling or cost worries on top of the metal. Miners have usually led the recovery once they stop doing this.',
    },
    {
      id: 'trend',
      name: 'Gold short-term downtrend',
      tags: ['gold-trend'],
      requires: { allOf: [monthPct('gold')] },
      on: { trend: { key: 'gold', period: '1m', op: '<=', value: -5 } },
      watch: { trend: { key: 'gold', period: '1m', op: '<=', value: -2 } },
      reading: 'Gold {gold.chg_1m_pct:pct} over a month',
      condition: 'Gold down 5%+ over a month (Watch from 2%)',
      pattern: 'Dips that were liquidation inside an uptrend got bought; dips that kept going (2013) were a real repricing. ETF flows tell them apart.',
    },
  ],
};
