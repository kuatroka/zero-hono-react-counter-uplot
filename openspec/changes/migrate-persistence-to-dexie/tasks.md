## 1. Setup

- [x] 1.1 Add Dexie dependency: `bun add dexie`
- [x] 1.2 Create `src/lib/dexie-db.ts` with database schema
- [x] 1.3 Export database instance and types

## 2. Dexie Database Schema

- [x] 2.1 Define `QueryCacheEntry` interface for TanStack Query persister
- [x] 2.2 Define `SearchIndexEntry` interface for search index
- [x] 2.3 Define `CikQuarterlyEntry` interface for CIK quarterly data
- [x] 2.4 Create `AppCacheDB` class extending Dexie
- [x] 2.5 Define version 1 schema with tables: `queryCache`, `searchIndex`, `cikQuarterly`, `drilldown`
- [x] 2.6 Export singleton database instance

## 3. TanStack Query Persister

- [x] 3.1 Create `src/lib/dexie-persister.ts`
- [x] 3.2 Implement `createDexieStorage()` function (AsyncStorage interface)
- [x] 3.3 Implement `getItem()` method using `db.queryCache.get()`
- [x] 3.4 Implement `setItem()` method using `db.queryCache.put()`
- [x] 3.5 Implement `removeItem()` method using `db.queryCache.delete()`
- [x] 3.6 Export persister for use in query-client.ts

## 4. Migrate query-client.ts

- [x] 4.1 Remove `idb-keyval` imports (`get`, `set`, `del`, `createStore`)
- [x] 4.2 Import Dexie database and persister
- [x] 4.3 Replace `createIdbStorage()` with Dexie storage
- [x] 4.4 Update `persistSearchIndex()` to use `db.searchIndex.put()`
- [x] 4.5 Update `loadPersistedSearchIndex()` to use `db.searchIndex.get()`
- [x] 4.6 Update `clearPersistedSearchIndex()` to use `db.searchIndex.delete()`
- [x] 4.7 Remove unused idb-keyval store variables (`idbStore`, `searchIndexStore`, `drilldownStore`)

## 5. Migrate CIK Quarterly Persistence

- [x] 5.1 Update `persistCikQuarterlyData()` to use `db.cikQuarterly.put()`
- [x] 5.2 Update `loadPersistedCikQuarterlyData()` to use `db.cikQuarterly.get()`
- [x] 5.3 Update `clearPersistedCikQuarterlyData()` to use `db.cikQuarterly.delete()`
- [x] 5.4 Remove lazy store creation (`getCikQuarterlyStore()`)

## 6. Update Cache Invalidation

- [x] 6.1 Create `invalidateDatabase()` function in `dexie-db.ts`:
  - Close database: `db.close()`
  - Delete database: `await Dexie.delete('app-cache')`
  - Recreate instance and open: `db.open()`
- [x] 6.2 Update `clearAllIndexedDB()` in `data-freshness.ts` to use `invalidateDatabase()`
- [x] 6.3 Remove `window.location.reload()` from `initializeWithFreshnessCheck()`
- [x] 6.4 Remove `window.location.reload()` from `checkFreshnessOnFocus()`
- [x] 6.5 After invalidation, call `preloadCollections()` to refetch data

## 7. Memory Cache Coordination

- [x] 7.1 Ensure `clearAllCikQuarterlyData()` is called during invalidation
- [x] 7.2 Ensure TanStack Query cache is cleared: `queryClient.clear()`
- [x] 7.3 Update `invalidateAllCaches()` to coordinate all caches:
  - Dexie database invalidation
  - Memory cache clear
  - TanStack Query cache clear

## 8. Cleanup

- [x] 8.1 Remove `idb-keyval` dependency: `bun remove idb-keyval`
- [x] 8.2 Keep drilldown persistence (migrated to Dexie)
- [x] 8.3 Clean up any remaining idb-keyval references
- [x] 8.4 Exports in `src/collections/index.ts` unchanged (uses same function signatures)

## 9. Unit Testing & Basic Validation

- [x] 9.1 Test fresh load: Data fetches from API, persists to Dexie
- [x] 9.2 Test page refresh: Data loads from Dexie (fast)
- [x] 9.3 Test cache invalidation:
  - Change `last_data_load_date` in DuckDB
  - Refresh page
  - Verify: IndexedDB cleared, fresh API fetch, no page reload
- [x] 9.4 Test tab focus re-check (if DuckDB updated while tab in background)
- [x] 9.5 Verify DevTools > Application > IndexedDB shows single `app-cache` database
- [x] 9.6 Verify no `idb-keyval` databases remain after migration

## 10. E2E Integration Testing (Claude in Chrome + Server Logs)

### 10.1 Fresh Load Test
- [x] 10.1.1 Clear all IndexedDB databases via browser DevTools
- [x] 10.1.2 Navigate to `http://localhost:3003/superinvestors/1092254`
- [x] 10.1.3 Verify server logs show: `GET /api/data-freshness`, `GET /api/superinvestors`, `GET /api/cik-quarterly/1092254`
- [x] 10.1.4 Verify browser console shows: `[Dexie] Database opened`, `[DataFreshness] First load`, `[Collections] Preloading`
- [x] 10.1.5 Verify DevTools > Application > IndexedDB shows `app-cache` with data in all tables
- [x] 10.1.6 Screenshot the page showing chart rendered correctly

### 10.2 Cached Load Test
- [x] 10.2.1 Refresh the page (F5 or navigate away and back)
- [x] 10.2.2 Verify browser console shows: `[CikQuarterly] Loaded from IndexedDB`
- [x] 10.2.3 Verify browser console shows: `[DataFreshness] Cache is fresh`
- [x] 10.2.4 Verify page renders instantly without loading states
- [x] 10.2.5 Screenshot confirming fast cached load

### 10.3 Cache Invalidation Test (Critical)
- [x] 10.3.1 Update DuckDB `high_level_totals.last_data_load_date` to a new timestamp
- [x] 10.3.2 Refresh the page
- [x] 10.3.3 Verify browser console shows in sequence:
  - `[Dexie] Database deleted`
  - `[Dexie] Database reopened: app-cache`
  - `[DataFreshness] All caches invalidated`
  - `[Collections] Preloading...`
- [x] 10.3.4 Verify NO page reload occurs (no white flash, URL stays same)
- [x] 10.3.5 Verify page renders correctly with fresh data
- [x] 10.3.6 Screenshot showing successful invalidation without reload

### 10.4 Tab Focus Invalidation Test
- [ ] 10.4.1 Load the page with cached data
- [ ] 10.4.2 Switch to another browser tab and wait 10 seconds
- [ ] 10.4.3 Update DuckDB `last_data_load_date` while tab is in background
- [ ] 10.4.4 Switch back to the app tab
- [ ] 10.4.5 Verify browser console shows: `[DataFreshness] Tab focus: data updated, invalidating caches...`
- [ ] 10.4.6 Verify server logs show fresh API requests
- [ ] 10.4.7 Verify page updates with fresh data (no reload)

### 10.5 IndexedDB Structure Verification
- [x] 10.5.1 Open DevTools > Application > IndexedDB
- [x] 10.5.2 Verify ONLY `app-cache` database exists (no legacy databases)
- [x] 10.5.3 Verify `app-cache` contains tables: `queryCache`, `searchIndex`, `cikQuarterly`, `drilldown`
- [ ] 10.5.4 Verify `queryCache` contains TanStack Query cache entries
- [ ] 10.5.5 Verify `searchIndex` contains search index with metadata
- [x] 10.5.6 Verify `cikQuarterly` contains entries keyed by CIK
- [ ] 10.5.7 Screenshot of IndexedDB structure

### 10.6 Multi-CIK Caching Test
- [ ] 10.6.1 Navigate to `/superinvestors/1092254` (first CIK)
- [ ] 10.6.2 Navigate to `/superinvestors/22356` (second CIK)
- [ ] 10.6.3 Verify server logs show API request for second CIK only
- [ ] 10.6.4 Navigate back to `/superinvestors/1092254`
- [ ] 10.6.5 Verify server logs show NO API request (cached)
- [ ] 10.6.6 Verify DevTools > IndexedDB > `cikQuarterly` shows both CIKs

### 10.7 Network Tab Verification
- [ ] 10.7.1 Open DevTools > Network tab
- [ ] 10.7.2 Clear network log
- [ ] 10.7.3 Navigate between cached pages
- [ ] 10.7.4 Verify only `/api/data-freshness` calls appear (no redundant data fetches)
- [ ] 10.7.5 Screenshot of clean network activity

### 10.8 Error Recovery Test
- [ ] 10.8.1 Simulate IndexedDB failure (e.g., quota exceeded or permission denied)
- [ ] 10.8.2 Verify app continues to function with API-only mode
- [ ] 10.8.3 Verify console shows appropriate error messages
- [ ] 10.8.4 Verify no crash or blank page

## 11. Documentation

- [x] 11.1 Update any inline comments referencing idb-keyval
- [x] 11.2 Add JSDoc comments to Dexie database schema
- [x] 11.3 Update data-freshness.ts comments to explain Dexie flow
