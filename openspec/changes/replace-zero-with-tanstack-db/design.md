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
- Eliminate zero-cache server infrastructure
- Maintain sub-millisecond query performance for cached data
- Preserve instant search/filter UX
- Enable instant drill-down switching via progressive sync
- Simplify development workflow (2 processes instead of 3)

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
| Drill-down Data | `progressive` | Fetch current quarter first, others in background |

**Why:** Prevents accidentally syncing large datasets while enabling instant UX for small datasets.

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

**Phase 1: Setup (~2 hours)**
- Add `@tanstack/db` dependency
- Create `src/collections/` directory structure
- Define collection factories for each entity type

**Phase 2: Core Pages (~4 hours)**
- Migrate AssetsTable to `useLiveQuery()`
- Migrate SuperinvestorsTable to `useLiveQuery()`
- Migrate Zero-based GlobalSearch (DuckDB search unchanged)

**Phase 3: Detail Pages (~3 hours)**
- Migrate AssetDetail with progressive sync for drill-down
- Migrate SuperinvestorDetail

**Phase 4: Cleanup (~3 hours)**
- Remove Zero dependencies and files
- Update package.json scripts
- Test all pages for regressions

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| TanStack DB is beta | Medium | Medium | TanStack team track record; Query/Router stable |
| Missing real-time sync | Low (for this app) | Low | Implement polling if needed later |
| Migration bugs | Medium | Low | Greenfield = no production users |
| Learning curve | Low | Low | Already using TanStack Query |

## Open Questions

1. Should we keep Zero as fallback during migration? (Recommendation: No, clean cut for simplicity)
2. What polling interval (if any) for data freshness? (Recommendation: Start without polling, add if needed)
3. Should chart data use progressive sync? (Recommendation: No, eager sync since ~500 rows is small)
