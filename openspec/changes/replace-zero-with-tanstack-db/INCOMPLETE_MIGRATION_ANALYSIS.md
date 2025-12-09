# Incomplete Migration Analysis (2025-12-09)

## Summary

The `replace-zero-with-tanstack-db` proposal was **only 50% implemented**. Collections were created but never used. Components still make HTTP requests on every interaction instead of querying a local TanStack DB database.

## What You're Experiencing

**Symptom**: Clicking different bars in the drill-down chart shows 40-50ms latency every time.

**Expected Behavior**: First click ~40-50ms (API fetch), subsequent clicks <1ms (local query).

**Actual Behavior**: Every click makes an HTTP request because there's no local database.

## Clarification: Why Latency Is 40-50ms on Every Bar Click

### Current Behavior (TanStack Query Caching)

The current implementation uses plain `useQuery` with `staleTime: 5 * 60 * 1000`:

```typescript
// src/components/InvestorActivityDrilldownTable.tsx (line 67-74)
const { data, isLoading, isFetching, isError, error } = useQuery({
  queryKey: ["duckdb-investor-drilldown", ticker, quarter, action],
  queryFn: () => fetchDrilldown(ticker, quarter, action),
  enabled,
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 10 * 60 * 1000,
});
```

**What this means:**
- Each unique `[ticker, quarter, action]` combination is a separate cache entry
- Clicking the **same bar twice** within 5 minutes → instant (cache hit)
- Clicking a **different bar** → 40-50ms HTTP request (new cache entry)

### Why "Subsequent Clicks" Are Not Instant

Your expectation that "every latency after the first one should be instantaneous" requires understanding the difference:

| Scenario | Current (useQuery) | Expected (useLiveQuery) |
|----------|-------------------|------------------------|
| Click Q1-2024 first time | ~40-50ms (HTTP) | ~40-50ms (HTTP, loads into collection) |
| Click Q1-2024 again | <1ms (cache hit) | <1ms (local query) |
| Click Q2-2024 first time | ~40-50ms (HTTP) | ~40-50ms (HTTP, loads into collection) |
| Click Q1-2024 again | <1ms (cache hit) | <1ms (local query) |
| Click Q2-2024 again | <1ms (cache hit) | <1ms (local query) |

**The difference is subtle but important:**
- **TanStack Query**: Each combination is isolated. Cache hit only for exact same combination.
- **TanStack DB**: Data accumulates in a local collection. All previously-fetched data is queryable instantly.

### What TanStack DB On-Demand Sync Would Provide

With proper `useLiveQuery` + on-demand collection:

1. **Collection accumulates data** from multiple API calls
2. First click for Q1 → fetches Q1 data into collection (~40-50ms)
3. First click for Q2 → fetches Q2 data into collection (~40-50ms)
4. Second click for Q1 → queries local collection (<1ms)
5. Second click for Q2 → queries local collection (<1ms)
6. **All previously-fetched quarters become instant**

The key difference: TanStack DB creates a **local queryable database** that accumulates data, while TanStack Query only provides **per-key HTTP caching**.

## Root Cause

### What Was Done ✅

1. **Zero Removal** - Removed `@rocicorp/zero` dependency and infrastructure
2. **Collection Factories Created** - Created `src/collections/*.ts` files with factory functions
3. **API Endpoints Created** - Created `/api/assets`, `/api/superinvestors`, etc.
4. **Components "Migrated"** - Changed imports from Zero to TanStack Query

### What Was NOT Done ❌

1. **Collections Never Instantiated** - Factory functions exist but are never called
2. **No `useLiveQuery` Usage** - Components use plain `useQuery` instead of `useLiveQuery`
3. **No Local Database** - TanStack DB collections don't exist at runtime
4. **No Progressive/On-Demand Sync** - Drill-down still makes HTTP requests every time

## Code Evidence

### Current Implementation (Wrong)

```typescript
// src/components/InvestorActivityDrilldownTable.tsx (line 67-74)
const { data, isLoading, isFetching, isError, error } = useQuery({
  queryKey: ["duckdb-investor-drilldown", ticker, quarter, action],
  queryFn: () => fetchDrilldown(ticker, quarter, action),  // ← HTTP request every time
  enabled,
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
});
```

This is **plain TanStack Query** (HTTP caching), not TanStack DB (local queryable database).

### What It Should Be (Correct)

```typescript
// What it SHOULD be (not implemented)
const investorDetailsCollection = useMemo(
  () => createInvestorDetailsCollection(queryClient, ticker, quarter, action),
  [queryClient, ticker, quarter, action]
);

const { data } = useLiveQuery((q) =>
  q.from({ details: investorDetailsCollection })
);
```

This would query a **local TanStack DB collection** (instant, <1ms).

## Why This Happened

Looking at `tasks.md`:

- ✅ Task 2.4: "Created `src/collections/investor-details.ts` factory"
- ✅ Task 4.3: "Migrated `src/pages/AssetDetail.tsx`"

But the "migration" was incomplete:
- Collections were created but never instantiated
- Components were changed to use TanStack Query but not TanStack DB
- The tasks were marked complete but the actual functionality was never implemented

## Progressive Sync Misconception

The design.md mentions "progressive" sync mode, but **TanStack DB doesn't have this mode**. Only `eager` and `on-demand` exist:

- **`eager`**: Load all data upfront (good for small datasets)
- **`on-demand`**: Load data as queries request it (good for large datasets)

For drill-down, `on-demand` achieves the desired UX:
1. First click: Loads data from API into collection (~40-50ms)
2. Subsequent clicks: Query local collection (<1ms)

## What Needs to Happen

See `tasks.md` section 10 for the complete checklist. High-level steps:

1. **Instantiate Collections** (10.1)
   - Create `src/collections/instances.ts`
   - Call factory functions with queryClient
   - Export collection instances

2. **Migrate Components to useLiveQuery** (10.2)
   - Replace `useQuery` with `useLiveQuery`
   - Query local collections instead of making HTTP requests
   - Apply filters/sorting using TanStack DB query builder

3. **Implement Drill-down with On-Demand Sync** (10.3)
   - Use `syncMode: 'on-demand'` in collection factory
   - Instantiate collection per [ticker, quarter, action]
   - First query loads from API, subsequent queries hit local collection

4. **Preload Collections on App Init** (10.5)
   - Call `assetsCollection.preload()` on mount
   - Call `superinvestorsCollection.preload()` on mount
   - Call `quarterlyDataCollection.preload()` on mount

5. **Test & Validate** (10.6)
   - Verify instant queries after preload
   - Verify drill-down latency improvement
   - Verify no HTTP requests after initial load

## Impact

**Current State**:
- Every interaction makes HTTP request
- No local queryable database
- No instant queries
- 40-50ms latency on every click

**After Completion**:
- Collections preloaded on app init
- Instant filtering/sorting/searching (<1ms)
- Drill-down: first click ~40-50ms, subsequent <1ms
- No HTTP requests after initial load (except drill-down first clicks)

## Files Updated

This analysis resulted in updates to:
- `proposal.md` - Added Phase 1/Phase 2 breakdown and status update
- `design.md` - Added current status section, updated goals, removed progressive sync
- `tasks.md` - Added section 10 with missing implementation steps
- `specs/tanstack-db-collections/spec.md` - Deprecated progressive sync scenario
- `specs/tanstack-db-live-queries/spec.md` - Added status note about non-implementation

All changes validated with `openspec validate replace-zero-with-tanstack-db --strict`.
