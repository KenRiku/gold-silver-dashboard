import type { Reading } from '../shared/quotes.js';
import { byId, el, externalLink, setText } from './dom.js';
import { formatAge, formatTimestamp } from './format.js';
import { sourceLabel } from './sources.js';

const DELAY_TEXT: Record<Reading['source']['kind'], string> = {
  live: 'Live quote from the provider, refreshed about once a minute (cached 60 s)',
  snapshot: 'Not a streaming feed: gathered by a scheduled Claude run (twice a day, or on demand)',
  daily: 'Daily official series, published after the close',
  computed: 'Worked out from the readings it is computed from',
};

export function openSourceDrawer(title: string, readings: Reading[], now: Date): void {
  setText('drawer-title', title);
  byId('drawer-body').replaceChildren(
    ...(readings.length ? readings.flatMap((reading) => readingDetails(reading, now, readings.length > 1)) : [el('dd', undefined, 'No input has a reading yet.')]),
  );
  const drawer = byId('drawer');
  drawer.hidden = false;
  byId<HTMLButtonElement>('drawer-close').focus();
}

export function closeSourceDrawer(): void {
  byId('drawer').hidden = true;
}

export function bindDrawerClose(): void {
  byId('drawer-close').addEventListener('click', closeSourceDrawer);
  byId('drawer').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeSourceDrawer();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSourceDrawer();
  });
}

function readingDetails(reading: Reading, now: Date, showMarket: boolean): HTMLElement[] {
  const rows: Array<[string, Node | string]> = [
    ...(showMarket ? ([['Market', reading.label]] as Array<[string, string]>) : []),
    ['Provider', sourceLabel(reading)],
    ['Symbol queried', reading.source.symbol ?? (reading.source.kind === 'snapshot' ? 'Read from the page linked below' : '—')],
    ['As of', `${formatTimestamp(reading.asOf)} (${formatAge(reading.asOf, now)})`],
    ['Exact time', reading.asOf],
    ['Delay', reading.delayMinutes === null ? DELAY_TEXT[reading.source.kind] : `${reading.delayMinutes} min`],
    ['Page', externalLink(reading.source.url, reading.source.url) ?? 'No link given'],
  ];
  return rows.flatMap(([term, detail]) => [el('dt', undefined, term), el('dd', undefined, detail)]);
}
