import { regime } from '../data.js';
import { byId, setText } from '../dom.js';
import { formatAge, formatTimestamp } from '../format.js';
import type { ViewState } from '../state.js';

export function renderHeader(state: ViewState): void {
  setText('takeaway', regime.takeaway);
  setText('regime-asof', regime.as_of);
  setText('regime-run', regime.run);
  setText('regime-name', regime.regime);

  const feed = byId('feed');
  feed.dataset.mode = state.feed.mode;
  setText('feed-text', feedText(state));
}

function feedText(state: ViewState): string {
  const newest = [...state.readings.values()].reduce((latest, reading) => Math.max(latest, Date.parse(reading.asOf)), 0);
  const prices = newest ? `prices from ${formatTimestamp(new Date(newest).toISOString())} (${formatAge(new Date(newest).toISOString(), state.now)})` : 'no prices';
  switch (state.feed.mode) {
    case 'files': return `Delayed: ${prices}`;
    case 'api': return `Delayed: ${prices} · checked ${formatAge(state.feed.checkedAt, state.now)}`;
    case 'failed': return `Price feed unavailable: showing the last snapshot, ${prices}`;
  }
}
