# zero-synced-queries Specification

## Purpose
TBD - created by archiving change migrate-to-ztunes-architecture. Update Purpose after archive.
## Requirements
### Requirement: Validated Query Definitions

The system SHALL define reusable, validated query definitions in `zero/queries.ts` using Zod schemas for type-safe parameter validation.

#### Scenario: Define synced query with validation

- **WHEN** a developer defines a synced query
- **THEN** it SHALL use `syncedQuery()` from Zero
- **AND** SHALL include a unique query name
- **AND** SHALL include a Zod schema for parameter validation
- **AND** SHALL include a query builder function

#### Scenario: Validate query parameters

- **WHEN** a client calls a synced query with parameters
- **THEN** the parameters SHALL be validated against the Zod schema
- **AND** invalid parameters SHALL be rejected with descriptive errors
- **AND** valid parameters SHALL be passed to the query builder

#### Scenario: Type-safe query parameters

- **WHEN** a developer uses a synced query in TypeScript
- **THEN** TypeScript SHALL infer parameter types from the Zod schema
- **AND** SHALL produce compile-time errors for invalid parameter types
- **AND** SHALL provide autocomplete for parameter names

### Requirement: Search Entities Query

The system SHALL provide a synced query for searching entities with case-insensitive substring matching.

#### Scenario: Search entities by name

- **WHEN** a client calls `queries.searchEntities(query, limit)`
- **THEN** the query SHALL use ILIKE for case-insensitive matching
- **AND** SHALL match entities where name contains the query string
- **AND** SHALL order results by created_at descending
- **AND** SHALL limit results to the specified limit

#### Scenario: Validate search parameters

- **WHEN** `queries.searchEntities` is called
- **THEN** the query parameter SHALL be validated as a string
- **AND** the limit parameter SHALL be validated as a number
- **AND** invalid parameters SHALL be rejected

#### Scenario: Empty search query

- **WHEN** a client calls `queries.searchEntities('', 10)`
- **THEN** the query SHALL return the 10 most recent entities
- **AND** SHALL NOT filter by name

### Requirement: Quarterly Data Query

The system SHALL provide a synced query for fetching quarterly data ordered by quarter.

#### Scenario: Fetch all quarterly data

- **WHEN** a client calls `queries.getQuarterlyData()`
- **THEN** the query SHALL return all records from value_quarters table
- **AND** SHALL order results by quarter ascending
- **AND** SHALL include quarter and value columns

#### Scenario: No parameters required

- **WHEN** `queries.getQuarterlyData` is defined
- **THEN** it SHALL accept zero parameters
- **AND** the Zod schema SHALL be `z.tuple([])`
- **AND** calling with parameters SHALL be a type error

### Requirement: Messages Query

The system SHALL provide synced queries for fetching messages with filtering and relationships when message functionality is enabled.

#### Scenario: Fetch messages with relationships

- **WHEN** a client calls `queries.getMessages()`
- **THEN** the query SHALL return messages with related sender and medium
- **AND** SHALL use `.related()` to include relationships
- **AND** SHALL order by timestamp descending

#### Scenario: Filter messages by medium

- **WHEN** a client calls `queries.getMessagesByMedium(mediumId)`
- **THEN** the query SHALL filter messages where medium_id equals mediumId
- **AND** SHALL validate mediumId is a string
- **AND** SHALL include related sender and medium

### Requirement: Query Builder Integration

The system SHALL use the generated Zero schema builder to construct queries in synced query definitions.

#### Scenario: Use schema builder in queries

- **WHEN** a synced query is defined
- **THEN** it SHALL use `builder.tableName` to start the query
- **AND** SHALL chain query methods (where, orderBy, limit, related)
- **AND** SHALL return a query builder instance

#### Scenario: Type-safe query building

- **WHEN** a developer writes a query builder chain
- **THEN** TypeScript SHALL validate column names exist
- **AND** SHALL validate comparison operators are valid
- **AND** SHALL validate orderBy directions are 'asc' or 'desc'
- **AND** SHALL produce compile-time errors for invalid queries

### Requirement: Query Reusability

The system SHALL allow synced queries to be reused across multiple components without duplicating query logic.

#### Scenario: Import queries in components

- **WHEN** a component needs to query data
- **THEN** it SHALL import queries from `zero/queries.ts`
- **AND** SHALL call the query function with parameters
- **AND** SHALL NOT duplicate query logic

#### Scenario: Consistent query behavior

- **WHEN** multiple components use the same synced query
- **THEN** they SHALL all receive the same query results
- **AND** SHALL all use the same validation rules
- **AND** SHALL all benefit from query optimizations

### Requirement: Client-Side Query Usage

The system SHALL allow clients to use synced queries with the `useQuery` hook for reactive data access.

#### Scenario: Use synced query in component

- **WHEN** a component calls `useQuery(queries.searchEntities(query, 5))`
- **THEN** Zero SHALL execute the query against local cache
- **AND** SHALL return results immediately if cached
- **AND** SHALL sync with server in background
- **AND** SHALL update results reactively when data changes

#### Scenario: Query parameter changes

- **WHEN** query parameters change (e.g., search query updates)
- **THEN** Zero SHALL re-execute the query with new parameters
- **AND** SHALL return updated results
- **AND** SHALL maintain reactivity

#### Scenario: Query loading state

- **WHEN** a query is first executed
- **THEN** `useQuery` SHALL return a loading state
- **AND** SHALL return results when available
- **AND** SHALL handle errors gracefully

### Requirement: Server-Side Query Execution

The system SHALL execute synced queries server-side through the `/api/zero/get-queries` endpoint with validation.

#### Scenario: Handle query request

- **WHEN** Zero cache calls `/api/zero/get-queries`
- **THEN** the endpoint SHALL parse the query name and parameters
- **AND** SHALL look up the query definition in `zero/queries.ts`
- **AND** SHALL validate parameters with the query's Zod schema
- **AND** SHALL execute the query against PostgreSQL
- **AND** SHALL return results to Zero cache

#### Scenario: Query validation failure

- **WHEN** a query request has invalid parameters
- **THEN** the endpoint SHALL reject the request
- **AND** SHALL return a validation error
- **AND** SHALL NOT execute the query

#### Scenario: Query not found

- **WHEN** a query request references a non-existent query
- **THEN** the endpoint SHALL return error "Query not found"
- **AND** SHALL NOT execute any query

### Requirement: Query Performance

The system SHALL optimize synced queries for performance with appropriate indexing and caching.

#### Scenario: Use database indexes

- **WHEN** a synced query filters or sorts by a column
- **THEN** the database SHOULD have an index on that column
- **AND** the query SHALL use the index for performance

#### Scenario: Limit result sets

- **WHEN** a synced query could return many results
- **THEN** it SHALL include a `.limit()` clause
- **AND** SHALL use a reasonable default limit
- **AND** SHALL allow clients to specify a custom limit

#### Scenario: Zero cache optimization

- **WHEN** multiple clients request the same query
- **THEN** Zero cache SHALL deduplicate requests
- **AND** SHALL cache results for subsequent requests
- **AND** SHALL invalidate cache when data changes

### Requirement: Query Error Handling

The system SHALL handle query errors gracefully and provide descriptive error messages.

#### Scenario: Database query error

- **WHEN** a query fails due to database error
- **THEN** the error SHALL be caught and logged
- **AND** a generic error message SHALL be returned to client
- **AND** sensitive database details SHALL NOT be exposed

#### Scenario: Parameter validation error

- **WHEN** query parameters fail Zod validation
- **THEN** the error message SHALL describe what validation failed
- **AND** SHALL include the invalid value (if safe)
- **AND** SHALL suggest valid parameter format

#### Scenario: Client error handling

- **WHEN** a query fails on the client
- **THEN** `useQuery` SHALL return an error state
- **AND** the component SHALL be able to display the error
- **AND** SHALL be able to retry the query

### Requirement: Query Composition

The system SHALL allow synced queries to be composed with additional filters and transformations on the client.

#### Scenario: Add client-side filters

- **WHEN** a client uses a synced query
- **THEN** it MAY add additional `.where()` clauses
- **AND** MAY add additional `.orderBy()` clauses
- **AND** MAY add additional `.limit()` clauses
- **AND** the composed query SHALL be validated

#### Scenario: Relationship loading

- **WHEN** a synced query includes relationships
- **THEN** clients MAY use `.related()` to load related data
- **AND** related data SHALL be synced automatically
- **AND** relationships SHALL be type-safe

### Requirement: No Direct Query Duplication

The system SHALL NOT allow direct Zero queries for operations that have synced query definitions.

#### Scenario: Prefer synced queries over direct queries

- **WHEN** a synced query exists for an operation
- **THEN** components SHALL use the synced query
- **AND** SHALL NOT duplicate the query logic with direct queries
- **AND** SHALL benefit from centralized validation and optimization

#### Scenario: Direct queries for simple cases

- **WHEN** a query is very simple and used only once
- **THEN** a direct query MAY be used instead of a synced query
- **AND** SHALL still use the Zero query builder
- **AND** SHALL NOT bypass Zero-sync

### Requirement: Query Documentation

The system SHALL document all synced queries with clear descriptions of parameters and return types.

#### Scenario: Query name describes purpose

- **WHEN** a synced query is defined
- **THEN** its name SHALL clearly describe what it queries
- **AND** SHALL use camelCase naming convention
- **AND** SHALL be unique across all queries

#### Scenario: Parameter types are clear

- **WHEN** a developer uses a synced query
- **THEN** TypeScript SHALL show parameter types in autocomplete
- **AND** Zod schema SHALL document expected parameter format
- **AND** validation errors SHALL reference parameter names

