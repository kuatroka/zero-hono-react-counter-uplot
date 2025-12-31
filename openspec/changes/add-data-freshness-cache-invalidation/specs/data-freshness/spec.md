## ADDED Requirements

### Requirement: Data Freshness API Endpoint

The system SHALL expose a `/api/data-freshness` endpoint that returns the last data load date from DuckDB's `high_level_totals` table.

#### Scenario: Successful freshness check
- **WHEN** a GET request is made to `/api/data-freshness`
- **THEN** the response SHALL be JSON with `lastDataLoadDate` (ISO date string or null) and `timestamp` (Unix ms)

#### Scenario: Empty high_level_totals table
- **WHEN** a GET request is made to `/api/data-freshness`
- **AND** the `high_level_totals` table is empty
- **THEN** the response SHALL have `lastDataLoadDate: null`

#### Scenario: DuckDB query error
- **WHEN** a GET request is made to `/api/data-freshness`
- **AND** the DuckDB query fails
- **THEN** the response SHALL be HTTP 500 with error details

### Requirement: Frontend Data Version Tracking

The system SHALL track the known data version in localStorage to enable cache staleness detection.

#### Scenario: Store data version
- **WHEN** the app receives a new data version from the API
- **THEN** the version SHALL be stored in localStorage at key `app-data-version`
- **AND** the stored value SHALL include the date and a checked timestamp

#### Scenario: Retrieve stored version
- **WHEN** the app needs to check cache freshness
- **THEN** the stored version SHALL be retrieved synchronously from localStorage
- **AND** null SHALL be returned if no version is stored

### Requirement: Cache Staleness Detection

The system SHALL detect when frontend caches are stale compared to backend DuckDB data.

#### Scenario: Fresh cache detection
- **WHEN** the app checks data freshness on load
- **AND** the API returns a `lastDataLoadDate` matching the stored version
- **THEN** the system SHALL NOT invalidate caches
- **AND** the system SHALL log `[DataFreshness] Cache is fresh`

#### Scenario: Stale cache detection
- **WHEN** the app checks data freshness on load
- **AND** the API returns a `lastDataLoadDate` different from the stored version
- **THEN** the system SHALL invalidate all caches
- **AND** the system SHALL update the stored version
- **AND** the system SHALL log `[DataFreshness] Data updated, invalidating caches...`

#### Scenario: First load (no stored version)
- **WHEN** the app checks data freshness on load
- **AND** no version is stored in localStorage
- **THEN** the system SHALL store the API version without invalidating caches

#### Scenario: API failure during freshness check
- **WHEN** the app checks data freshness on load
- **AND** the API request fails
- **THEN** the system SHALL NOT invalidate caches (fail open)
- **AND** the system SHALL log a warning

### Requirement: Cache Invalidation

The system SHALL delete all IndexedDB databases and clear memory caches when stale data is detected.

#### Scenario: Full cache invalidation
- **WHEN** stale data is detected
- **THEN** the system SHALL enumerate all IndexedDB databases via `indexedDB.databases()`
- **AND** the system SHALL delete each database via `indexedDB.deleteDatabase(name)`
- **AND** the system SHALL clear in-memory caches (cikDataCache, etc.)
- **AND** future IndexedDB databases SHALL be automatically included in invalidation

#### Scenario: Collections refetch after invalidation
- **WHEN** caches have been invalidated
- **AND** the app attempts to load data
- **THEN** data SHALL be fetched from the API (cache miss)
- **AND** fetched data SHALL be persisted to IndexedDB

### Requirement: Tab Focus Freshness Check

The system SHALL re-check data freshness when the user returns to a tab after being away.

#### Scenario: Stale data on tab focus
- **WHEN** the browser tab gains focus
- **AND** the last freshness check was more than 5 seconds ago
- **AND** the API returns a different version than stored
- **THEN** the system SHALL invalidate caches and refetch data

#### Scenario: Fresh data on tab focus
- **WHEN** the browser tab gains focus
- **AND** the API returns the same version as stored
- **THEN** the system SHALL NOT invalidate caches

#### Scenario: Debounced focus checks
- **WHEN** the browser tab gains focus multiple times rapidly
- **THEN** the system SHALL check freshness at most once per 5 seconds
