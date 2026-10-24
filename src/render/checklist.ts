import type { ItemStatus } from '../checklists/types.js';
import { byId, el, externalLink } from '../dom.js';
import { oldestReading, sourceTag } from '../sources.js';
import type { ViewState } from '../state.js';

const ITEM_CLASS: Record<ItemStatus, string> = { Met: 'met', 'Not met': 'notmet', 'No reading': 'nodata' };

export function renderChecklists(state: ViewState): void {
  byId('checklists').replaceChildren(
    ...state.checklists.map((result) => {
      const { checklist } = result;
      const summary = el(
        'div',
        'check-summary',
        el('b', undefined, `${result.met} of ${result.total}`),
        el('span', 'strong', result.verdict),
        result.noReading ? el('span', 'muted', `${result.noReading} with no reading`) : null,
      );

      const rows = result.items.map((check) => {
        const inputReadings = check.inputKeys.flatMap((key) => state.ruleReadings.get(key) ?? []);
        const oldest = oldestReading(inputReadings);
        const tag = oldest && sourceTag(oldest, state.now);
        if (tag) tag.dataset.checkItem = `${checklist.id}:${check.item.id}`;
        const eventLink = check.event ? externalLink(check.event.url, 'Source', 'src-link') : null;
        const row = el(
          'tr',
          `is-${ITEM_CLASS[check.status]}`,
          el('td', 'status', el('span', 'status-wrap', el('i', `dot ${ITEM_CLASS[check.status]}`), check.status)),
          el('td', 'strong', check.item.name),
          el('td', 'num', el('div', 'cell-stack', check.reading, tag, eventLink)),
          el('td', 'hide-narrow', check.item.why),
        );
        row.dataset.checkItem = check.item.id;
        return row;
      });

      const card = el(
        'section',
        'card',
        el('h2', undefined, checklist.name),
        el('p', 'note', `${checklist.description} For ${checklist.tickers.join(', ')}.`),
        summary,
        el(
          'div',
          'scroll',
          el(
            'table',
            'table',
            el('thead', undefined, el('tr', undefined, el('th', undefined, 'Status'), el('th', undefined, 'Condition'), el('th', undefined, 'Reading'), el('th', 'hide-narrow', 'Why it matters'))),
            el('tbody', undefined, ...rows),
          ),
        ),
      );
      card.id = `checklist-${checklist.id}`;
      return card;
    }),
  );
}
