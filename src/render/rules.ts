import { byId, el, setText } from '../dom.js';
import type { Status } from '../rules/types.js';
import { oldestReading, sourceTag } from '../sources.js';
import type { ViewState } from '../state.js';

export const STATUS_CLASS: Record<Status, string> = { On: 'on', Watch: 'watch', Off: 'off', 'No reading': 'nodata' };

export function renderRuleCounts(state: ViewState): void {
  const count = (status: Status) => String(state.checks.filter((check) => check.status === status).length);
  setText('rule-total', String(state.checks.length));
  setText('count-on', count('On'));
  setText('count-watch', count('Watch'));
  setText('count-off', count('Off'));
  setText('count-nodata', count('No reading'));
}

export function renderRuleChecks(state: ViewState): void {
  byId('rules-body').replaceChildren(
    ...state.checks.map((check) => {
      const inputReadings = check.inputKeys.flatMap((key) => state.readings.get(key) ?? []);
      const oldest = oldestReading(inputReadings);
      const row = el(
        'tr',
        `is-${STATUS_CLASS[check.status]}`,
        el('td', 'status', el('span', 'status-wrap', el('i', `dot ${STATUS_CLASS[check.status]}`), check.status)),
        el('td', 'strong', check.rule.name),
        el('td', 'num', el('div', 'cell-stack', check.reading, oldest && sourceTag(oldest, state.now))),
        el('td', 'hide-narrow', check.rule.condition),
        el('td', undefined, check.rule.pattern),
        el('td', undefined, check.tickers.join(', ')),
      );
      row.dataset.rule = check.rule.id;
      return row;
    }),
  );
}
