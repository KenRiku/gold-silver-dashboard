export interface WatchlistEntry {
  symbol: string;
  marketKey: string;
  exchange: string;
  name: string;
  leverage: number;
  packs: string[];
  exposures: string[];
  drivers: { benchmark: string; sector?: string; related: string[] };
}

export const watchlist: WatchlistEntry[] = [
  {
    symbol: 'GDX', marketKey: 'gdx', exchange: 'NYSEARCA', name: 'VanEck Gold Miners ETF', leverage: 1,
    packs: ['precious-metals'],
    exposures: ['gold-miners', 'metals-liquidation', 'oil-costs', 'growth-scare', 'rate-hikes', 'gold-trend'],
    drivers: { benchmark: 'gold', sector: 'gdx', related: ['us10y', 'usdjpy', 'brent'] },
  },
  {
    symbol: 'GDXU', marketKey: 'gdxu', exchange: 'NYSEARCA', name: 'MicroSectors Gold Miners 3X Leveraged ETN', leverage: 3,
    packs: ['precious-metals'],
    exposures: ['gold-miners', 'metals-liquidation', 'oil-costs', 'growth-scare', 'rate-hikes', 'gold-trend', 'volatility'],
    drivers: { benchmark: 'gold', sector: 'gdx', related: ['us10y', 'vix', 'brent'] },
  },
  {
    symbol: 'GDXJ', marketKey: 'gdxj', exchange: 'NYSEARCA', name: 'VanEck Junior Gold Miners ETF', leverage: 1,
    packs: ['precious-metals'],
    exposures: ['gold-miners', 'metals-liquidation', 'oil-costs', 'gold-trend'],
    drivers: { benchmark: 'gold', sector: 'gdxj', related: ['silver', 'brent'] },
  },
  {
    symbol: 'SLV', marketKey: 'slv', exchange: 'NYSEARCA', name: 'iShares Silver Trust', leverage: 1,
    packs: ['precious-metals'],
    exposures: ['silver', 'metals-liquidation', 'yen-carry', 'rate-hikes', 'gold-trend'],
    drivers: { benchmark: 'silver', related: ['gs_ratio', 'usdjpy', 'us2y'] },
  },
  {
    symbol: 'AGQ', marketKey: 'agq', exchange: 'NYSEARCA', name: 'ProShares Ultra Silver (2x)', leverage: 2,
    packs: ['precious-metals'],
    exposures: ['silver', 'metals-liquidation', 'yen-carry', 'rate-hikes', 'gold-trend', 'volatility'],
    drivers: { benchmark: 'silver', related: ['gs_ratio', 'usdjpy', 'vix'] },
  },
  {
    symbol: 'QQQ', marketKey: 'qqq', exchange: 'NASDAQ', name: 'Invesco QQQ Trust', leverage: 1,
    packs: ['tech'],
    exposures: ['nasdaq', 'yen-carry', 'growth-scare', 'rate-hikes'],
    drivers: { benchmark: 'nasdaq', related: ['us10y', 'us2y', 'usdjpy'] },
  },
  {
    symbol: 'TQQQ', marketKey: 'tqqq', exchange: 'NASDAQ', name: 'ProShares UltraPro QQQ (3x)', leverage: 3,
    packs: ['tech'],
    exposures: ['nasdaq', 'yen-carry', 'rate-hikes', 'volatility'],
    drivers: { benchmark: 'nasdaq', related: ['us2y', 'vix', 'usdjpy'] },
  },
  {
    symbol: 'SQQQ', marketKey: 'sqqq', exchange: 'NASDAQ', name: 'ProShares UltraPro Short QQQ (−3x)', leverage: -3,
    packs: ['tech'],
    exposures: ['nasdaq', 'yen-carry', 'volatility'],
    drivers: { benchmark: 'nasdaq', related: ['vix', 'usdjpy'] },
  },
  {
    symbol: 'NRGU', marketKey: 'nrgu', exchange: 'NYSEARCA', name: 'MicroSectors U.S. Big Oil 3X Leveraged ETN', leverage: 3,
    packs: ['macro'],
    exposures: ['oil'],
    drivers: { benchmark: 'brent', related: ['spx'] },
  },
];
