# UI Flash Fix for TanStack Router - Implementation Summary

## Problem
After migrating from React Router to TanStack Router, the app experienced full UI flash/reload on:
- Page refresh (F5 or browser reload button)
- Navigation between pages (clicking links)

This happened even though Zero cached data in IndexedDB and loaded it quickly.

## Root Cause
The visibility pattern that prevented UI flash in the React Router version was not migrated to TanStack Router. The old implementation used:
- Local state in `main.tsx` with `onReady` prop drilling
- Manual visibility wrapper around `<BrowserRouter>`

This approach doesn't work with TanStack Router's architecture.

## Solution
Implemented a React Context-based visibility pattern that works seamlessly with TanStack Router:

### Architecture
```
__root.tsx
  └─ _layout/route.tsx
      └─ ZeroInit
          └─ ContentReadyProvider (NEW)
              └─ SiteLayout (visibility gate)
                  ├─ GlobalNav
                  └─ Outlet (page components)
```

### Key Components

#### 1. ContentReadyProvider (`src/hooks/useContentReady.tsx`)
- Tracks `isReady` state
- Provides `onReady()` callback
- **Automatically resets on navigation** using `useRouterState`
- No prop drilling needed

#### 2. SiteLayout (`app/components/site-layout.tsx`)
- Applies `visibility: hidden` until `isReady` is true
- Hides both GlobalNav and page content
- Uses `visibility` (not `display`) to maintain layout

#### 3. Page Components
Each page calls `onReady()` when data is loaded:
- **Data-driven pages**: Signal when query data is available
- **Static pages**: Signal immediately on mount

## Files Modified

### Core Infrastructure
- ✅ `src/hooks/useContentReady.tsx` - Created provider and hook
- ✅ `app/routes/_layout/route.tsx` - Wrapped with ContentReadyProvider
- ✅ `app/components/site-layout.tsx` - Applied visibility gate

### Page Components
- ✅ `src/pages/AssetsTable.tsx` - Added hook and signal
- ✅ `src/pages/SuperinvestorsTable.tsx` - Added hook and signal
- ✅ `src/pages/AssetDetail.tsx` - Added hook and signal
- ✅ `src/pages/SuperinvestorDetail.tsx` - Added hook and signal
- ✅ `src/components/CounterPage.tsx` - Updated to use hook (removed prop)
- ✅ `src/pages/UserProfile.tsx` - Updated to use hook (removed prop)

### Documentation
- ✅ `docs/UI-FLASH-FIX.md` - Updated with TanStack Router implementation

## How It Works

### On Page Refresh:
1. Layout renders with `visibility: hidden`
2. Zero loads data from IndexedDB cache (< 50ms)
3. Page component receives cached data
4. Page calls `onReady()`
5. Layout becomes visible with data (no flash!)

### On Navigation:
1. TanStack Router navigates to new route
2. `ContentReadyProvider` detects location change via `useRouterState`
3. Resets `isReady` to `false` → layout becomes hidden
4. New page component mounts and loads data from cache
5. Page calls `onReady()`
6. Layout becomes visible with new page data (no flash!)

## Benefits

✅ No UI flash on page refresh  
✅ No UI flash on navigation between pages  
✅ Works seamlessly with TanStack Router  
✅ Cleaner architecture (React Context, no prop drilling)  
✅ Automatic reset on navigation  
✅ Data loads instantly from Zero cache  
✅ Smooth user experience  

## Testing
To verify the fix works:
1. Navigate to `/assets` page
2. Wait for data to load
3. Press F5 (page refresh)
4. **Expected**: No flash, data appears immediately
5. Click on a different page (e.g., `/superinvestors`)
6. **Expected**: No flash during navigation

## Comparison: React Router vs TanStack Router

| Aspect | React Router (Old) | TanStack Router (New) |
|--------|-------------------|----------------------|
| State Management | Local state in `main.tsx` | React Context |
| Prop Passing | Manual prop drilling | `useContentReady()` hook |
| Navigation Reset | Manual | Automatic via `useRouterState` |
| Architecture | Centralized in one file | Distributed (provider + hook) |
| Maintainability | Medium | High |

## Migration Notes
When migrating from React Router to TanStack Router:
1. The visibility pattern must be reimplemented using React Context
2. Use `useRouterState` to detect navigation and reset ready state
3. Replace prop drilling with `useContentReady()` hook
4. Wrap layout with `ContentReadyProvider` inside the `_layout` route
5. Apply visibility gate in the layout component, not at the root level

## References
- Original issue: UI flash after TanStack Router migration
- Previous working version: commit `f700d8f` (React Router)
- Documentation: `docs/UI-FLASH-FIX.md`
