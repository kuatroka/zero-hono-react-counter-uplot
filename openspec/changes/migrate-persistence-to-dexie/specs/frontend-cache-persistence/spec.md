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
