# Progressive Loading Analysis: TanStack DB with REST APIs

## Executive Summary

**Question**: Can TanStack DB support progressive loading patterns with REST APIs (e.g., load latest quarter first, then backfill older data)?

**Answer**: **YES** - Progressive loading is fully supported through custom sync functions, but requires manual orchestration since TanStack DB doesn't have built-in REST API adapters.

## Background

The "other AI" claimed that progressive loading wasn't possible with TanStack DB because `queryCollectionOptions` replaces the entire collection state on each call. This analysis examines whether that's accurate and explores the actual capabilities.

## Two Approaches to REST API Integration

### Approach A: `queryCollectionOptions` (Current Pattern)

**How it works:**
```typescript
const assetsCollection = createCollection({
  source: queryCollectionOptions({
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await fetch('/api/assets');
      return res.json();
    },
  }),
});
```

**Characteristics:**
- ✅ Simple, declarative API
- ✅ Automatic React Query integration
- ✅ Built-in caching, refetching, error handling
- ❌ **Replaces entire collection state on each fetch**
- ❌ Cannot accumulate data from multiple API calls
- ❌ Not suitable for progressive loading

**The "other AI" was correct about this approach** - `queryCollectionOptions` does replace state and cannot do progressive loading.

### Approach B: Custom Sync Functions (Progressive Loading)

**How it works:**
```typescript
const drilldownCollection = createCollection({
  source: customSyncFunction({
    sync: async ({ write, markReady }, { ticker }) => {
      // Step 1: Load latest quarter first
      const latestRes = await fetch(`/api/drilldown?ticker=${ticker}&quarter=latest`);
      const latestData = await latestRes.json();
      
      // Write first batch and mark ready for instant UI
      latestData.forEach(item => write({ type: 'insert', value: item }));
      markReady(); // UI can now render with partial data
      
      // Step 2: Load remaining quarters in background
      const historicalRes = await fetch(`/api/drilldown?ticker=${ticker}&quarters=all`);
      const historicalData = await historicalRes.json();
      
      // Accumulate more data into the same collection
      historicalData.forEach(item => write({ type: 'insert', value: item }));
    },
  }),
});
```

**Characteristics:**
- ✅ **Full control over data accumulation**
- ✅ Can call `write()` multiple times to add data incrementally
- ✅ `markReady()` enables fast first paint with partial data
- ✅ Perfect for progressive loading patterns
- ❌ More code to write (manual orchestration)
- ❌ Need to handle caching, errors, refetching yourself

**This is how sync engines work** - they call `write()` many times as data arrives from the server.

## Current Implementation Analysis

### Your Current Approach: React Query Cache Accumulation

**File**: `src/pages/AssetDetail.tsx`

```typescript
const { data: drilldownData } = useQuery({
  queryKey: ['investor-activity-drilldown', hasCusip && cusip ? cusip : code],
  queryFn: async () => {
    // Load latest quarter first
    const latestRes = await fetch(`/api/investor-drilldown?ticker=${code}&latest=true`);
    const latestData = await latestRes.json();
    
    // Background load all quarters
    fetch(`/api/investor-drilldown?ticker=${code}`)
      .then(res => res.json())
      .then(allData => {
        queryClient.setQueryData(
          ['investor-activity-drilldown', hasCusip && cusip ? cusip : code],
          allData
        );
      });
    
    return latestData;
  },
});
```

**What this does:**
1. ✅ Returns latest quarter immediately (fast first paint)
2. ✅ Loads full dataset in background
3. ✅ Updates React Query cache when complete
4. ✅ **This IS progressive loading** - just not using TanStack DB collections

**Why it works:**
- React Query cache is separate from TanStack DB collections
- You can update the cache multiple times with different data
- UI re-renders automatically when cache updates

**Trade-offs:**
- ✅ Simple, works great, good performance
- ❌ Can't use `useLiveQuery` for instant filtering/sorting
- ❌ Not using TanStack DB's collection system
- ❌ Architectural inconsistency (Assets/Superinvestors use collections, drilldown doesn't)

## Comparison: Current vs. Ideal

### Current (React Query Cache)

**Architecture:**
```
API → React Query Cache → useQuery → Component State
```

**Capabilities:**
- ✅ Progressive loading (latest first, then backfill)
- ✅ Automatic caching and refetching
- ❌ No instant client-side filtering/sorting
- ❌ No `useLiveQuery` support

**Performance:**
- First click: ~40-50ms (API call)
- Subsequent clicks: <1ms (cache hit)
- Filtering/sorting: N/A (not implemented)

### Ideal (TanStack DB Collection with Custom Sync)

**Architecture:**
```
API → Custom Sync Function → TanStack DB Collection → useLiveQuery → Component State
```

**Capabilities:**
- ✅ Progressive loading (latest first, then backfill)
- ✅ Instant client-side filtering/sorting (<1ms)
- ✅ `useLiveQuery` support
- ❌ Manual cache/error handling

**Performance:**
- First click: ~40-50ms (API call)
- Subsequent clicks: <1ms (collection query)
- Filtering/sorting: <1ms (in-memory queries)

## Implementation Options

### Option A: Keep Current Approach (Recommended for now)

**When to choose:**
- You don't need instant filtering/sorting on drilldown data
- Current performance is acceptable
- Want to minimize code changes

**Pros:**
- ✅ Already working perfectly
- ✅ Simple, maintainable
- ✅ Good performance

**Cons:**
- ❌ Architectural inconsistency
- ❌ Can't leverage `useLiveQuery` benefits

### Option B: Migrate to Custom Sync Function

**When to choose:**
- You want instant filtering/sorting on drilldown data
- You want architectural consistency across all data
- You're willing to invest 2-3 hours in refactoring

**Implementation plan:**

1. **Create custom sync function** (`src/collections/investor-drilldown.ts`):
```typescript
import { createCollection, customSyncFunction } from '@tanstack/react-db';

export const investorDrilldownCollection = createCollection({
  name: 'investorDrilldown',
  schema: {
    id: 'string',
    ticker: 'string',
    quarter: 'string',
    // ... other fields
  },
  source: customSyncFunction({
    sync: async ({ write, markReady }, { ticker }) => {
      // Load latest quarter
      const latestRes = await fetch(`/api/investor-drilldown?ticker=${ticker}&latest=true`);
      const latestData = await latestRes.json();
      
      latestData.forEach(item => write({ type: 'insert', value: item }));
      markReady();
      
      // Background load all quarters
      const allRes = await fetch(`/api/investor-drilldown?ticker=${ticker}`);
      const allData = await allRes.json();
      
      allData.forEach(item => write({ type: 'insert', value: item }));
    },
  }),
});
```

2. **Update AssetDetail.tsx to use `useLiveQuery`**:
```typescript
const drilldownData = useLiveQuery((q) =>
  q.from({ drilldown: investorDrilldownCollection })
    .where('ticker', '=', code)
    .select()
);
```

3. **Add instant filtering/sorting**:
```typescript
const filteredData = useLiveQuery((q) =>
  q.from({ drilldown: investorDrilldownCollection })
    .where('ticker', '=', code)
    .where('quarter', '>=', '2023-Q1')
    .orderBy('quarter', 'desc')
    .select()
);
```

**Estimated effort**: 2-3 hours

## Conclusion

**The "other AI" was partially correct:**
- ✅ `queryCollectionOptions` does replace state (can't do progressive loading)
- ❌ But they missed that custom sync functions CAN do progressive loading

**Your current implementation:**
- ✅ IS progressive loading (latest first, then backfill)
- ✅ Works great with good performance
- ❌ Just doesn't use TanStack DB collections

**Recommendation:**
- Keep current approach unless you need instant filtering/sorting on drilldown data
- If you want architectural consistency and `useLiveQuery` benefits, migrate to custom sync function (Option B)
- Progressive loading with REST APIs is definitely possible with TanStack DB - just requires custom sync functions

## Migration steps executed (Dec 2025)

- Added `investorDrilldownCollection` and moved drill-down rows into TanStack DB instead of React Query cache.
- Wired `fetchDrilldownData`/`backgroundLoadAllDrilldownData` to write into the collection and dedupe by synthetic `id`.
- Swapped `InvestorActivityDrilldownTable` and debug table to read via `useLiveQuery` over the collection.
- Kept eager latest-quarter fetch plus background backfill semantics from the previous React Query flow.
- Added collection init guard (`ensureDrilldownCollectionReady`) to refetch once before manual writes.

## References

- TanStack DB Custom Sync Functions: https://tanstack.com/db/latest/docs/framework/react/guides/custom-sync-functions
- React Query Cache Updates: https://tanstack.com/query/latest/docs/framework/react/guides/updates-from-mutation-responses
