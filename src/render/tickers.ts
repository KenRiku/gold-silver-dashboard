import { markets } from '../../config/markets.js';
import { watchlist } from '../../config/watchlist.js';
import { byId, el } from '../dom.js';
import { dayChangeDirection, formatDayChange, formatLevel } from '../format.js';
import { sourceTag } from '../sources.js';
import type { ViewState } from '../state.js';

export function renderTickers(state: ViewState): void {
  byId('tickers-body').replaceChildren(
    ...watchlist.map((entry) => {
      const market = markets.find((candidate) => candidate.key === entry.marketKey)!;
      const reading = state.readings.get(entry.marketKey);
      const rulesOn = state.checks.filter((check) => check.status === 'On' && check.tickers.includes(entry.symbol));
      const direction = reading ? dayChangeDirection(reading) : 0;
      return el(
        'tr',
        undefined,
        el('td', undefined, el('div', 'cell-stack', el('span', 'strong', entry.symbol), el('span', 'muted', entry.name))),
        el('td', 'num', el('div', 'cell-stack', reading ? formatLevel(reading.value, market.format) : '—', reading && sourceTag(reading, state.now))),
        el('td', `num ${direction < 0 ? 'neg' : direction > 0 ? 'pos' : ''}`, reading ? formatDayChange(reading, market) : '—'),
        el('td', rulesOn.length ? undefined : 'muted', rulesOn.length ? rulesOn.map((check) => check.rule.name).join(', ') : 'None'),
      );
    }),
  );
}
