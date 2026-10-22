import { catalysts, changes, dataCommitTimes } from '../data.js';
import { byId, el, externalLink, setText } from '../dom.js';
import { formatTimestamp } from '../format.js';

export function renderChanges(): void {
  setText('changes-commit', committedText('changes.json'));
  byId('changes-list').replaceChildren(
    ...changes.map((change) => el('li', undefined, change.text + ' ', externalLink(change.url, change.source))),
  );
}

export function renderCatalysts(): void {
  setText('catalysts-commit', committedText('catalysts.json'));
  byId('catalysts-body').replaceChildren(
    ...catalysts.map((catalyst) =>
      el(
        'tr',
        undefined,
        el('td', 'num', catalyst.when),
        el('td', undefined, el('div', 'cell-stack', el('span', 'strong', catalyst.event), externalLink(catalyst.url, 'Source', 'src-link'))),
        el('td', undefined, catalyst.why),
      ),
    ),
  );
}

export function committedText(fileName: string): string {
  const committedAt = dataCommitTimes[fileName];
  return committedAt ? `committed ${formatTimestamp(committedAt)}` : 'commit time unavailable';
}
