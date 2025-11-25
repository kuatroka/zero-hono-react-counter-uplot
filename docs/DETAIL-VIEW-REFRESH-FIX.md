# Detail View Refresh Flash Fix

## Problem

When clicking the browser refresh button from a detail view (asset or superinvestor), there was a visible flash showing "Loading..." even though the data is small and should load instantly from IndexedDB.

## Root Cause

On a hard browser refresh:
1. The entire React app remounts and JavaScript context is destroyed
2. Zero re-initializes and needs to re-open IndexedDB
3. Queries need to be re-registered and synced from IndexedDB
4. During this brief period (few milliseconds), `useQuery` returns a loading state
5. The components showed "Loading..." causing a visible flash

## Solution

Implemented a two-part fix:

### 1. Improved Loading State Logic in Detail Components

**Before:**
```tsx
// AssetDetail.tsx
const [rows] = useQuery(queries.assetBySymbol(asset));
if (!rows) {
  return <div>Loading…</div>;
}
```

**After:**
```tsx
const [rows, result] = useQuery(queries.assetBySymbol(asset));
const record = rows?.[0];

if (record) {
  // We have data, render it immediately (even if still syncing)
} else if (result.type === 'unknown') {
  // Still loading and no cached data yet
  return <div>Loading…</div>;
} else {
  // Query completed but no record found
  return <div>Asset not found.</div>;
}
```

This ensures we:
- Show cached data immediately when available (even during sync)
- Only show loading state when truly no data exists yet
- Distinguish between "loading" and "not found" states

### 2. Preload Detail Queries on Hover/Click

Added preloading in table pages so detail data is cached before navigation:

**AssetsTable.tsx:**
```tsx
<a
  href={`/assets/${row.asset}`}
  onMouseEnter={() => {
    z.preload(queries.assetBySymbol(row.asset), { ttl: '5m' });
  }}
  onClick={(e) => {
    e.preventDefault();
    z.preload(queries.assetBySymbol(row.asset), { ttl: '5m' });
    navigate(`/assets/${encodeURIComponent(row.asset)}`);
  }}
>
```

**SuperinvestorsTable.tsx:**
```tsx
<a
  href={`/superinvestors/${row.cik}`}
  onMouseEnter={() => {
    z.preload(queries.superinvestorByCik(row.cik), { ttl: '5m' });
  }}
  onClick={(e) => {
    e.preventDefault();
    z.preload(queries.superinvestorByCik(row.cik), { ttl: '5m' });
    navigate(`/superinvestors/${encodeURIComponent(row.cik)}`);
  }}
>
```

Benefits:
- Data is preloaded on hover (instant navigation)
- Data is cached with 5-minute TTL
- On browser refresh, Zero quickly rehydrates from IndexedDB
- No visible flash because cached data is shown immediately

## Files Changed

- `src/pages/AssetDetail.tsx` - Improved loading state logic
- `src/pages/SuperinvestorDetail.tsx` - Improved loading state logic
- `src/pages/AssetsTable.tsx` - Added preload on hover/click
- `src/pages/SuperinvestorsTable.tsx` - Added preload on hover/click

## Testing

To verify the fix:
1. Navigate to an asset or superinvestor detail page
2. Click the browser refresh button
3. The page should render instantly without any "Loading..." flash
4. The data should appear immediately from IndexedDB cache

## Technical Details

This fix leverages Zero's local-first architecture:
- Zero persists query results in IndexedDB
- On app restart, Zero rehydrates from IndexedDB
- By checking `result.type` and showing cached data immediately, we avoid UI flashes
- Preloading ensures queries are registered and cached before navigation
- The 5-minute TTL keeps data fresh while allowing instant re-navigation

## References

- [Zero React Hooks Documentation](https://zero.rocicorp.dev/docs/react)
- [Zero Reading Data & Caching](https://zero.rocicorp.dev/docs/reading-data)
- [Zero Synced Queries](https://zero.rocicorp.dev/docs/synced-queries)
