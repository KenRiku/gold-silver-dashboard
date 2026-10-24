import { bindDrawerClose, openSourceDrawer } from './drawer.js';
import { fetchQuotes, pollInterval } from './polling.js';
import { renderBanner } from './render/banner.js';
import { renderChecklists } from './render/checklist.js';
import { renderHeader } from './render/header.js';
import { renderCatalysts, renderChanges } from './render/narrative.js';
import { renderReadings } from './render/readings.js';
import { renderRuleChecks, renderRuleCounts } from './render/rules.js';
import { renderSourcesSection } from './render/sources-section.js';
import { renderTickers } from './render/tickers.js';
import { renderTrends } from './render/trends.js';
import { stateFromQuotes, stateFromSnapshotFile, type ViewState } from './state.js';

function render(state: ViewState): void {
  renderBanner(state);
  renderHeader(state);
  renderRuleCounts(state);
  renderRuleChecks(state);
  renderChecklists(state);
  renderTickers(state);
  renderReadings(state);
  renderChanges();
  renderCatalysts();
  renderTrends(state);
  renderSourcesSection(state);
}

let state = stateFromSnapshotFile(new Date());
let nextPoll: number | undefined;
let lastPolledAt = 0;

async function refresh(): Promise<void> {
  window.clearTimeout(nextPoll);
  lastPolledAt = Date.now();
  const now = new Date();
  try {
    state = stateFromQuotes(await fetchQuotes(), new Date());
  } catch {
    state = stateFromSnapshotFile(new Date(), { mode: 'failed', checkedAt: now.toISOString() });
  }
  render(state);
  scheduleNext();
}

function scheduleNext(): void {
  if (document.hidden) return;
  nextPoll = window.setTimeout(refresh, pollInterval(new Date()));
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    window.clearTimeout(nextPoll);
    return;
  }
  if (Date.now() - lastPolledAt >= pollInterval(new Date())) void refresh();
  else scheduleNext();
});

document.addEventListener('click', (event) => {
  const tag = (event.target as HTMLElement).closest<HTMLElement>('.src-tag');
  if (!tag) return;
  const check = state.checks.find((candidate) => candidate.rule.id === tag.dataset.ruleId);
  if (check) {
    openSourceDrawer(check.rule.name, check.inputKeys.flatMap((key) => state.readings.get(key) ?? []), new Date());
    return;
  }
  if (tag.dataset.checkItem) {
    const [listId, itemId] = tag.dataset.checkItem.split(':');
    const item = state.checklists.find((list) => list.checklist.id === listId)?.items.find((candidate) => candidate.item.id === itemId);
    if (item) {
      openSourceDrawer(item.item.name, item.inputKeys.flatMap((key) => state.readings.get(key) ?? []), new Date());
      return;
    }
  }
  const reading = state.readings.get(tag.dataset.sourceKey ?? '');
  if (reading) openSourceDrawer(reading.label, [reading], new Date());
});

let lastWidth = window.innerWidth;
window.addEventListener('resize', () => {
  if (window.innerWidth === lastWidth) return;
  lastWidth = window.innerWidth;
  renderTrends(state);
});

bindDrawerClose();
render(state);
void refresh();
