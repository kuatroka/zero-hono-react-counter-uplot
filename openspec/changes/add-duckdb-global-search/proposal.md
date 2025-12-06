## Why

The current global search uses Zero-sync to query the `searches` table from Postgres. Benchmarks show DuckDB native queries are ~10x faster than pg_duckdb via HTTP (~1ms vs ~10ms). We want to add a **second** global search path using DuckDB native so we can compare both solutions side by side before deciding whether to change or remove the existing Zero-based implementation.

## What Changes

- Add a DuckDB connection singleton for analytics queries
- Create a new Hono API endpoint (e.g. `/api/duckdb-search`) using DuckDB native
- Add a second global search box in the main navigation that uses TanStack Query to call the DuckDB endpoint
- Keep the existing Zero-based global search fully intact and functional
- Query the `searches` table directly from the DuckDB file at `/Users/yo_macbook/Documents/app_data/TR_05_DB/TR_05_DUCKDB_FILE.duckdb`

## Impact

- Affected specs: `global-search` (new additive capability; existing Zero-based search unchanged)
- Affected code:
  - `src/components/GlobalSearch.tsx` and/or new `DuckDBGlobalSearch` component – wire a second search box into the menu
  - `api/routes/search-duckdb.ts` (name TBD) – new DuckDB-based search endpoint
  - `api/index.ts` – register new search routes
