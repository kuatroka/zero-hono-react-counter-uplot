## 1. Backend: Data Freshness Endpoint

- [x] 1.1 Create `api/routes/data-freshness.ts` with GET endpoint
- [x] 1.2 Query `high_level_totals.last_data_load_date` from DuckDB
- [x] 1.3 Return JSON: `{ lastDataLoadDate: string | null, timestamp: number }`
- [x] 1.4 Handle empty table case (return null)
- [x] 1.5 Register route in `api/index.ts`

## 2. Frontend: Data Freshness Utility

- [x] 2.1 Create `src/collections/data-freshness.ts`
- [x] 2.2 Implement `getStoredDataVersion()` - read from localStorage
- [x] 2.3 Implement `setStoredDataVersion(date)` - write to localStorage
- [x] 2.4 Implement `checkDataFreshness()` - fetch API, compare with stored
- [x] 2.5 Return `{ isStale: boolean, serverVersion: string | null, localVersion: string | null }`

## 3. Frontend: Cache Invalidation

- [x] 3.1 Create `clearAllIndexedDB()` function using `indexedDB.databases()` API
- [x] 3.2 Create `invalidateAllCaches()` in `data-freshness.ts`:
  - Call `clearAllIndexedDB()` to nuke all IndexedDB databases
  - Clear memory caches (`clearAllCikQuarterlyData()`, etc.)
- [x] 3.3 Export from `src/collections/index.ts`

## 4. Frontend: Integration

- [x] 4.1 Create `initializeWithFreshnessCheck()` in `src/collections/data-freshness.ts`
- [x] 4.2 Call `checkDataFreshness()` before `preloadCollections()`
- [x] 4.3 If stale: call `invalidateAllCaches()`, update stored version
- [x] 4.4 Update app initialization to use new function in `app/components/app-provider.tsx`
- [x] 4.5 Add console logging for debugging: `[DataFreshness] Cache is fresh` or `[DataFreshness] Data updated, invalidating caches...`

## 5. Frontend: Tab Focus Handler (Optional Enhancement)

- [x] 5.1 Create `DataFreshnessOnFocus` component with focus handler
- [x] 5.2 Listen to `window.focus` event
- [x] 5.3 Debounce check (5 second minimum between checks)
- [x] 5.4 If stale: invalidate and trigger refetch
- [x] 5.5 Add component to `AppProvider`

## 6. Testing & Validation

- [ ] 6.1 Verify `/api/data-freshness` returns correct date from DuckDB
- [ ] 6.2 Test fresh cache scenario (no invalidation on matching version)
- [ ] 6.3 Test stale cache scenario (invalidation on version mismatch)
- [ ] 6.4 Verify IndexedDB stores are cleared after invalidation
- [ ] 6.5 Verify data refetches from API after cache clear
- [ ] 6.6 Test tab focus re-check behavior
- [ ] 6.7 Test error handling (API failure, empty table)
