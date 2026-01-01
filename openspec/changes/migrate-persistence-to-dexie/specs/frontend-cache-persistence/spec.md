## ADDED Requirements

### Requirement: Dexie Database Schema

The system SHALL use Dexie.js for all IndexedDB persistence with a single database containing multiple tables.

#### Scenario: Database initialization
- **WHEN** the application starts
- **THEN** Dexie opens the `app-cache` database with tables: `queryCache`, `searchIndex`, `cikQuarterly`

#### Scenario: Schema versioning
- **WHEN** the database schema needs to change
- **THEN** Dexie's version migration system handles the upgrade automatically

### Requirement: TanStack Query Persistence

The system SHALL persist TanStack Query cache to IndexedDB using a custom Dexie persister.

#### Scenario: Cache persistence on data fetch
- **WHEN** TanStack Query fetches data from the API
- **THEN** the data is persisted to the `queryCache` table in IndexedDB

#### Scenario: Cache restoration on page load
- **WHEN** the application loads
- **THEN** TanStack Query restores cached data from the `queryCache` table before making API requests

#### Scenario: Cache TTL enforcement
- **WHEN** cached data exceeds the configured maxAge (7 days)
- **THEN** the persister returns null and data is refetched from the API

### Requirement: Search Index Persistence

The system SHALL persist the pre-computed search index to IndexedDB for instant search on page load.

#### Scenario: Search index persistence
- **WHEN** the search index is loaded from the API
- **THEN** it is persisted to the `searchIndex` table with a timestamp

#### Scenario: Search index restoration
- **WHEN** the application loads and the search index is not expired
- **THEN** the search index is restored from IndexedDB without an API call

### Requirement: CIK Quarterly Data Persistence

The system SHALL persist CIK quarterly data to IndexedDB for instant chart rendering on page load.

#### Scenario: Per-CIK data persistence
- **WHEN** quarterly data for a CIK is fetched from the API
- **THEN** it is persisted to the `cikQuarterly` table keyed by CIK

#### Scenario: Per-CIK data restoration
- **WHEN** a superinvestor detail page loads and cached data exists for that CIK
- **THEN** the chart renders instantly from cached data

### Requirement: Cache Invalidation Without Page Reload

The system SHALL invalidate all cached data when backend data version changes, without requiring a page reload.

#### Scenario: Stale cache detection
- **WHEN** the app initializes and `/api/data-freshness` returns a different `lastDataLoadDate` than stored locally
- **THEN** the cache is considered stale and invalidation begins

#### Scenario: Database invalidation
- **WHEN** cache invalidation is triggered
- **THEN** the system closes the Dexie connection, deletes the database, and reopens with a fresh instance

#### Scenario: Data refetch after invalidation
- **WHEN** the database is invalidated
- **THEN** `preloadCollections()` is called to refetch data from the API without a page reload

#### Scenario: No reload required
- **WHEN** cache invalidation completes
- **THEN** the UI updates with fresh data and no `window.location.reload()` is called

### Requirement: Tab Focus Re-validation

The system SHALL re-check data freshness when the browser tab regains focus after being in the background.

#### Scenario: Tab focus triggers freshness check
- **WHEN** the browser tab regains focus after being in the background for more than 5 seconds
- **THEN** the system calls `/api/data-freshness` to check if backend data has been updated

#### Scenario: Invalidation on stale detection during focus
- **WHEN** the freshness check detects stale data
- **THEN** cache invalidation and data refetch occur without page reload

### Requirement: Connection Lifecycle Management

The system SHALL properly manage IndexedDB connection lifecycle to prevent blocked operations.

#### Scenario: Clean database deletion
- **WHEN** `db.delete()` is called
- **THEN** the database is deleted without blocking because connections are closed first

#### Scenario: Fresh connections after invalidation
- **WHEN** the database is recreated after invalidation
- **THEN** a new Dexie instance is created with fresh connections to the new database

### Requirement: Error Handling

The system SHALL handle IndexedDB errors gracefully with meaningful error messages.

#### Scenario: Database open failure
- **WHEN** Dexie fails to open the database
- **THEN** an error is logged and the app continues without persistence (API-only mode)

#### Scenario: Persistence failure
- **WHEN** a write operation to IndexedDB fails
- **THEN** an error is logged but the app continues functioning with in-memory data

#### Scenario: Restoration failure
- **WHEN** reading from IndexedDB fails
- **THEN** the system falls back to fetching from the API

### Requirement: End-to-End Integration Testing

The system SHALL be thoroughly tested using browser automation and server log verification to confirm all cache invalidation scenarios work correctly.

#### Scenario: Fresh load - API fetch and IndexedDB persistence
- **GIVEN** IndexedDB is empty (cleared via DevTools)
- **WHEN** the user navigates to `/superinvestors/1092254`
- **THEN** server logs show API requests for `/api/superinvestors` and `/api/cik-quarterly/1092254`
- **AND** browser DevTools > Application > IndexedDB shows `app-cache` database with populated tables
- **AND** the page renders with chart data

#### Scenario: Cached load - IndexedDB restoration without API calls
- **GIVEN** the page was previously loaded and IndexedDB contains cached data
- **WHEN** the user refreshes the page
- **THEN** server logs show NO requests to `/api/superinvestors` (only `/api/data-freshness`)
- **AND** console logs show `[DataFreshness] Cache is fresh`
- **AND** the page renders instantly from cache

#### Scenario: Cache invalidation - DuckDB update triggers fresh fetch
- **GIVEN** the page is loaded with cached data
- **WHEN** the DuckDB `high_level_totals.last_data_load_date` is updated to a new value
- **AND** the user refreshes the page
- **THEN** console logs show `[DataFreshness] Data updated: OLD → NEW, invalidating caches...`
- **AND** console logs show `[Dexie] Database deleted and reopened`
- **AND** server logs show fresh API requests for `/api/superinvestors` and `/api/cik-quarterly/1092254`
- **AND** NO `window.location.reload()` occurs (page does not flash/reload)
- **AND** the page renders with fresh data

#### Scenario: Tab focus invalidation - background DuckDB update detected
- **GIVEN** the page is loaded with cached data
- **WHEN** the user switches to another tab for more than 5 seconds
- **AND** the DuckDB `last_data_load_date` is updated while the tab is in background
- **AND** the user switches back to the app tab
- **THEN** console logs show `[DataFreshness] Tab focus: data updated, invalidating caches...`
- **AND** server logs show fresh API requests
- **AND** the page updates with fresh data without reload

#### Scenario: IndexedDB structure verification
- **GIVEN** the app has been used and data is cached
- **WHEN** inspecting DevTools > Application > IndexedDB
- **THEN** only ONE database named `app-cache` exists (no legacy `tanstack-query-cache`, `search-index-cache`, etc.)
- **AND** the database contains tables: `queryCache`, `searchIndex`, `cikQuarterly`
- **AND** each table contains appropriate data with timestamps

#### Scenario: Console log verification for full flow
- **GIVEN** a fresh browser session with cleared IndexedDB
- **WHEN** the user loads the app, navigates to a superinvestor page, refreshes, then triggers invalidation
- **THEN** console logs show the complete flow:
  1. `[Dexie] Database opened: app-cache`
  2. `[DataFreshness] First load, storing version: YYYY-MM-DD HH:MM:SS`
  3. `[Collections] Preloading...`
  4. `[Superinvestors] Fetched N superinvestors in Xms`
  5. `[CikQuarterly] Fetched N quarters for CIK X in Xms (source: api)`
  6. On refresh: `[DataFreshness] Cache is fresh`
  7. On invalidation: `[DataFreshness] Data updated...invalidating caches...`
  8. `[Dexie] Database closed`
  9. `[Dexie] Database deleted`
  10. `[Dexie] Database reopened: app-cache`
  11. `[Collections] Preloading...` (fresh fetch)

#### Scenario: Network tab verification for cache effectiveness
- **GIVEN** data is cached in IndexedDB
- **WHEN** the user navigates between pages and returns to a previously visited page
- **THEN** DevTools > Network tab shows NO duplicate API requests for cached data
- **AND** only `/api/data-freshness` is called on each navigation (lightweight check)

#### Scenario: Multiple superinvestor pages - per-CIK caching
- **GIVEN** the user visits `/superinvestors/1092254` (data cached)
- **WHEN** the user navigates to `/superinvestors/22356` (different CIK)
- **THEN** server logs show API request for `/api/cik-quarterly/22356` (new CIK)
- **AND** when returning to `/superinvestors/1092254`, NO API request is made (cached)
- **AND** DevTools > IndexedDB > `cikQuarterly` table shows entries for both CIKs
