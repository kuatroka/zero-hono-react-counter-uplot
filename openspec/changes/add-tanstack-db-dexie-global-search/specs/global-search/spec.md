## ADDED Requirements

### Requirement: Local-First Global Search Collection

The system SHALL provide a `searchesCollection` backed by IndexedDB (via Dexie) that stores the global search index locally in the browser.

#### Scenario: Collection initialization with Dexie adapter

- **GIVEN** the app initializes
- **WHEN** `searchesCollection` is created
- **THEN** it SHALL be configured with the `tanstack-dexie-db-collection` adapter for IndexedDB persistence

#### Scenario: Data persists across page reloads

- **GIVEN** the search index has been synced to IndexedDB
- **WHEN** the user refreshes the page
- **THEN** the search data SHALL be available immediately from IndexedDB without re-fetching from the server

### Requirement: Progressive Sync Strategy

The system SHALL implement a progressive sync strategy where the first search uses the API and subsequent searches use local data after background sync completes.

#### Scenario: First search uses API

- **GIVEN** the search index has not been synced yet
- **WHEN** the user types a search query (minimum 2 characters)
- **THEN** the system SHALL fetch results from `/api/duckdb-search` endpoint

#### Scenario: Background sync triggered after first search

- **GIVEN** the first search returns results successfully
- **WHEN** results are displayed to the user
- **THEN** the system SHALL start background sync of the full search index via `/api/searches/full-dump`

#### Scenario: Subsequent searches use local data

- **GIVEN** the background sync has completed
- **WHEN** the user types a new search query
- **THEN** the system SHALL resolve results from the local IndexedDB collection without network requests

### Requirement: Full-Dump API Endpoint

The system SHALL provide a paginated endpoint to export the entire search index for bulk sync.

#### Scenario: Paginated export with cursor

- **GIVEN** a request to `GET /api/searches/full-dump?pageSize=1000`
- **WHEN** the server processes the request
- **THEN** it SHALL return `{ items: SearchResult[], nextCursor: string | null }`

#### Scenario: Cursor-based pagination continues

- **GIVEN** a response with `nextCursor: "12345"`
- **WHEN** a follow-up request is made with `?cursor=12345&pageSize=1000`
- **THEN** it SHALL return the next page of results

#### Scenario: Final page indicates completion

- **GIVEN** all items have been returned
- **WHEN** the final page is requested
- **THEN** `nextCursor` SHALL be `null`

### Requirement: Local Search Filtering and Ranking

The system SHALL implement client-side filtering and ranking that matches the existing DuckDB search scoring logic.

#### Scenario: Exact code match scores highest

- **GIVEN** a search query "AAPL"
- **WHEN** an item has `code = "AAPL"` (case-insensitive)
- **THEN** it SHALL receive a score of 100

#### Scenario: Code starts with query

- **GIVEN** a search query "AA"
- **WHEN** an item has `code = "AAPL"`
- **THEN** it SHALL receive a score of 80

#### Scenario: Code contains query

- **GIVEN** a search query "APL"
- **WHEN** an item has `code = "AAPL"`
- **THEN** it SHALL receive a score of 60

#### Scenario: Name starts with query

- **GIVEN** a search query "Apple"
- **WHEN** an item has `name = "Apple Inc"`
- **THEN** it SHALL receive a score of 40

#### Scenario: Name contains query

- **GIVEN** a search query "Inc"
- **WHEN** an item has `name = "Apple Inc"`
- **THEN** it SHALL receive a score of 20

### Requirement: Sync State Indication

The system SHALL track and expose the sync state of the search collection.

#### Scenario: Sync state transitions

- **GIVEN** the search collection exists
- **WHEN** sync progresses
- **THEN** the state SHALL transition through: `idle` → `syncing` → `complete`

#### Scenario: UI can query sync state

- **GIVEN** the collection is syncing
- **WHEN** a component queries sync state
- **THEN** it SHALL receive the current state (`idle`, `syncing`, or `complete`)

### Requirement: Instant Query Performance

The system SHALL provide sub-millisecond query performance for local searches after sync completes.

#### Scenario: Local query latency

- **GIVEN** the search index is fully synced (~40k rows)
- **WHEN** the user types a search query
- **THEN** results SHALL appear in under 10ms (no network latency)
