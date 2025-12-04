# Debug Preloading Performance

## Changes Made

### 1. Fixed Hydration Warning
- **File**: `app/routes/__root.tsx`
- **Change**: Added `suppressHydrationWarning` to `<body>` tag
- **Why**: Prevents React hydration mismatch warnings from browser extensions (like `cz-shortcut-listen="true"`)

### 2. Added Debug Logging
Added console.log statements to track preloading behavior:

#### AssetsTable (`src/pages/AssetsTable.tsx`)
- Logs when hovering over asset links
- Logs when clicking asset links
- Logs navigation URL

#### AssetDetail (`src/pages/AssetDetail.tsx`)
- Logs when component renders with params
- Logs query result type (unknown/complete/cached)
- Logs whether record was found
- Logs activity query result type and row count

#### GlobalSearch (`src/components/GlobalSearch.tsx`)
- Logs when preloading search results on hover

## How to Test

### 1. Test Assets Table Navigation
1. Go to `/assets`
2. Open browser console
3. Hover over an asset row
4. You should see: `[AssetsTable] Preloading on hover: AAPL <cusip>`
5. Click the asset
6. You should see:
   - `[AssetsTable] Preloading on click: AAPL <cusip>`
   - `[AssetsTable] Navigating to: /assets/AAPL/<cusip>`
   - `[AssetDetail] Rendering with code: AAPL cusip: <cusip>`
   - `[AssetDetail] Query result type: complete record: found` (if cached)
   - OR `[AssetDetail] Query result type: unknown record: not found` (if not cached)

### 2. Test Global Search Navigation
1. Type in global search (e.g., "AAPL")
2. Hover over a search result
3. You should see: `[GlobalSearch] Preloading result: assets AAPL <cusip>`
4. Click the result
5. Navigation should be instant if preloading worked

### 3. Check for Hydration Errors
- The hydration mismatch error should no longer appear in console
- If it still appears, it means there's another source of the mismatch

## Expected Behavior

### If Preloading Works:
- Console shows preload logs on hover
- `[AssetDetail] Query result type: complete` immediately on navigation
- Page renders instantly with data

### If Preloading Doesn't Work:
- Console shows preload logs on hover
- `[AssetDetail] Query result type: unknown` on navigation
- Page shows "Loading..." then renders after fetching data
- This indicates Zero's preload isn't caching the data

## Possible Issues

### 1. Zero Preload Not Caching
- **Symptom**: Logs show preload calls, but detail page still shows `type: unknown`
- **Cause**: Zero's TTL might not be working, or queries don't match
- **Solution**: Check if query parameters match exactly between preload and useQuery

### 2. Query Mismatch
- **Symptom**: Preload logs show different params than detail page
- **Cause**: URL encoding or parameter transformation
- **Solution**: Ensure exact same query is used in preload and useQuery

### 3. Navigation Too Fast
- **Symptom**: Navigation happens before preload completes
- **Cause**: User clicks before hover preload finishes
- **Solution**: Add small delay or preload on click before navigation

## Next Steps

Based on console logs, we can determine:
1. Is preloading being called? (Check for preload logs)
2. Is data being cached? (Check query result type on detail page)
3. Is there a query mismatch? (Compare params in logs)

Once we identify the issue, we can fix it accordingly.
