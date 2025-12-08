# Complete Replacement: TanStack DB vs Rocicorp Zero

**Author**: Antigravity Analysis  
**Date**: 2025-12-08  
**Objective**: Evaluate whether to **completely replace Zero with TanStack DB** for this greenfield project

---

## Context & Constraints

| Factor | Your Situation |
|--------|----------------|
| **Team Size** | 1 developer |
| **Project Status** | Greenfield, not in production |
| **Both libs are Beta** | Zero 0.24.x, TanStack DB 0.x |
| **Infrastructure preference** | Avoid dedicated sync servers (like zero-cache) |
| **TanStack ecosystem** | Already using Query + Router |
| **Primary requirement** | UX must be same or better |

---

## Executive Summary

### Recommendation: **Yes, migrate to TanStack DB**

For your specific situation, TanStack DB is the better choice. Here's why:

| Factor | Zero | TanStack DB | Winner |
|--------|------|-------------|--------|
| **Infrastructure** | Requires zero-cache server + 3 DBs | None (uses existing APIs) | ✅ TanStack DB |
| **Team familiarity** | New paradigm | Extends TanStack Query | ✅ TanStack DB |
| **Solo dev complexity** | High (deploy/manage sync server) | Low (client-side only) | ✅ TanStack DB |
| **Ecosystem fit** | Standalone | Integrates with Query/Router | ✅ TanStack DB |
| **Real-time sync** | Native WebSocket | Manual (via polling/SSE) | ✅ Zero |
| **Optimistic updates** | Built-in with reconciliation | Built-in | ≈ Tie |
| **Sub-ms queries** | Yes (SQLite on client) | Yes (d2ts differential dataflow) | ≈ Tie |
| **Maturity** | Beta (Rocicorp) | Beta (TanStack team) | ≈ Tie |

**Bottom line**: Unless you need **real-time multi-user collaboration** (like Google Docs), TanStack DB gives you the same UX with less infrastructure.

---

## Part 1: What You Lose by Removing Zero

### 1.1 Real-Time Sync (WebSocket-based)

Zero provides automatic real-time sync between all connected clients:
```
Client A mutates → Zero Cache → Postgres → Zero Cache → Client B receives update
```

**TanStack DB alternative**: 
- Polling with `refetchInterval`
- Server-Sent Events (SSE)
- Manual WebSocket integration

**Impact for your app**: 
- Your app appears to be **read-heavy analytics** (investors, assets, charts)
- Mutations are rare (counter updates, possibly preferences)
- **Real-time sync is likely unnecessary** for your use case

### 1.2 Automatic Conflict Resolution

Zero uses server reconciliation from the game industry — if two clients mutate the same row, the server decides the canonical state.

**TanStack DB alternative**:
- Optimistic updates with rollback on server rejection
- You control conflict handling in your API

**Impact**: For a single-user app or read-heavy app, this is irrelevant.

### 1.3 Offline-First with Full Sync

Zero maintains a SQLite replica on the client that persists across sessions.

**TanStack DB alternative**:
- TanStack Query already caches data with `staleTime` and `gcTime`
- Can add localStorage/IndexedDB persistence if needed

**Impact**: Your app doesn't seem to require offline-first capabilities.

---

## Part 2: What You Gain with TanStack DB

### 2.1 No Additional Server

**Current Zero setup** (from your `package.json` and `dev` script):
```bash
# You're running THREE processes:
concurrently "bun run dev:api" "bun run dev:ui" "bun run dev:zero-cache"
```

**With TanStack DB**:
```bash
# Just TWO processes:
concurrently "bun run dev:api" "bun run dev:ui"
```

Zero-cache is complex:
- Requires Postgres logical replication
- Needs replication-manager + view-syncers
- Needs CVR database + change database (3 total DBs for full setup)

### 2.2 Familiar TanStack Patterns

Your existing code uses TanStack Query:
```typescript
// InvestorActivityDrilldownTable.tsx
const { data } = useQuery({
  queryKey: ["duckdb-investor-drilldown", ticker, quarter, action],
  queryFn: () => fetchDrilldown(ticker, quarter, action),
});
```

TanStack DB extends this naturally:
```typescript
// Same TanStack Query underpinnings, but with local query engine
const investorCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['investor-details'],
    queryFn: fetchInvestorDetails,
    syncMode: 'progressive',  // Fetch subset first, full sync in background
  })
);

// Live queries over local data - sub-millisecond!
const { data: investors } = useLiveQuery((q) =>
  q.from({ investor: investorCollection })
   .where(({ investor }) => eq(investor.quarter, selectedQuarter))
);
```

### 2.3 Sync Mode Flexibility

TanStack DB lets you choose per-collection:

| Sync Mode | Use Case | Your App Mapping |
|-----------|----------|------------------|
| **eager** | Load all data upfront (<10K rows) | Assets (50K), Superinvestors |
| **on-demand** | Load only queried data | Drill-down details (100M rows) |
| **progressive** | Instant first paint + background sync | Asset detail page |

This solves your "100M row problem" by design:
```typescript
// Won't accidentally sync 100M rows - only fetches what's queried
const detailCollection = createCollection(
  queryCollectionOptions({
    syncMode: 'on-demand',  // ← Key: only fetch matching data
    queryFn: async (ctx) => {
      const { quarter, ticker } = parseLoadSubsetOptions(ctx.meta?.loadSubsetOptions);
      return api.getInvestorDetails(ticker, quarter);
    },
  })
);
```

### 2.4 No Schema Synchronization Complexity

**Zero requires**:
```bash
bun run generate-zero-schema  # Generate schema from Drizzle
bunx zero-cache-dev           # Run zero-cache with schema
# Schema version mismatches can invalidate client cache
```

**TanStack DB**:
- No schema generation step
- Collections are defined in client code
- No version mismatch issues

---

## Part 3: UX Comparison (Critical Requirement)

You stated the most important part is that **UX must be same or better**. Let me analyze each interaction:

### 3.1 Initial Page Load

| Scenario | Zero | TanStack DB |
|----------|------|-------------|
| **Cold start** | ~500ms (WebSocket handshake + initial sync) | ~200ms (HTTP request) |
| **Warm start** (cached) | <100ms (SQLite) | <100ms (TanStack Query cache) |

**Winner**: ≈ Tie (TanStack DB slightly faster on cold start)

### 3.2 Search/Filter

| Scenario | Zero | TanStack DB |
|----------|------|-------------|
| **Local data** | <1ms (SQLite query) | <1ms (d2ts query) |
| **Server data** | Needs to sync first | On-demand fetch |

**Winner**: ≈ Tie

### 3.3 Chart Bar Click → Drill-down Table

This is your key use case:

**Current Zero + TanStack Query approach**:
```
Click bar → API call (200ms) → Render table
Click different bar → API call (200ms) → Render table
```

**TanStack DB with progressive mode**:
```
Page load → Fetch latest quarter (200ms) → Render table
Background: Fetch all quarters (~1s)
Click bar → LOCAL query (<1ms) → Render table ✨
Click different bar → LOCAL query (<1ms) → Render table ✨
```

**Winner**: ✅ **TanStack DB** (after initial load, all interactions are instant)

### 3.4 Data Mutations  

| Scenario | Zero | TanStack DB |
|----------|------|-------------|
| **Optimistic update** | Instant local + WebSocket sync | Instant local + HTTP POST |
| **Multi-client sync** | Automatic | Manual (polling/SSE) |

**Winner**: Zero (if you need real-time multi-user sync), otherwise Tie

### UX Verdict

For your **read-heavy analytics app with drill-down**, TanStack DB provides:
- **Same UX** for most interactions
- **Better UX** for drill-down (instant quarter switching)
- **Simpler UX debugging** (no sync state to manage)

---

## Part 4: Migration Effort Estimate

### Files to Modify/Replace

| File/Component | Current (Zero) | New (TanStack DB) | Effort |
|----------------|----------------|-------------------|--------|
| `src/zero/schema.ts` | Zero permissions | Remove | Delete |
| `src/zero/schema.gen.ts` | Generated schema | Remove | Delete |
| `src/zero/queries.ts` | `syncedQuery()` definitions | Collection definitions | Medium |
| `app/router.tsx` | Zero context | QueryClient context | Low |
| `src/main.tsx` | ZeroProvider (if any) | QueryClientProvider | Low |
| `src/pages/AssetsTable.tsx` | `useQuery` from Zero | `useLiveQuery` | Medium |
| `src/pages/AssetDetail.tsx` | `useQuery` from Zero | `useLiveQuery` | Medium |
| `src/pages/SuperinvestorsTable.tsx` | `useQuery` from Zero | `useLiveQuery` | Medium |
| `src/components/GlobalSearch.tsx` | `useQuery` from Zero | `useLiveQuery` | Medium |
| `api/routes/zero/*` | Zero endpoints | Remove | Delete |
| `package.json` | `@rocicorp/zero` | `@tanstack/db` | Low |

### Estimated Migration Time

| Phase | Tasks | Time |
|-------|-------|------|
| **Setup** | Install TanStack DB, create collections | 2 hours |
| **Core pages** | Migrate Assets, Superinvestors, Search | 4 hours |
| **Detail pages** | Migrate AssetDetail, SuperinvestorDetail | 3 hours |
| **Cleanup** | Remove Zero deps, test, fix issues | 3 hours |
| **Total** | | **~12 hours** |

---

## Part 5: Sample Migration

### Before (Zero)

```typescript
// src/pages/AssetsTable.tsx
import { useQuery, useZero } from '@rocicorp/zero/react';
import { queries } from '@/zero/queries';

export function AssetsTablePage() {
  const z = useZero();
  const [assetsPageRows] = useQuery(
    queries.assetsPage(100, 0),
    { ttl: '5m' }
  );
  
  return <DataTable data={assetsPageRows} />;
}
```

### After (TanStack DB)

```typescript
// src/collections/assets.ts
import { createCollection, queryCollectionOptions } from '@tanstack/db';

export const assetsCollection = createCollection(
  queryCollectionOptions({
    id: 'assets',
    queryKey: ['assets'],
    queryFn: async () => {
      const res = await fetch('/api/assets');
      return res.json();
    },
    syncMode: 'eager',  // 50K rows - load upfront
    getKey: (item) => item.id,
  })
);

// src/pages/AssetsTable.tsx
import { useLiveQuery } from '@tanstack/db/react';
import { assetsCollection } from '@/collections/assets';

export function AssetsTablePage() {
  const { data: assets } = useLiveQuery((q) =>
    q.from({ asset: assetsCollection })
     .orderBy(({ asset }) => asset.assetName, 'asc')
     .limit(100)
  );
  
  return <DataTable data={assets} />;
}
```

### Drill-Down with Progressive Sync

```typescript
// src/collections/investor-details.ts
export function createInvestorDetailsCollection(assetId: string) {
  return createCollection(
    queryCollectionOptions({
      id: `investor-details-${assetId}`,
      queryKey: ['investor-details', assetId],
      syncMode: 'progressive',  // ← Key for instant UX
      queryFn: async ({ meta }) => {
        if (meta?.loadSubsetOptions) {
          // First paint: fetch only requested quarter
          const { quarter } = parseLoadSubsetOptions(meta.loadSubsetOptions);
          return api.getInvestorDetails(assetId, quarter);
        }
        // Background: fetch all quarters
        return api.getAllInvestorDetails(assetId);
      },
    })
  );
}

// src/pages/AssetDetail.tsx
export function AssetDetailPage() {
  const { code: assetId } = useParams();
  const [collection] = useState(() => createInvestorDetailsCollection(assetId));
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  
  // Initial load: fetch latest quarter
  // Background: fetch all quarters for instant switching
  const { data: investors } = useLiveQuery((q) =>
    selectedQuarter
      ? q.from({ investor: collection })
         .where(({ investor }) => eq(investor.quarter, selectedQuarter))
      : null
  );
  
  // Cleanup on unmount
  useEffect(() => () => collection.clear(), [collection]);
  
  return (
    <>
      <BarChart onBarClick={(q) => setSelectedQuarter(q)} />
      <InvestorTable data={investors} />  {/* Instant after first paint! */}
    </>
  );
}
```

---

## Part 6: Risk Assessment

### Risks of Migrating to TanStack DB

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **TanStack DB is Beta** | Medium | Medium | TanStack team has strong track record; Query/Router are stable |
| **Missing features** | Low | Medium | Check their Discord/GitHub for your use cases |
| **No real-time sync** | Low (for your app) | Low | Implement polling if needed later |
| **Migration bugs** | Medium | Low | Greenfield = no production users affected |

### Risks of Staying with Zero

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Zero-cache complexity** | High | High | Already experiencing issues |
| **100M row sync accidents** | Medium | High | Requires constant vigilance |
| **Solo dev overhead** | High | Medium | Managing sync server adds work |
| **Zero is also Beta** | Medium | Medium | Same as TanStack DB |

---

## Part 7: Decision Matrix

Weighted scoring based on your constraints:

| Factor | Weight | Zero Score | TanStack DB Score |
|--------|--------|------------|-------------------|
| No extra server | 25% | 1 | 5 |
| Solo dev friendly | 20% | 2 | 5 |
| UX same or better | 25% | 4 | 5 |
| TanStack ecosystem fit | 15% | 2 | 5 |
| Maturity/stability | 10% | 3 | 3 |
| Real-time sync | 5% | 5 | 2 |
| **Weighted Total** | 100% | **2.50** | **4.65** |

---

## Final Recommendation

### ✅ Migrate to TanStack DB

**For your specific situation** (solo dev, greenfield, read-heavy analytics, no real-time collaboration needs), TanStack DB is the better choice:

1. **Removes infrastructure burden** — No zero-cache to deploy/manage
2. **Leverages existing skills** — Extends TanStack Query patterns you already use
3. **Solves the 100M row problem** — `syncMode: 'on-demand'` prevents accidental syncs
4. **Better drill-down UX** — Progressive mode gives instant quarter switching
5. **Same team confidence** — TanStack team (Tanner Linsley et al.) has proven track record

### When to Reconsider

Keep Zero (or add real-time sync) only if:
- You need **multi-user real-time collaboration** (like Google Docs)
- You need **offline-first with full dataset** persistence
- You're building a **multiplayer** or **chat** feature

For your **investor analytics dashboard**, TanStack DB is the right tool.

---

## Next Steps

1. **Create a migration branch**
2. **Install TanStack DB**: `bun add @tanstack/db`
3. **Start with one page** (e.g., AssetsTable) as proof of concept
4. **Verify UX parity** before migrating other pages
5. **Remove Zero deps** once migration is complete

Would you like me to create a detailed migration plan or start implementing the proof of concept?
