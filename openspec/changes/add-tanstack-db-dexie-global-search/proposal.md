## Why

The current global search (`DuckDBGlobalSearch.tsx`) uses plain TanStack Query + `fetch` to hit `/api/duckdb-search` on **every keystroke**. Despite a 50ms debounce and 5-minute query cache, each distinct search term triggers a network round-trip (~18-23ms latency visible in DevTools). For a ~40k-row search index, this data could be loaded into the browser once and queried locally for instant results.

TanStack DB with Dexie (IndexedDB adapter) enables:
- **Progressive sync**: First search hits API, then background-load all ~40k rows.
- **Instant local queries**: After sync, `useLiveQuery` resolves from IndexedDB without network.
- **Persistence across reloads**: IndexedDB survives page refresh; no re-sync on every visit.

## What Changes

- **Add `tanstack-dexie-db-collection`** dependency for IndexedDB-backed TanStack DB collections.
- **Create `searchesCollection`** with progressive sync mode:
  - On-demand fetch for first search.
  - Background full-dump sync of ~40k rows after first use.
- **Add `/api/searches/full-dump` endpoint** to paginate bulk export from DuckDB.
- **Replace `DuckDBGlobalSearch` implementation**:
  - Replace `useQuery` + `fetch` with `useLiveQuery` over `searchesCollection`.
  - After initial API hit, queries resolve locally (~0ms).
- **Preload trigger**: Start background sync after first successful search.

## Impact

- **New specs**: `global-search` (new capability for local-first global search)
- **Affected code**:
  - `src/collections/searches.ts` — new collection definition
  - `src/collections/instances.ts` — export `searchesCollection`
  - `src/components/DuckDBGlobalSearch.tsx` — rewrite to use `useLiveQuery`
  - `api/routes/search-duckdb.ts` — add `/full-dump` endpoint
  - `package.json` — add `tanstack-dexie-db-collection` and `dexie` dependencies
