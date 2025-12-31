## 1. Setup

- [ ] 1.1 Add Dexie dependency: `bun add dexie`
- [ ] 1.2 Create `src/lib/dexie-db.ts` with database schema
- [ ] 1.3 Export database instance and types

## 2. Dexie Database Schema

- [ ] 2.1 Define `QueryCacheEntry` interface for TanStack Query persister
- [ ] 2.2 Define `SearchIndexEntry` interface for search index
- [ ] 2.3 Define `CikQuarterlyEntry` interface for CIK quarterly data
- [ ] 2.4 Create `AppCacheDB` class extending Dexie
- [ ] 2.5 Define version 1 schema with tables: `queryCache`, `searchIndex`, `cikQuarterly`
- [ ] 2.6 Export singleton database instance

## 3. TanStack Query Persister

- [ ] 3.1 Create `src/lib/dexie-persister.ts`
- [ ] 3.2 Implement `createDexiePersister()` function
- [ ] 3.3 Implement `persistClient()` method using `db.queryCache.put()`
- [ ] 3.4 Implement `restoreClient()` method using `db.queryCache.get()`
- [ ] 3.5 Implement `removeClient()` method using `db.queryCache.delete()`
- [ ] 3.6 Export persister for use in query-client.ts

## 4. Migrate query-client.ts

- [ ] 4.1 Remove `idb-keyval` imports (`get`, `set`, `del`, `createStore`)
- [ ] 4.2 Import Dexie database and persister
- [ ] 4.3 Replace `createIdbStorage()` with Dexie persister
- [ ] 4.4 Update `persistSearchIndex()` to use `db.searchIndex.put()`
- [ ] 4.5 Update `loadPersistedSearchIndex()` to use `db.searchIndex.get()`
- [ ] 4.6 Update `clearPersistedSearchIndex()` to use `db.searchIndex.delete()`
- [ ] 4.7 Remove unused idb-keyval store variables (`idbStore`, `searchIndexStore`, `drilldownStore`)

## 5. Migrate CIK Quarterly Persistence

- [ ] 5.1 Update `persistCikQuarterlyData()` to use `db.cikQuarterly.put()`
- [ ] 5.2 Update `loadPersistedCikQuarterlyData()` to use `db.cikQuarterly.get()`
- [ ] 5.3 Update `clearPersistedCikQuarterlyData()` to use `db.cikQuarterly.delete()`
- [ ] 5.4 Remove lazy store creation (`getCikQuarterlyStore()`)

## 6. Update Cache Invalidation

- [ ] 6.1 Create `invalidateDatabase()` function in `dexie-db.ts`:
  - Close database: `db.close()`
  - Delete database: `await db.delete()`
  - Recreate instance and open: `db.open()`
- [ ] 6.2 Update `clearAllIndexedDB()` in `data-freshness.ts` to use `invalidateDatabase()`
- [ ] 6.3 Remove `window.location.reload()` from `initializeWithFreshnessCheck()`
- [ ] 6.4 Remove `window.location.reload()` from `checkFreshnessOnFocus()`
- [ ] 6.5 After invalidation, call `preloadCollections()` to refetch data

## 7. Memory Cache Coordination

- [ ] 7.1 Ensure `clearAllCikQuarterlyData()` is called during invalidation
- [ ] 7.2 Ensure TanStack Query cache is cleared: `queryClient.clear()`
- [ ] 7.3 Update `invalidateAllCaches()` to coordinate all caches:
  - Dexie database invalidation
  - Memory cache clear
  - TanStack Query cache clear

## 8. Cleanup

- [ ] 8.1 Remove `idb-keyval` dependency: `bun remove idb-keyval`
- [ ] 8.2 Remove unused drilldown persistence code if not in use
- [ ] 8.3 Clean up any remaining idb-keyval references
- [ ] 8.4 Update exports in `src/collections/index.ts`

## 9. Testing & Validation

- [ ] 9.1 Test fresh load: Data fetches from API, persists to Dexie
- [ ] 9.2 Test page refresh: Data loads from Dexie (fast)
- [ ] 9.3 Test cache invalidation:
  - Change `last_data_load_date` in DuckDB
  - Refresh page
  - Verify: IndexedDB cleared, fresh API fetch, no page reload
- [ ] 9.4 Test tab focus re-check (if DuckDB updated while tab in background)
- [ ] 9.5 Verify DevTools > Application > IndexedDB shows single `app-cache` database
- [ ] 9.6 Verify no `idb-keyval` databases remain after migration

## 10. Documentation

- [ ] 10.1 Update any inline comments referencing idb-keyval
- [ ] 10.2 Add JSDoc comments to Dexie database schema
- [ ] 10.3 Update data-freshness.ts comments to explain Dexie flow
