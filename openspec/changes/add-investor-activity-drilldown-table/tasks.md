## 1. Discovery & Design

- [x] 1.1 Confirm source-of-truth for investor activity drilldown rows (DuckDB + Parquet via DuckDB native `@duckdb/node-api`).
- [x] 1.2 Identify exact columns for the drilldown table (superinvestor name, CIK, open/close flags, quarter, etc.).
- [x] 1.3 Decide whether the table will be **read-only** from the UI (read-only confirmed).

## 2. Chart Click Interaction

- [x] 2.1 Extend `InvestorActivityChart` to emit an event/callback when a bar is clicked, including `quarter` and `action` (opened vs closed).
- [x] 2.2 Extend `InvestorActivityUplotChart` to emit the same click payload (quarter + action) for consistency.
- [x] 2.3 Update `AssetDetailPage` to hold the "current selection" state: `{ ticker, quarter, action }`.

## 3. Drilldown Table Data Layer

- [x] 3.1 Add a backend or query layer for superinvestor drilldown rows by `{ ticker, quarter, action }`.
- [x] 3.2 If using DuckDB/Hono only: add/extend an endpoint (now `GET /api/duckdb-investor-drilldown?ticker=&quarter=&action=open|close`) to return superinvestor-level rows.
- [x] 3.3 (N/A for this change) Zero-based drilldown is explicitly deferred to a future proposal; no Zero table/view was added.
- [x] 3.4 Ensure the data model includes enough information to join ticker + quarter + CIK to a superinvestor name (via DuckDB join with `superinvestors`).

## 4. Drilldown Table UI

- [x] 4.1 Create `InvestorActivityDrilldownTable` component reusing the styling/structure from `/assets` and `/superinvestors` tables.
- [x] 4.2 Add support for loading/empty/error states.
- [x] 4.3 Add basic sorting (e.g., by superinvestor name, CIK) and pagination if needed.
- [x] 4.4 Wire the table into `AssetDetailPage` below the charts, fed by the current selection `{ ticker, quarter, action }`.
- [x] 4.5 Implement default behavior: on first render, table shows **opened positions in the latest available quarter** for the current ticker.

## 5. Validation

- [ ] 5.1 Verify that clicking the **opened** bar for a quarter shows only superinvestors that opened a position for that ticker in that quarter.
- [ ] 5.2 Verify that clicking the **closed** bar for a quarter shows only superinvestors that closed a position for that ticker in that quarter.
- [ ] 5.3 Verify the default state uses the latest quarter with data and shows opened positions.
- [ ] 5.4 Confirm the table styling and interaction match `/assets` and `/superinvestors` pages.
- [ ] 5.5 Confirm no regressions on existing charts or asset detail navigation.
