import { snapshot } from '../data.js';
import { byId } from '../dom.js';
import { formatTimestamp } from '../format.js';
import type { ViewState } from '../state.js';

export function renderBanner(state: ViewState): void {
  const banner = byId('banner');
  banner.hidden = state.feed.mode !== 'failed';
  if (state.feed.mode === 'failed') {
    banner.textContent = `The price feed didn’t respond at ${formatTimestamp(state.feed.checkedAt)}. Showing the last snapshot, from ${formatTimestamp(snapshot.asOf)}. Retrying automatically.`;
  }
}
