import { renderHeader } from './render/header.js';
import { renderCatalysts, renderChanges } from './render/narrative.js';
import { renderReadings } from './render/readings.js';
import { renderRuleChecks, renderRuleCounts } from './render/rules.js';
import { renderSourcesSection } from './render/sources-section.js';
import { renderTickers } from './render/tickers.js';
import { renderTrends } from './render/trends.js';
import { stateFromSnapshotFile, type ViewState } from './state.js';

function render(state: ViewState): void {
  renderHeader(state);
  renderRuleCounts(state);
  renderRuleChecks(state);
  renderTickers(state);
  renderReadings(state);
  renderChanges();
  renderCatalysts();
  renderTrends(state);
  renderSourcesSection(state);
}

const state = stateFromSnapshotFile(new Date());
render(state);

let lastWidth = window.innerWidth;
window.addEventListener('resize', () => {
  if (window.innerWidth === lastWidth) return;
  lastWidth = window.innerWidth;
  renderTrends(state);
});
