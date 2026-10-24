# Gold & silver dashboard

Pattern flags for gold, silver, miners and the Nasdaq, rebuilt from the Claude dashboard as a public Vercel site. Pattern flags, not trade signals.

Tickers followed: GDXU, GDX, GDXJ, SLV, AGQ, QQQ, TQQQ, SQQQ, NRGU (US-listed MicroSectors U.S. Big Oil 3x ETN, NYSE Arca).

## How data gets here

- `data/*.json`: written by scheduled Claude runs (12:00 AM Tue–Sat and 5:45 AM Mon–Fri, Pacific) that commit to `main`. Vercel redeploys on each commit. A run can also be started by hand with "Run now" on the routine in claude.ai.
- `/api/quotes`: merges `data/snapshot.json` with FRED daily series and returns one reading per market with its source and as-of time, cached at the edge for 60 s.
- Rules run in the browser from rule packs in `packs/`, against the watchlist in `config/watchlist.ts`.
- Checklists in `config/checklists.ts` (currently the miners entry checklist) count how many conditions are in place, built from rule statuses, readings and the events in `data/catalysts.json`. A count of conditions, not a buy signal.

`npm run validate-data` checks the shape of every file in `data/`. Scheduled runs must pass it before pushing, and the Vercel build runs it too, so a bad file never replaces the live site. Run instructions: [`docs/scheduled-run.md`](docs/scheduled-run.md).

## Data provider decision (2026-10-22)

No live market data API for now. Compared on 2026-10-22:

| Provider | Free tier | Public display on free tier |
|---|---|---|
| Twelve Data | 8 credits/min, 800/day, 1 credit per symbol | No: Basic is "internal non-display usage only"; external display needs Venture ($149/mo) ([terms](https://twelvedata.com/terms)) |
| Financial Modeling Prep | 250 calls/day | No: needs a separate Data Display and Licensing Agreement |
| Finnhub | ~60 calls/min, one symbol per call | No: "strictly for personal use" ([terms](https://finnhub.io/terms-of-service)) |

Tiingo, EODHD, Alpha Vantage and Polygon free tiers are also personal-use only. Showing licensed data publicly would cost about $149/mo, so the site instead uses:

- **Claude snapshot** (`data/snapshot.json`): levels gathered from news and market sites at each scheduled run, each row naming its source.
- **FRED** (public domain, citation requested) for US 10Y (`DGS10`), US 2Y (`DGS2`) and Brent (`DCOILBRENTEU`), read from the public CSV endpoint with no key. FRED's `VIXCLS` is Cboe-copyrighted and is not used. Attribution: "Source: Federal Reserve Bank of St. Louis, FRED" ([legal](https://fred.stlouisfed.org/legal/)).

Revisit if live prices become worth $149/mo (Twelve Data Venture, 15-min delayed, "Data provided by Twelve Data" link).

## Environment variables

None required. `.env.example` lists any that are added later; values live only in Vercel project settings.

## Development

```sh
npm install
npm run dev
npm test
npm run validate-data
npm run research-list    # what a scheduled run gathers, from the config
npm run upsert-history   # midnight run: add or replace the history row
```
