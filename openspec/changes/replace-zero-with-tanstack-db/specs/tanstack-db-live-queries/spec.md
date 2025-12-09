# tanstack-db-live-queries Specification

## Purpose
Define reactive local query patterns using TanStack DB's `useLiveQuery()` hook for instant, client-side data queries with sub-millisecond performance.

**STATUS (2025-12-09)**: This spec was written but NEVER IMPLEMENTED. Components still use plain `useQuery` from `@tanstack/react-query` instead of `useLiveQuery` from `@tanstack/react-db`. See tasks.md section 10 for implementation steps.

## ADDED Requirements

### Requirement: Live Query Hook Usage

The system SHALL use `useLiveQuery()` from `@tanstack/react-db` for reactive queries over local collection data.

#### Scenario: Basic live query

- **WHEN** a component imports and uses `useLiveQuery`:
```typescript
import { useLiveQuery } from '@tanstack/react-db'

const { data } = useLiveQuery((q) =>
  q.from({ asset: assetsCollection })
)
```
- **THEN** TanStack DB SHALL execute the query against local cached data
- **AND** SHALL return results with sub-millisecond latency (~0.7ms for 100K items on M1 Pro)
- **AND** SHALL update results reactively when collection data changes

### Requirement: Live Query Filtering with eq()

The system SHALL use the `eq()` function from `@tanstack/db` for equality comparisons in queries.

#### Scenario: Filter with eq() function

- **WHEN** a component queries with a filter condition:
```typescript
import { useLiveQuery } from '@tanstack/react-db'
import { eq } from '@tanstack/db'

const { data: investors } = useLiveQuery((q) =>
  q
    .from({ asset: assetsCollection })
    .where(({ asset }) => eq(asset.category, 'investor'))
)
```
- **THEN** the query SHALL filter results locally without network requests
- **AND** filter changes SHALL trigger immediate query re-execution

### Requirement: Live Query Sorting

The system SHALL support sorting in live queries using `orderBy()`.

#### Scenario: Sort query results

- **WHEN** a component queries with sorting:
```typescript
const { data } = useLiveQuery((q) =>
  q
    .from({ asset: assetsCollection })
    .orderBy(({ asset }) => asset.name, 'asc')
)
```
- **THEN** results SHALL be sorted locally
- **AND** sorting SHALL be instant

### Requirement: Live Query Selection/Projection

The system SHALL support selecting specific fields using `select()`.

#### Scenario: Select specific fields

- **WHEN** a component queries with a select clause:
```typescript
const { data } = useLiveQuery((q) =>
  q
    .from({ todo: todoCollection })
    .select(({ todo }) => ({
      id: todo.id,
      text: todo.text
    }))
)
```
- **THEN** results SHALL contain only the selected fields
- **AND** TypeScript SHALL infer the correct return type

### Requirement: Live Query Joins

The system SHALL support joining across multiple collections.

#### Scenario: Inner join across collections

- **WHEN** a component needs data from multiple collections:
```typescript
import { useLiveQuery } from '@tanstack/react-db'
import { eq } from '@tanstack/db'

const { data } = useLiveQuery((q) =>
  q
    .from({ asset: assetsCollection })
    .join(
      { details: detailsCollection },
      ({ asset, details }) => eq(details.assetId, asset.id),
      'inner'
    )
    .select(({ asset, details }) => ({
      id: asset.id,
      name: asset.name,
      detailInfo: details.info
    }))
)
```
- **THEN** collections SHALL be joined locally
- **AND** join operations SHALL be sub-millisecond

### Requirement: Suspense Support

The system SHALL provide `useLiveSuspenseQuery()` for React Suspense integration.

#### Scenario: Use Suspense for loading states

- **WHEN** a component needs Suspense-based loading:
```typescript
import { useLiveSuspenseQuery } from '@tanstack/react-db'

const { data } = useLiveSuspenseQuery((q) =>
  q.from({ asset: assetsCollection })
)
// data is guaranteed to be defined
```
- **THEN** rendering SHALL suspend during initial data load
- **AND** `data` SHALL always be defined (non-nullable)

### Requirement: Search with Live Queries

The system SHALL implement search functionality using live queries over eager-synced collections.

#### Scenario: Search implementation

- **WHEN** a user types in a search box
- **THEN** the component SHALL use `useLiveQuery()` with a filter condition
- **AND** filter SHALL match entities using appropriate comparison operators
- **AND** results SHALL update as the user types with sub-millisecond latency

### Requirement: Drill-Down with On-Demand Collections

The system SHALL use on-demand collections for drill-down functionality with large datasets.

#### Scenario: Drill-down to investor details

- **WHEN** a user clicks a quarter bar in a chart
- **THEN** the on-demand collection SHALL fetch data for that specific query
- **AND** the live query SHALL filter to show only the selected quarter
- **AND** subsequent filter changes SHALL re-query as needed

### Requirement: Optimistic Mutations via Collection Methods

The system SHALL support optimistic mutations using collection `insert()`, `update()`, and `delete()` methods.

#### Scenario: Optimistic update

- **WHEN** a component calls `collection.update(id, (draft) => { ... })`:
```typescript
const complete = (todo) => {
  // Instantly applies optimistic state
  todoCollection.update(todo.id, (draft) => {
    draft.completed = true
  })
}
```
- **THEN** the change SHALL appear immediately in all live queries
- **AND** the `onUpdate` handler SHALL persist to the server in the background
- **AND** if the handler fails, the optimistic state SHALL be rolled back

### Requirement: Live Query Loading States

The system SHALL handle loading states appropriately for live queries.

#### Scenario: Initial collection loading

- **WHEN** a collection is fetching initial data
- **THEN** `useLiveQuery()` SHALL return `data` as undefined or empty
- **AND** the component SHALL show appropriate loading UI
- **AND** the component SHALL NOT flash empty content

#### Scenario: Data available from cache

- **WHEN** collection data is already cached (warm start)
- **THEN** `useLiveQuery()` SHALL return data immediately
- **AND** no loading state SHALL be shown
- **AND** page render SHALL be instant

### Requirement: No Direct Fetch for Collection Data

The system SHALL NOT use `fetch()` for data that exists in collections.

#### Scenario: Prefer live queries over fetch

- **WHEN** data is available in a TanStack DB collection
- **THEN** components SHALL use `useLiveQuery()` for access
- **AND** SHALL NOT call API endpoints directly for the same data
- **AND** SHALL benefit from instant local query execution

#### Scenario: Exception for non-collection data (DuckDB search)

- **WHEN** data is NOT in a collection (e.g., DuckDB search endpoint)
- **THEN** using regular TanStack Query with `fetch()` is acceptable
- **AND** the `DuckDBGlobalSearch` component SHALL remain unchanged

### Requirement: Derived Collections from Queries

The system SHALL support using live query results as derived collections for materialized views.

#### Scenario: Create materialized view

- **WHEN** a live query is executed
- **THEN** it SHALL return a collection that can also be queried
- **AND** derived collections SHALL behave as materialized views
- **AND** SHALL update reactively when source data changes
