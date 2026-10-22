import { markets } from '../../config/markets.js';
import type { MarketGroup } from '../../shared/quotes.js';
import { byId, el } from '../dom.js';
import { dayChangeDirection, formatDayChange, formatLevel } from '../format.js';
import { sourceTag } from '../sources.js';
import type { ViewState } from '../state.js';

const READING_GROUPS: MarketGroup[] = ['Metals', 'Miners', 'Rates', 'FX', 'Risk', 'Energy', 'Equities'];

export function renderReadings(state: ViewState): void {
  byId('readings-body').replaceChildren(
    ...READING_GROUPS.flatMap((group) => [
      groupRow(group),
      ...markets.filter((market) => market.group === group).map((market) => {
        const reading = state.readings.get(market.key);
        const missingReason = state.errors.find((error) => error.key === market.key)?.reason ?? '';
        const direction = reading ? dayChangeDirection(reading) : 0;
        return el(
          'tr',
          undefined,
          el('td', undefined, market.label),
          el('td', 'num', el('div', 'cell-stack', reading ? formatLevel(reading.value, market.format) : '—', reading && sourceTag(reading, state.now))),
          el('td', `num ${direction < 0 ? 'neg' : direction > 0 ? 'pos' : ''}`, reading ? formatDayChange(reading, market) : '—'),
          el('td', 'hide-narrow muted', reading ? reading.note : missingReason),
        );
      }),
    ]),
  );
}

function groupRow(group: MarketGroup): HTMLTableRowElement {
  const cell = el('td', undefined, group);
  cell.colSpan = 4;
  return el('tr', 'group-row', cell);
}
