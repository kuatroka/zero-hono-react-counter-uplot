## Context

This project is a real-time analytics application currently using Rocicorp Zero for local-first sync. The application is developed by a solo developer and is not yet in production. Analysis in `docs/TANSTACK_DB_VS_ZERO_EVALUATION.md` recommends migrating to TanStack DB to reduce infrastructure complexity while maintaining equivalent UX.

**Key Constraints:**
- Solo developer with limited capacity for infrastructure management
- Read-heavy analytics workload (investors, assets, charts)
- Minimal real-time collaboration requirements
- Already using TanStack Query and TanStack Router
- DuckDB global search must be preserved

## Goals / Non-Goals

**Goals:**
- Eliminate zero-cache server infrastructure ✅
- Maintain sub-millisecond query performance for cached data (TO BE COMPLETED)
- Preserve instant search/filter UX (TO BE COMPLETED)
- Enable instant drill-down switching via on-demand sync (TO BE COMPLETED)
- Simplify development workflow (2 processes instead of 3) ✅

**Non-Goals:**
- Real-time multi-user collaboration (not required for analytics)
- Full offline-first with persistent local database
- WebSocket-based live sync between clients

## Decisions

### Decision 1: Use TanStack DB Collections for Data Management
**What:** Replace Zero synced queries with TanStack DB collections using `createCollection()` and `queryCollectionOptions()`.

**Why:** TanStack DB collections provide equivalent local-first functionality through TanStack Query integration, which the project already uses. This avoids learning a new paradigm.

**Alternatives considered:**
- Keep Zero: Higher operational complexity, requires zero-cache server
- Plain TanStack Query: No local query engine, requires server round-trips for filtering

### Decision 2: Sync Mode Strategy
**What:** Use different sync modes per collection based on data size and access patterns.

| Collection | Sync Mode | Rationale |
|------------|-----------|-----------|
| Assets (~50K rows) | `eager` | Small enough to load upfront for instant filtering |
| Superinvestors (~1K rows) | `eager` | Small dataset, frequently searched |
| Quarterly Data (~500 rows) | `eager` | Chart data, always needed |
| Investor Details (~100M rows) | `on-demand` | Too large to sync; fetch only queried data |
| Drill-down Data | `on-demand` | Fetch on first click, subsequent clicks query local collection |

**Why:** Prevents accidentally syncing large datasets while enabling instant UX for small datasets.

**Note (2025-12-09):** TanStack DB only supports `eager` and `on-demand` sync modes. There is no `progressive` mode. For drill-down data, `on-demand` achieves the desired UX: first click loads from API (~40-50ms), subsequent clicks query the local collection (<1ms).

### Decision 3: Preserve DuckDB Global Search
**What:** Keep the existing DuckDB-based global search completely unchanged.

**Why:** The DuckDB search (`add-duckdb-global-search` change) uses TanStack Query to call a Hono API endpoint, which is orthogonal to the Zero replacement. No code changes needed.

### Decision 4: Mutation Strategy
**What:** Replace Zero custom mutators with simple API calls using TanStack Query's `useMutation()`.

**Why:** The app has minimal mutations (counter updates, possibly preferences). Direct API mutations with optimistic updates are simpler than Zero's custom mutator pattern.

## Data Flow Comparison

### Current (Zero-sync)
```
                                    ┌──────────────┐
┌───────────┐    WebSocket          │  Zero Cache  │     WAL Replication
│  React    │ <------------------>  │   Server     │ <----------------> PostgreSQL
│   UI      │    Sync + Mutations   │  (Port 4848) │
└───────────┘                       └──────────────┘
      ↓
  IndexedDB
  (SQLite)
```

### Proposed (TanStack DB)
```
┌───────────┐      HTTP/REST      ┌───────────┐
│  React    │ <---------------->  │  Hono API │ <---------> PostgreSQL
│   UI      │   TanStack Query    │ (Port 4000)│
└───────────┘                     └───────────┘
      ↓
  TanStack DB
  (In-memory d2ts)
```

**Key difference:** No dedicated sync server. Data fetched via existing API patterns.

## Migration Approach

**Phase 1: Setup (~2 hours)** ✅ COMPLETED
- Add `@tanstack/db` dependency ✅
- Create `src/collections/` directory structure ✅
- Define collection factories for each entity type ✅
- Remove Zero dependencies and files ✅
- Update package.json scripts ✅

**Phase 2: Collection Instantiation (~2 hours)** ⚠️ NOT DONE
- Create `src/collections/instances.ts` to instantiate collections
- Call factory functions with queryClient
- Export collection instances for use in components
- Add collection preload in app provider

**Phase 3: Component Migration (~4 hours)** ⚠️ NOT DONE
- Migrate AssetsTable to `useLiveQuery()` (currently uses plain `useQuery`)
- Migrate SuperinvestorsTable to `useLiveQuery()` (currently uses plain `useQuery`)
- Migrate AssetDetail quarterly data to `useLiveQuery()` (currently uses plain `useQuery`)
- Migrate drill-down table to `useLiveQuery()` with on-demand sync

**Phase 4: Testing & Validation (~2 hours)** ⚠️ NOT DONE
- Verify instant queries after collection preload
- Verify drill-down latency: first click ~40-50ms, subsequent <1ms
- Test all pages for regressions
- Verify no HTTP requests after initial preload (except drill-down first clicks)

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| TanStack DB is beta | Medium | Medium | TanStack team track record; Query/Router stable |
| Missing real-time sync | Low (for this app) | Low | Implement polling if needed later |
| Migration bugs | Medium | Low | Greenfield = no production users |
| Learning curve | Low | Low | Already using TanStack Query |

## Open Questions

1. ~~Should we keep Zero as fallback during migration?~~ **RESOLVED**: No, clean cut for simplicity ✅
2. ~~What polling interval (if any) for data freshness?~~ **RESOLVED**: Start without polling, add if needed ✅
3. ~~Should chart data use progressive sync?~~ **RESOLVED**: No, eager sync since ~500 rows is small. Also, progressive mode doesn't exist in TanStack DB ✅

## Current Status (2025-12-09)

**Problem**: Migration stopped halfway. Collections exist but are never used.

**What's Working**:
- ✅ Zero removed, 2-process dev workflow
- ✅ Collection factories created
- ✅ API endpoints created
- ✅ Components use TanStack Query for HTTP caching

**What's NOT Working**:
- ❌ Collections never instantiated
- ❌ Components use plain `useQuery` instead of `useLiveQuery`
- ❌ No local queryable database
- ❌ Every click makes HTTP request (~40-50ms)
- ❌ No instant queries after first load

**Root Cause**: Tasks 10.1-10.6 were never completed. The migration stopped at "create collection factories" and never got to "actually use them in components."

**Next Steps**: Complete Phase 2-4 of migration approach (see tasks.md section 10)

## Detailed Analysis: Why 40-50ms on Every Bar Click (2025-12-09)

### User Observation
When clicking through different bars on the aggregate bar chart, the latency helper shows 40-50ms for every click, not just the first one.

### Expected vs Actual Behavior

| Scenario | Expected (with TanStack DB) | Actual (current) |
|----------|----------------------------|------------------|
| First click on Q1-2024 | ~40-50ms (API fetch) | ~40-50ms (HTTP) |
| Click Q1-2024 again | <1ms (local query) | <1ms (cache hit) |
| First click on Q2-2024 | ~40-50ms (API fetch) | ~40-50ms (HTTP) |
| Click Q1-2024 again | <1ms (local query) | <1ms (cache hit) |
| Click Q2-2024 again | <1ms (local query) | <1ms (cache hit) |

**Key insight**: The current behavior (TanStack Query caching) and expected behavior (TanStack DB) are **identical for clicking the same bar twice**. The difference emerges when you want to query across previously-fetched data or apply different filters to accumulated data.

### Why TanStack Query Caching Is Not Enough

Current implementation:
```typescript
useQuery({
  queryKey: ["duckdb-investor-drilldown", ticker, quarter, action],
  queryFn: () => fetchDrilldown(ticker, quarter, action),
  staleTime: 5 * 60 * 1000,
})
```

- Each `[ticker, quarter, action]` is a **separate cache entry**
- Clicking Q1 caches Q1 data
- Clicking Q2 caches Q2 data
- Clicking Q1 again → cache hit (instant)
- But: Cannot query across Q1+Q2 data locally

### What TanStack DB Would Provide

With `useLiveQuery` + on-demand collection:
```typescript
const investorDetailsCollection = createInvestorDetailsCollection(queryClient, ticker)

const { data } = useLiveQuery((q) =>
  q.from({ details: investorDetailsCollection })
   .where(({ details }) => eq(details.quarter, selectedQuarter))
)
```

- Collection **accumulates data** from multiple API calls
- First click for Q1 → fetches Q1 data into collection
- First click for Q2 → fetches Q2 data into collection
- Now collection contains Q1+Q2 data
- Subsequent queries filter locally (<1ms)
- Can apply complex filters across all accumulated data

### Clarification: "Progressive" Sync Mode

The original proposal mentioned "progressive" sync mode. **TanStack DB does not have this mode.** Only two modes exist:

1. **`eager`** (default): Load all data upfront on collection initialization
2. **`on-demand`**: Load data incrementally as queries request it

For the drill-down use case, `on-demand` is correct:
- First query for a quarter triggers API fetch
- Data is added to the local collection
- Subsequent queries for the same data are instant
- No background syncing of other quarters (not needed)
