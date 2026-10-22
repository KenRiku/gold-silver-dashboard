import type { MarketGroup } from '../shared/quotes.js';

export interface Market {
  key: string;
  label: string;
  group: MarketGroup;
  changeUnit: 'pct' | 'bp';
  fredSeries?: string;
}

export const markets: Market[] = [
  { key: 'gold', label: 'Gold (spot)', group: 'Metals', changeUnit: 'pct' },
  { key: 'silver', label: 'Silver (spot)', group: 'Metals', changeUnit: 'pct' },
  { key: 'gs_ratio', label: 'Gold/silver ratio', group: 'Metals', changeUnit: 'pct' },
  { key: 'gdx', label: 'GDX', group: 'Miners', changeUnit: 'pct' },
  { key: 'gdxj', label: 'GDXJ', group: 'Miners', changeUnit: 'pct' },
  { key: 'gdxu', label: 'GDXU', group: 'Funds', changeUnit: 'pct' },
  { key: 'slv', label: 'SLV', group: 'Funds', changeUnit: 'pct' },
  { key: 'agq', label: 'AGQ', group: 'Funds', changeUnit: 'pct' },
  { key: 'qqq', label: 'QQQ', group: 'Funds', changeUnit: 'pct' },
  { key: 'tqqq', label: 'TQQQ', group: 'Funds', changeUnit: 'pct' },
  { key: 'sqqq', label: 'SQQQ', group: 'Funds', changeUnit: 'pct' },
  { key: 'nrgu', label: 'NRGU', group: 'Funds', changeUnit: 'pct' },
  { key: 'us10y', label: 'US 10Y yield', group: 'Rates', changeUnit: 'bp', fredSeries: 'DGS10' },
  { key: 'us2y', label: 'US 2Y yield', group: 'Rates', changeUnit: 'bp', fredSeries: 'DGS2' },
  { key: 'usdjpy', label: 'USD/JPY', group: 'FX', changeUnit: 'pct' },
  { key: 'dxy', label: 'Dollar index (DXY)', group: 'FX', changeUnit: 'pct' },
  { key: 'vix', label: 'VIX', group: 'Risk', changeUnit: 'pct' },
  { key: 'btc', label: 'Bitcoin', group: 'Risk', changeUnit: 'pct' },
  { key: 'brent', label: 'Brent crude', group: 'Energy', changeUnit: 'pct', fredSeries: 'DCOILBRENTEU' },
  { key: 'nasdaq', label: 'Nasdaq Composite', group: 'Equities', changeUnit: 'pct' },
  { key: 'spx', label: 'S&P 500', group: 'Equities', changeUnit: 'pct' },
];
