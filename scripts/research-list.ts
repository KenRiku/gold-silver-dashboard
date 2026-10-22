import { markets } from '../config/markets.js';
import { watchlist } from '../config/watchlist.js';
import { activePacks } from '../packs/index.js';

const fredKeys = new Set(markets.filter((market) => market.fredSeries).map((market) => market.key));

console.log('Markets to gather for data/snapshot.json (key: label):');
for (const market of markets) {
  const fallback = fredKeys.has(market.key) ? ' (FRED daily fills it if you find nothing fresher)' : '';
  const day = market.changeUnit === 'bp' ? 'day change in bp (chg_bp)' : 'day change in % (chg_pct)';
  console.log(`  ${market.key}: ${market.label}, level + ${day}${market.key === 'gold' ? ' + 1-month % change (chg_1m_pct)' : ''}${fallback}`);
}

console.log('\nTickers to cover in "What changed" and "Coming up" (with their drivers):');
for (const entry of watchlist) {
  const drivers = [entry.drivers.benchmark, entry.drivers.sector, ...entry.drivers.related].filter(Boolean).join(', ');
  console.log(`  ${entry.symbol} (${entry.exchange}, ${entry.name}): drivers ${drivers}`);
}

console.log('\nActive rule packs:');
for (const pack of activePacks) console.log(`  ${pack.name}: ${pack.rules.map((rule) => rule.name).join('; ')}`);
