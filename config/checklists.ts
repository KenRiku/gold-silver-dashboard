import type { Checklist } from '../src/checklists/types.js';
import { dayPct, level, when } from '../src/rules/inputs.js';

/**
 * Miners entry checklist: conditions that were in place before gold miners bottomed in past
 * selloffs (2008, 2020, 2024). It counts conditions; it is not a buy signal.
 */
export const minersEntry: Checklist = {
  id: 'miners-entry',
  name: 'Miners entry checklist',
  description: 'Conditions that were in place before gold miners bottomed in past selloffs (2008, 2020, 2024). A count of conditions, not a buy signal.',
  tickers: ['GDX', 'GDXU', 'GDXJ'],
  items: [
    {
      id: 'forced-selling-over',
      name: 'Forced selling has stopped',
      test: { rule: { id: 'liquidation', metWhen: ['Off'] } },
      why: 'Miners rarely bottomed while metals were still being sold for cash.',
    },
    {
      id: 'miners-keeping-pace',
      name: 'Miners no longer falling harder than gold',
      test: { rule: { id: 'miners', metWhen: ['Off'] } },
      why: 'Miners have usually led the recovery once they stop underperforming the metal.',
    },
    {
      id: 'silver-keeping-up',
      name: 'Silver keeping up with gold',
      test: {
        condition: {
          requires: [dayPct('gs_ratio')],
          met: when(dayPct('gs_ratio'), '<=', 0),
          reading: 'Gold/silver ratio {gs_ratio.chg_pct:pct} on the day',
        },
      },
      why: 'A rising ratio means stress is still building; it tends to fall as markets settle.',
    },
    {
      id: 'gold-above-4000',
      name: 'Gold holding $4,000',
      test: {
        condition: {
          requires: [level('gold')],
          met: when(level('gold'), '>=', 4000),
          reading: 'Gold {gold.value:usd0}',
        },
      },
      why: 'A lasting break below a big round level marked a real repricing in 2013, not a dip.',
    },
    {
      id: 'gold-trend-easing',
      name: "Gold's monthly slide easing",
      test: { rule: { id: 'trend', metWhen: ['Off', 'Watch'] } },
      why: 'A monthly drop of 5% or more means the downtrend is still in charge.',
    },
    {
      id: 'volatility-contained',
      name: 'Volatility below panic levels',
      test: { rule: { id: 'fear', metWhen: ['Off', 'Watch'] } },
      why: 'With the VIX above 25, forced selling tends to spread across assets.',
    },
    {
      id: 'no-hike-priced',
      name: 'No Fed hike being priced',
      test: { rule: { id: 'hawkish', metWhen: ['Off'] } },
      why: 'A jump in short-term yields has been the strongest headwind for gold.',
    },
    {
      id: 'no-big-event',
      name: 'No major event in the next 2 days',
      test: {
        noEvent: {
          withinDays: 2,
          keywords: ['Fed rate', 'FOMC', 'Bank of Japan', 'CPI', 'PCE', 'jobs report', 'payrolls', 'Newmont', 'Agnico', 'Barrick'],
        },
      },
      why: 'Fed and BoJ decisions, inflation data and big-miner results can reverse a move in a day.',
    },
  ],
};

export const activeChecklists: Checklist[] = [minersEntry];
