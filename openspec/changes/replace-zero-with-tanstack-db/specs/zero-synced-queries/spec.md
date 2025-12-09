# zero-synced-queries Specification Delta

## REMOVED Requirements

### Requirement: Validated Query Definitions

**Reason**: Zero's `syncedQuery()` pattern is being replaced by TanStack DB collections. Collections provide equivalent functionality (type-safe queries, parameter handling) without requiring the Zero sync infrastructure.

**Migration**: Use `createCollection()` with `queryCollectionOptions()` from `@tanstack/db` instead. Define collections in `src/collections/` directory.

### Requirement: Search Entities Query

**Reason**: Search functionality will use `useLiveQuery()` over eager-synced collections for instant local search.

**Migration**: Import `assetsCollection` or `superinvestorsCollection` and use `useLiveQuery()` with filter conditions.

### Requirement: Quarterly Data Query

**Reason**: Quarterly data will be provided by `quarterlyDataCollection` with eager sync.

**Migration**: Use `useLiveQuery((q) => q.from({ data: quarterlyDataCollection }).orderBy(...))`.

### Requirement: Messages Query

**Reason**: Messages functionality was the original Zero demo feature; not actively used in the analytics application.

**Migration**: Remove messages-related code or migrate to simple TanStack Query if needed later.

### Requirement: Query Builder Integration

**Reason**: Zero's query builder is replaced by TanStack DB's query builder API in `useLiveQuery()`.

**Migration**: Use TanStack DB query builder methods: `.from()`, `.where()`, `.orderBy()`, `.limit()`.

### Requirement: Query Reusability

**Reason**: Collections are reusable by design; multiple components can use the same collection.

**Migration**: Import collections from `src/collections/` and use `useLiveQuery()` in each component.

### Requirement: Client-Side Query Usage

**Reason**: `useQuery()` from `@rocicorp/zero/react` is replaced by `useLiveQuery()` from `@tanstack/db/react`.

**Migration**: Replace `const [data] = useQuery(queries.something())` with `const { data } = useLiveQuery((q) => ...)`.

### Requirement: Server-Side Query Execution

**Reason**: Zero's `/api/zero/get-queries` endpoint is not needed; TanStack DB uses standard REST APIs via `queryFn`.

**Migration**: Remove `api/routes/zero/` directory. Collections fetch from existing API endpoints.

### Requirement: Query Performance

**Reason**: TanStack DB's d2ts query engine provides equivalent sub-millisecond performance for local queries.

**Migration**: Performance characteristics maintained; no action needed.

### Requirement: Query Error Handling

**Reason**: Error handling will use TanStack Query's standard error patterns.

**Migration**: Use `useLiveQuery()` error state or TanStack Query's `onError` callbacks.

### Requirement: Query Composition

**Reason**: TanStack DB query builder supports composition with `.where()`, `.orderBy()`, `.limit()`.

**Migration**: Use TanStack DB query builder methods for composition.

### Requirement: No Direct Query Duplication

**Reason**: Principle maintained with TanStack DB; use collections instead of duplicating query logic.

**Migration**: Continue using centralized collection definitions.

### Requirement: Query Documentation

**Reason**: Collection definitions provide equivalent type information and documentation.

**Migration**: TypeScript provides autocomplete for collection properties.
