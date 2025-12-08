## Why

The asset detail page shows investor activity charts for each asset (by ticker / CUSIP), but there is no way to see **which superinvestors** opened or closed positions in a given quarter. For real analysis, the user needs to:

- Click on a bar in the "Investor Activity" chart to drill down to actual superinvestors.
- See a tabular list of those superinvestors (name, CIK, action, etc.).
- Quickly switch quarters and actions by interacting with the chart rather than typing filters.

This change adds an interactive drilldown table below the investor-activity charts on the asset detail page. The table will be driven by chart clicks and will reuse the existing table design from the `/assets` and `/superinvestors` pages.

## What Changes

- Add an **investor-activity drilldown table** to the asset detail page.
- Wire both investor-activity charts so that clicking a bar:
  - Captures the **ticker** (known from the detail page) and the **quarter** represented by that bar.
  - Determines whether the click represents **opened** or **closed** positions.
- Drive the table below the charts from this selection:
  - When clicking the **upper (opened)** bar, show superinvestors that **opened** positions in that quarter for the current ticker.
  - When clicking the **lower (closed)** bar, show superinvestors that **closed** positions in that quarter for the current ticker.
- On initial load (no click yet), default the table to:
  - The **latest available quarter** for the current asset.
  - **Opened** positions.
- Reuse the table look & feel and pagination/filtering approach from the `/assets` and `/superinvestors` pages (shadcn table, consistent columns, sort, and density).
- Define a clear data source for the drilldown rows:
  - Use DuckDB native via `@duckdb/node-api`, following the same pattern as the DuckDB global search (shared `api/duckdb.ts` singleton).
  - Add or extend a Hono route (e.g. `GET /api/duckdb-investor-drilldown`) that queries DuckDB directly for `{ ticker, quarter, action }` and returns superinvestor-level rows.

## Impact

- **Affected specs:**
  - `ui-components` (asset detail layout, chart + table composition)
  - `zero-synced-queries` (if we introduce a dedicated Zero query for investor drilldown; TBD in design)
- **Affected code (high level):**
  - `src/pages/AssetDetail.tsx` – host the new table, pass current ticker / selection down, manage default state.
  - `src/components/charts/InvestorActivityChart.tsx` – emit click events with quarter + action.
  - `src/components/charts/InvestorActivityUplotChart.tsx` – emit click events with quarter + action.
  - New `InvestorActivityDrilldownTable` React component – reusable table that reuses `/assets` & `/superinvestors` table styling.
  - Existing `api/routes/drilldown.ts` (or a new API/Zero query) – provide the superinvestor-level rows for a given ticker, quarter, and action.

## Open Questions

- Do we want a follow-up change that also exposes this DuckDB-backed drilldown as a Zero-synced view for local-first behavior, or is DuckDB native sufficient for this use case?
- What exact columns do we want in the table? (proposal: superinvestor name, CIK, action(s), quarter, maybe position size / change if available from the Parquet data).
- How should we behave when there is **no data** for the latest quarter (fallback to previous quarter or show an empty state)?
