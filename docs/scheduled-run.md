# Scheduled update run

Instructions for the Claude routines that refresh `data/`. The routine prompt names the run label; everything else is here, so changing this file changes what every run does.

| Run label | Schedule (Pacific) | Writes |
|---|---|---|
| `midnight` | 12:00 AM Tue–Sat | snapshot, regime, changes, catalysts, history row |
| `pre-market` | 5:45 AM Mon–Fri | snapshot, regime, changes, catalysts |
| `manual` | started with "Run now" | snapshot, regime, changes, catalysts |

The site shows pattern flags, not trade signals. Write in plain English, no jargon a casual reader wouldn't know, and never phrase anything as a buy or sell call.

## 1. Set up

```sh
npm ci
npm run research-list
```

`research-list` prints every market to gather, the tickers to cover and the active rule packs. It is generated from `config/markets.ts`, `config/watchlist.ts` and `packs/`, so new tickers appear here without editing this file.

## 2. Gather the numbers

1. Read `https://gold-silver-dashboard-kappa.vercel.app/api/quotes` with WebFetch first. Its FRED readings (`source.kind: "daily"`) are official closes; keep them unless you find a fresher figure.
2. Use web search for every market from `research-list`, preferring the most recent figure from a reputable market or news site (Kitco, Trading Economics, CNBC, Reuters, Bloomberg, MarketWatch, CoinDesk, the fund issuer's page).
3. Every non-null value needs `source` (site name) and `url` (the exact https page it came from).
4. If you cannot find a reliable figure, or sources disagree by more than a rounding difference, write `null` and say why in `note`. Never estimate or carry a value forward silently. Never treat a missing value as zero.
5. Day changes are measured against the previous US close. `chg_bp` is for yields only (basis points); every other market uses `chg_pct`. Gold also needs `chg_1m_pct` (change over about 21 trading days).

## 3. Write the files

All five files must keep these shapes; `npm run validate-data` rejects anything else.

**`data/snapshot.json`**: `{ "asOf": "<ISO time the figures describe, with zone>", "readings": [ ...one row per market ] }`. Each row:

```json
{ "key": "gold", "group": "Metals", "label": "Gold (spot)", "value": 4040, "chg_pct": -2.4, "chg_bp": null, "chg_1m_pct": -5.8,
  "shown": "$4,040", "change_shown": "−2.4%", "note": "Lowest in over two months", "source": "Trading Economics", "url": "https://tradingeconomics.com/commodity/gold" }
```

Use the `key`, `group` and `label` from `research-list` / `config/markets.ts`. For a market with no reliable figure: `value`, the changes `null`, `shown` and `change_shown` `"—"`, `source` and `url` `""`, and the reason in `note`.

**`data/regime.json`**: one row, `[{ "regime", "takeaway", "as_of", "run" }]`. `regime` names the historical pattern today's moves match (compare against the rule checks on the site). `takeaway` is two or three sentences. `as_of` is human-readable, e.g. `"Oct 23, 2026 · 5:45 AM PT (pre-market)"`. `run` is `"Midnight update"`, `"Pre-market update"` or `"Manual update"`.

**`data/changes.json`**: 4–8 rows `{ "n", "text", "source", "url" }`, numbered from 1, describing what moved since the previous update, each with the page it came from.

**`data/catalysts.json`**: rows `{ "date": "YYYY-MM-DD", "when", "event", "why", "url" }` for scheduled events in the next 10 days that can move the tickers (earnings of the largest GDX holdings, Fed, BoJ, CPI, jobs, CFTC positioning). Drop events that have passed. Sorted by date.

**Midnight run only**, after writing the snapshot with closing values:

```sh
npm run upsert-history
```

It adds the row for the US session that just closed, or replaces it if one exists, so each market date has exactly one row. Pass the date explicitly (`npm run upsert-history -- 2026-10-23`) if the run is late.

## 4. Validate, then commit

```sh
npm run validate-data
```

If it fails, fix the files and run it again. If you cannot make it pass, **push nothing**: discard your changes with `git checkout -- data/` and end the run, reporting the validation errors.

When it passes:

```sh
git add data/
git commit -m "data: <run label> <YYYY-MM-DD>"
git push origin main
```

Use the Pacific date of the run, e.g. `data: pre-market 2026-10-23`. Commit only `data/`. Vercel redeploys within about a minute of the push.

## 5. Report

End with a short summary: the pattern read, how many markets had values versus `null`, and the commit hash.
