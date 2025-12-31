## Why

When the backend DuckDB analytics database is updated by the ETL pipeline, frontend caches (IndexedDB + memory) remain stale. Users see outdated chart data even after refreshing the page because IndexedDB has a 7-day TTL and serves cached data before checking the API.

The DuckDB `high_level_totals.last_data_load_date` column tracks when data was last loaded. This can be used as a version stamp to trigger cache invalidation when backend data is fresher than frontend caches.

## What Changes

- Add `/api/data-freshness` endpoint that returns `last_data_load_date` from DuckDB
- Add frontend `data-freshness.ts` utility with version checking and localStorage tracking
- Add `invalidateAllCaches()` function to clear all IndexedDB stores and memory caches
- Integrate freshness check into app initialization (before preloading data)
- Optional: Re-check on tab focus for long-running sessions

## Impact

- Affected specs: None (new capability)
- Affected code:
  - `api/routes/data-freshness.ts` (new)
  - `api/index.ts` (register route)
  - `src/collections/data-freshness.ts` (new)
  - `src/collections/index.ts` (add freshness check to init)
  - `src/collections/query-client.ts` (expose clearAll functions)
  - `src/collections/cik-quarterly.ts` (expose clearAll function)
  - `src/main.tsx` or `App.tsx` (optional tab focus handler)
