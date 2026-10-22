import { dayPct, when } from '../src/rules/inputs.js';
import type { RulePack } from '../src/rules/types.js';

export const tech: RulePack = {
  id: 'tech',
  name: 'Tech',
  rules: [
    {
      id: 'nasdaq',
      name: 'Tech-led selloff',
      tags: ['nasdaq'],
      requires: { allOf: [dayPct('nasdaq')] },
      on: when(dayPct('nasdaq'), '<=', -1.5),
      watch: when(dayPct('nasdaq'), '<=', -0.8),
      reading: 'Nasdaq {nasdaq.chg_pct:pct}',
      condition: 'Nasdaq down 1.5% or more (Watch from 0.8%)',
      pattern: 'Tech leading lower. Daily-reset funds like TQQQ and SQQQ lose value in choppy two-way markets even if the index ends flat.',
    },
  ],
};
