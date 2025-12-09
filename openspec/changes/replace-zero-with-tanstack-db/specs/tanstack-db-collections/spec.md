# tanstack-db-collections Specification

## Purpose
Define reusable TanStack DB collection configurations for local-first data access with configurable sync modes, using QueryCollection pattern with TanStack Query integration.

## ADDED Requirements

### Requirement: QueryCollection Pattern with TanStack Query

The system SHALL define collections using `createCollection()` from `@tanstack/react-db` with `queryCollectionOptions()` from `@tanstack/query-db-collection`.

#### Scenario: Create collection with TanStack Query

- **WHEN** a developer creates a collection
- **THEN** it SHALL import `createCollection` from `@tanstack/react-db`
- **AND** SHALL import `queryCollectionOptions` from `@tanstack/query-db-collection`
- **AND** SHALL specify `queryKey`, `queryFn`, `getKey`, and optionally `schema`

#### Scenario: Collection queryFn fetches from API

- **WHEN** a QueryCollection is initialized
- **THEN** TanStack Query SHALL execute the `queryFn` 
- **AND** SHALL use standard TanStack Query caching and invalidation
- **AND** SHALL populate the collection with the returned data

### Requirement: Sync Mode Configuration

The system SHALL support three sync modes to optimize data loading based on dataset size and access patterns.

#### Scenario: Eager sync mode (default)

- **WHEN** a collection is defined without `syncMode` or with `syncMode: 'eager'`
- **THEN** TanStack DB SHALL load the entire collection upfront
- **AND** SHALL be best for datasets with <10K rows of mostly static data
- **AND** all queries SHALL execute instantly against local data

#### Scenario: On-demand sync mode

- **WHEN** a collection is defined with `syncMode: 'on-demand'`
- **THEN** TanStack DB SHALL only fetch data when queries request it
- **AND** SHALL pass query predicates to `queryFn` via `ctx.meta?.loadSubsetOptions`
- **AND** developers SHALL use `parseLoadSubsetOptions()` to extract query parameters
- **AND** SHALL prevent accidental full dataset syncs for large tables (>50K rows)

#### Scenario: Progressive sync mode

- **WHEN** a collection is defined with `syncMode: 'progressive'`
- **THEN** TanStack DB SHALL fetch a query subset immediately for instant first paint
- **AND** SHALL sync the full dataset in the background
- **AND** SHALL be best for collaborative apps needing instant first paint AND sub-millisecond queries

### Requirement: Assets Collection

The system SHALL provide an `assetsCollection` for investor analytics asset data.

#### Scenario: Define assets collection

- **WHEN** `assetsCollection` is imported from `src/collections/assets.ts`
- **THEN** it SHALL be created with:
```typescript
import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'

export const assetsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await fetch('/api/assets')
      return res.json()
    },
    getKey: (item) => item.id,
    // syncMode: 'eager' is default
  })
)
```
- **AND** SHALL use the default eager sync mode since dataset is ~50K rows

### Requirement: Superinvestors Collection

The system SHALL provide a `superinvestorsCollection` for investor data.

#### Scenario: Define superinvestors collection

- **WHEN** `superinvestorsCollection` is imported
- **THEN** it SHALL use default eager sync mode
- **AND** SHALL fetch from `/api/superinvestors` endpoint
- **AND** SHALL use `cik` as the unique key via `getKey: (item) => item.cik`

### Requirement: Quarterly Data Collection

The system SHALL provide a `quarterlyDataCollection` for chart data.

#### Scenario: Define quarterly data collection

- **WHEN** `quarterlyDataCollection` is imported
- **THEN** it SHALL use default eager sync mode
- **AND** SHALL fetch from `/api/quarterly-data` endpoint
- **AND** data SHALL be available for instant chart rendering

### Requirement: Investor Details Collection Factory

The system SHALL provide a factory function for creating investor detail collections with on-demand sync to handle large datasets.

#### Scenario: Create on-demand investor details collection

- **WHEN** `createInvestorDetailsCollection(assetId)` is called  
- **THEN** it SHALL return a collection with `syncMode: 'on-demand'`
- **AND** the `queryFn` SHALL use `parseLoadSubsetOptions()` to extract query parameters
- **AND** SHALL pass parameters to the API endpoint

#### Scenario: On-demand collection queryFn example

- **WHEN** the investor details collection is queried
- **THEN** the queryFn SHALL be implemented as:
```typescript
queryFn: async (ctx) => {
  const params = parseLoadSubsetOptions(ctx.meta?.loadSubsetOptions)
  return api.getInvestorDetails(assetId, params)
}
```
- **AND** query predicates SHALL be automatically passed via `loadSubsetOptions`

### Requirement: Collection Schemas (Recommended)

The system SHALL define schemas for collections using Standard Schema compatible libraries when type safety is required.

#### Scenario: Define collection with Zod schema

- **WHEN** a collection is created with a schema
- **THEN** it SHALL use a Standard Schema compatible library (Zod, Valibot, ArkType, Effect)
- **AND** the schema SHALL provide runtime validation
- **AND** SHALL enable type transformations (e.g., string → Date)
- **AND** SHALL populate default values for missing fields

### Requirement: Collection Mutation Handlers

The system SHALL define mutation handlers on collections for write operations.

#### Scenario: Define collection with onUpdate handler

- **WHEN** a collection needs to support updates
- **THEN** it SHALL specify an `onUpdate` handler:
```typescript
onUpdate: async ({ transaction }) => {
  const { original, changes } = transaction.mutations[0]
  await api.update(original.id, changes)
}
```
- **AND** updates SHALL be optimistic with automatic rollback on error

#### Scenario: Define collection with onInsert handler

- **WHEN** a collection needs to support inserts
- **THEN** it SHALL specify an `onInsert` handler
- **AND** new items SHALL be optimistically added to the collection

### Requirement: Collection Query Key Integration

The system SHALL integrate collection query keys with TanStack Query for cache management.

#### Scenario: Invalidate collection cache

- **WHEN** `queryClient.invalidateQueries({ queryKey: ['assets'] })` is called
- **THEN** the assets collection SHALL refetch data
- **AND** live queries SHALL reflect updated data reactively

#### Scenario: Automatic request deduplication

- **WHEN** multiple components use the same collection
- **THEN** TanStack DB SHALL deduplicate requests
- **AND** SHALL perform delta loading when expanding queries
- **AND** SHALL respect TanStack Query cache policies
