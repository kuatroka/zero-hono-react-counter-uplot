## ADDED Requirements

### Requirement: DuckDB Search API Endpoint

The system SHALL provide a REST API endpoint for global search that queries the `searches` table directly from a DuckDB file.

#### Scenario: Search by code prefix

- **WHEN** client sends `GET /api/search?q=AAPL&limit=10`
- **THEN** the API returns results where `code` starts with "AAPL" ranked highest
- **AND** response includes `queryTimeMs` for monitoring

#### Scenario: Search by name substring

- **WHEN** client sends `GET /api/search?q=apple&limit=10`
- **THEN** the API returns results where `name` contains "apple" (case-insensitive)
- **AND** code matches are ranked above name-only matches

#### Scenario: Empty query

- **WHEN** client sends `GET /api/search?q=&limit=10`
- **THEN** the API returns an empty array

#### Scenario: Query too short

- **WHEN** client sends `GET /api/search?q=A&limit=10`
- **THEN** the API returns an empty array (minimum 2 characters required)

### Requirement: DuckDB Connection Singleton

The system SHALL maintain a single DuckDB connection instance to avoid file locking conflicts and reduce cold start overhead.

#### Scenario: Connection reuse

- **WHEN** multiple search requests arrive concurrently
- **THEN** all requests use the same DuckDB connection
- **AND** no file locking errors occur

#### Scenario: Connection initialization

- **WHEN** the first search request arrives
- **THEN** the system creates a DuckDB connection to the configured file path
- **AND** subsequent requests reuse this connection

### Requirement: Search Result Ranking

The system SHALL rank search results by match quality: exact code match > code starts with > code contains > name starts with > name contains.

#### Scenario: Exact code match priority

- **WHEN** user searches for "AAPL"
- **THEN** the result with `code = "AAPL"` appears first
- **AND** results with `code LIKE "AAPL%"` appear next

#### Scenario: Code over name priority

- **WHEN** user searches for "apple"
- **THEN** results matching on `code` appear before results matching only on `name`

### Requirement: TanStack Query Integration for Additional Search UI

The frontend SHALL provide an additional search UI that uses TanStack Query (React Query) to fetch DuckDB-based search results from the API with client-side caching and debouncing.

#### Scenario: Debounced search

- **WHEN** user types "app" then "l" then "e" quickly
- **THEN** only one API request is made for "apple" after debounce delay (50ms)

#### Scenario: Cached results

- **WHEN** user searches for "AAPL", navigates away, then returns and searches "AAPL" again within 5 minutes
- **THEN** cached results are shown immediately without API request

#### Scenario: Stale-while-revalidate

- **WHEN** cached results exist but are stale
- **THEN** cached results are shown immediately
- **AND** fresh results are fetched in background
