import type { MarketGroup } from '../shared/quotes.js';

export interface Market {
  key: string;
  label: string;
  group: MarketGroup;
  changeUnit: 'pct' | 'bp';
  format: LevelFormat;
  fredSeries?: string;
}

export type LevelFormat = 'usd0' | 'usd2' | 'percent2' | 'number0' | 'number1' | 'number2';

export const markets: Market[] = [
  { key: 'gold', label: 'Gold (spot)', group: 'Metals', format: 'usd0', changeUnit: 'pct' },
  { key: 'silver', label: 'Silver (spot)', group: 'Metals', format: 'usd2', changeUnit: 'pct' },
  { key: 'gs_ratio', label: 'Gold/silver ratio', group: 'Metals', format: 'number1', changeUnit: 'pct' },
  { key: 'gdx', label: 'GDX', group: 'Miners', format: 'usd2', changeUnit: 'pct' },
  { key: 'gdxj', label: 'GDXJ', group: 'Miners', format: 'usd2', changeUnit: 'pct' },
  { key: 'gdxu', label: 'GDXU', group: 'Funds', format: 'usd2', changeUnit: 'pct' },
  { key: 'slv', label: 'SLV', group: 'Funds', format: 'usd2', changeUnit: 'pct' },
  { key: 'agq', label: 'AGQ', group: 'Funds', format: 'usd2', changeUnit: 'pct' },
  { key: 'qqq', label: 'QQQ', group: 'Funds', format: 'usd2', changeUnit: 'pct' },
  { key: 'tqqq', label: 'TQQQ', group: 'Funds', format: 'usd2', changeUnit: 'pct' },
  { key: 'sqqq', label: 'SQQQ', group: 'Funds', format: 'usd2', changeUnit: 'pct' },
  { key: 'nrgu', label: 'NRGU', group: 'Funds', format: 'usd2', changeUnit: 'pct' },
  { key: 'us10y', label: 'US 10Y yield', group: 'Rates', format: 'percent2', changeUnit: 'bp', fredSeries: 'DGS10' },
  { key: 'us2y', label: 'US 2Y yield', group: 'Rates', format: 'percent2', changeUnit: 'bp', fredSeries: 'DGS2' },
  { key: 'usdjpy', label: 'USD/JPY', group: 'FX', format: 'number2', changeUnit: 'pct' },
  { key: 'dxy', label: 'Dollar index (DXY)', group: 'FX', format: 'number2', changeUnit: 'pct' },
  { key: 'vix', label: 'VIX', group: 'Risk', format: 'number1', changeUnit: 'pct' },
  { key: 'btc', label: 'Bitcoin', group: 'Risk', format: 'usd0', changeUnit: 'pct' },
  { key: 'brent', label: 'Brent crude', group: 'Energy', format: 'usd2', changeUnit: 'pct', fredSeries: 'DCOILBRENTEU' },
  { key: 'nasdaq', label: 'Nasdaq Composite', group: 'Equities', format: 'number0', changeUnit: 'pct' },
  { key: 'spx', label: 'S&P 500', group: 'Equities', format: 'number0', changeUnit: 'pct' },
];
