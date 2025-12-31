## Context

This app uses a 3-tier caching strategy for DuckDB data:
1. **Memory cache** - JavaScript Map/Object, cleared on page refresh
2. **IndexedDB** - Persistent cache via `idb-keyval`, 7-day TTL
3. **API** - Fallback to DuckDB via Hono endpoints

The problem: When DuckDB is updated (ETL runs), frontend caches serve stale data. The 7-day TTL means users could see week-old data even after refreshing.

**Constraints:**
- Performance is #1 priority - must not add latency to normal page loads
- DuckDB is read-only from this app (external ETL pipeline owns writes)
- Multiple IndexedDB stores exist (cik-quarterly, search-index, drilldown, tanstack-query-cache)
- Must work with existing TanStack DB collection pattern

## Goals / Non-Goals

**Goals:**
- Detect when DuckDB data is fresher than frontend cache
- Automatically invalidate stale caches
- Minimal overhead (single lightweight API call on app load)
- Preserve instant-load UX when cache is fresh

**Non-Goals:**
- Real-time push notifications (SSE/WebSocket) - overkill for infrequent ETL updates
- Per-collection versioning - adds complexity, DuckDB updates typically affect all tables
- Polling - unnecessary, check on app load is sufficient

## Decisions

### 1. Use `last_data_load_date` as global data version

**Decision:** Single version stamp from `high_level_totals.last_data_load_date` for all caches.

**Rationale:**
- Already exists in DuckDB (set by ETL pipeline)
- Simple to query (single row table)
- DuckDB ETL typically updates all tables together
- Avoids tracking per-table versions

**Alternatives considered:**
- Per-table version tracking: More granular but adds complexity, ETL updates are typically all-or-nothing
- ETag headers per API: Requires backend changes to all endpoints, more HTTP overhead
- Polling: Unnecessary for infrequent updates (daily/weekly ETL)

### 2. Store version in localStorage (not IndexedDB)

**Decision:** Use `localStorage.getItem('app-data-version')` for version tracking.

**Rationale:**
- Synchronous access (no async/await needed)
- Survives IndexedDB clear (important: we clear IndexedDB when stale)
- Fast to check on app load
- Independent of cached data stores

**Alternatives considered:**
- IndexedDB: Would be cleared when invalidating caches, circular dependency
- Cookie: Works but localStorage is simpler and sufficient
- Memory only: Would lose version on refresh, defeating the purpose

### 3. Check on app load + tab focus

**Decision:** Check freshness on:
1. App initialization (before preloading collections)
2. Tab focus (when returning to long-running session)

**Rationale:**
- App load: Catches stale cache from previous sessions
- Tab focus: Handles users who leave tabs open for hours/days
- No polling: Minimal overhead, checks only when user is active

**Alternatives considered:**
- Every fetch: Too much overhead, defeats instant-load UX
- Periodic polling: Unnecessary complexity for infrequent updates
- App load only: Misses stale data in long-running sessions

### 4. Global IndexedDB clear (nuke all databases)

**Decision:** When data is stale, delete ALL IndexedDB databases using `indexedDB.databases()` API, then refetch.

**Rationale:**
- DuckDB ETL updates all tables together (consistent snapshot)
- Future-proof: automatically handles new caches added later
- No need to maintain a list of store names
- Simpler than tracking per-collection staleness
- Avoids partial staleness (some collections fresh, others stale)
- Collections will refetch on demand after clear

**Implementation:**
```typescript
async function clearAllIndexedDB(): Promise<void> {
    const databases = await indexedDB.databases();
    await Promise.all(
        databases.map(db => new Promise<void>((resolve, reject) => {
            const req = indexedDB.deleteDatabase(db.name!);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        }))
    );
}
```

**Alternatives considered:**
- Per-collection invalidation: Adds complexity, requires per-table versioning, must maintain list of stores
- Lazy invalidation: Could serve stale data before fresh data loads

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  App Load / Tab Focus                                           │
│    │                                                            │
│    ▼                                                            │
│  GET /api/data-freshness                                        │
│    │                                                            │
│    ▼                                                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  DuckDB: SELECT last_data_load_date FROM high_level_totals  ││
│  └─────────────────────────────────────────────────────────────┘│
│    │                                                            │
│    ▼                                                            │
│  { lastDataLoadDate: "2024-12-30" }                             │
│    │                                                            │
│    ▼                                                            │
│  Compare with localStorage['app-data-version']                  │
│    │                                                            │
│    ├── MATCH ────────► Continue with cached data (instant UI)   │
│    │                                                            │
│    └── MISMATCH ─────► invalidateAllCaches()                    │
│                        ├── Clear IndexedDB stores               │
│                        ├── Clear memory caches                  │
│                        ├── Update localStorage version          │
│                        └── Continue (collections refetch)       │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Fresh Cache (Common Case)
1. App loads
2. `checkDataFreshness()` → API returns `2024-12-30`
3. localStorage has `2024-12-30` → MATCH
4. Skip invalidation, use IndexedDB cache
5. Instant UI with cached data

### Stale Cache (After ETL Update)
1. App loads
2. `checkDataFreshness()` → API returns `2024-12-31` (updated)
3. localStorage has `2024-12-30` → MISMATCH
4. `invalidateAllCaches()`:
   - Enumerate all IndexedDB databases via `indexedDB.databases()`
   - Delete each database via `indexedDB.deleteDatabase(name)`
   - Clear in-memory caches (cikDataCache, etc.)
5. Update localStorage to `2024-12-31`
6. Continue with normal preload (fresh API fetches)

## Why localStorage for Version + IndexedDB for Data

| Storage | Use | Reason |
|---------|-----|--------|
| **localStorage** | Version string (`"2024-12-30"`) | Sync access, survives IndexedDB nuke, tiny data |
| **IndexedDB** | All cached data | Large structured data, complex objects, efficient storage |

When we detect stale data, we nuke ALL IndexedDB databases. The version in localStorage survives this, so we know what version we just updated to.

## Risks / Trade-offs

### Risk: Freshness check adds latency
**Mitigation:** Single lightweight query (`SELECT last_data_load_date FROM high_level_totals LIMIT 1`), typically <10ms.

### Risk: False invalidation if `last_data_load_date` changes format
**Mitigation:** Store as ISO string, compare as strings. ETL pipeline should maintain consistent format.

### Risk: Race condition between check and cache clear
**Mitigation:** Sequential execution - check completes before any cache access.

### Trade-off: All-or-nothing invalidation
**Accepted:** Clears all caches even if only one table changed. This is acceptable because:
- ETL typically updates all tables together
- Simpler implementation
- Consistent data state

## Open Questions

1. **What if `high_level_totals` is empty?** → Return null, skip invalidation (assume fresh install)
2. **What if API fails?** → Log warning, continue with cache (fail open for UX)
3. **Should tab focus check be debounced?** → Yes, debounce to 5 seconds to avoid rapid re-checks
