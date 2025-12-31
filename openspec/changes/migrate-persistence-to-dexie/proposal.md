## Why

The current IndexedDB persistence layer using `idb-keyval` has critical flaws that prevent reliable cache invalidation:

1. **Stale connection problem**: `idb-keyval` creates store references at module initialization that cannot be closed. When `deleteDatabase()` is called, it's blocked by these open connections, leaving old data intact.

2. **Multiple disconnected caches**: The app has 4+ separate IndexedDB stores (`tanstack-query-cache`, `search-index-cache`, `drilldown-cache`, `cik-quarterly-cache`) plus memory caches, all requiring manual coordination.

3. **Silent failures**: `idb-keyval` fails silently when operations don't complete, making debugging difficult.

4. **Page reload workaround**: The only way to get fresh store connections is a full page reload - poor UX for twice-daily DuckDB refreshes.

## What Changes

- **BREAKING**: Replace `idb-keyval` with Dexie.js for all IndexedDB operations
- Consolidate all cached data into a single Dexie database with multiple tables
- Create a custom TanStack Query persister using Dexie
- Implement clean cache invalidation: `db.delete()` then `db.open()` - no page reload
- Remove page reload from `initializeWithFreshnessCheck()` and `checkFreshnessOnFocus()`

## Impact

- Affected specs: None (new capability, replaces internal implementation)
- Affected code:
  - `src/collections/query-client.ts` - Replace idb-keyval with Dexie
  - `src/collections/data-freshness.ts` - Remove page reload, use Dexie invalidation
  - `src/collections/cik-quarterly.ts` - Use Dexie for persistence
  - `src/lib/dexie-db.ts` (new) - Dexie database schema and instance
  - `src/lib/dexie-persister.ts` (new) - TanStack Query persister using Dexie
  - `package.json` - Add `dexie` dependency, remove `idb-keyval`
