import { catalysts, changes, dataCommitTimes } from '../data.js';
import { byId, el, externalLink } from '../dom.js';
import { formatTimestamp } from '../format.js';
import type { ViewState } from '../state.js';

interface SourceLink {
  name: string;
  url: string;
  detail?: string;
}

export function renderSourcesSection(state: ViewState): void {
  byId('sources-body').replaceChildren(
    group('Prices and levels', priceSources(state)),
    group('What changed', uniqueByUrl(changes.map((change) => ({ name: change.source, url: change.url })))),
    group('Coming up', uniqueByUrl(catalysts.map((catalyst) => ({ name: catalyst.event, url: catalyst.url })))),
    group('Data files', Object.entries(dataCommitTimes).map(([file, committedAt]) => ({
      name: `data/${file}`,
      url: `https://github.com/KenRiku/gold-silver-dashboard/commits/main/data/${file}`,
      detail: committedAt ? `committed ${formatTimestamp(committedAt)}` : 'commit time unavailable',
    }))),
  );
}

function priceSources(state: ViewState): SourceLink[] {
  const byName = new Map<string, { url: string; labels: string[] }>();
  for (const reading of state.readings.values()) {
    if (reading.source.kind === 'computed') continue;
    const entry = byName.get(reading.source.name) ?? { url: reading.source.url, labels: [] };
    entry.labels.push(reading.label);
    byName.set(reading.source.name, entry);
  }
  const links: SourceLink[] = [...byName].map(([name, { url, labels }]) => ({ name, url, detail: labels.join(', ') }));
  if ([...state.readings.values()].some((reading) => reading.source.kind === 'daily')) {
    links.push({ name: 'Source: Federal Reserve Bank of St. Louis, FRED', url: 'https://fred.stlouisfed.org/', detail: 'daily official series' });
  }
  return links;
}

function uniqueByUrl(links: SourceLink[]): SourceLink[] {
  return [...new Map(links.map((link) => [link.url, link])).values()];
}

function group(title: string, links: SourceLink[]): HTMLElement {
  return el(
    'div',
    undefined,
    el('h3', undefined, title),
    el('ul', undefined, ...links.map((link) => el('li', undefined, externalLink(link.url, link.name) ?? link.name, link.detail ? ` · ${link.detail}` : ''))),
  );
}
