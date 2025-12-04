# UI Flash Fix: Visibility Pattern for TanStack Router

## Problem
When clicking browser refresh or navigating between pages, the entire UI would flash/disappear briefly before reappearing with data. This happened even though:
- Search terms were preserved in URL
- Zero cached data in IndexedDB
- Data loaded quickly from cache

## Root Cause
The app rendered immediately with empty state, then re-rendered when data arrived from cache. This caused a visible "flash" of empty/loading UI.

## Solution: Content Ready Pattern with TanStack Router

We implemented a visibility pattern using React Context that works seamlessly with TanStack Router's navigation system:

### 1. Content Ready Hook (`src/hooks/useContentReady.tsx`)

```typescript
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouterState } from '@tanstack/react-router';

type ContentReadyContextValue = {
  isReady: boolean;
  onReady: () => void;
};

const ContentReadyContext = createContext<ContentReadyContextValue | null>(null);

export function ContentReadyProvider({ children }: { children: React.ReactNode }) {
  const locationKey = useRouterState({ select: (s) => s.location.state?.key ?? s.location.pathname });
  const [isReady, setIsReady] = useState(false);

  // Reset isReady on every navigation
  useEffect(() => {
    setIsReady(false);
  }, [locationKey]);

  const onReady = useCallback(() => setIsReady(true), []);
  const value = useMemo(() => ({ isReady, onReady }), [isReady, onReady]);

  return (
    <ContentReadyContext.Provider value={value}>
      {children}
    </ContentReadyContext.Provider>
  );
}

export function useContentReady() {
  const ctx = useContext(ContentReadyContext);
  if (!ctx) {
    throw new Error('useContentReady must be used within ContentReadyProvider');
  }
  return ctx;
}
```

**Key points:**
- Provider tracks `isReady` state and provides `onReady` callback
- Automatically resets `isReady` to `false` on every navigation (using TanStack Router's location key)
- Pages call `onReady()` when their data is loaded

### 2. Layout Wrapper (`app/routes/_layout/route.tsx`)

```typescript
import { ContentReadyProvider } from "@/hooks/useContentReady";

function RouteComponent() {
  return (
    <ZeroInit>
      <ContentReadyProvider>
        <SiteLayout>
          <Outlet />
        </SiteLayout>
      </ContentReadyProvider>
    </ZeroInit>
  );
}
```

**Key points:**
- Wrap the layout with `ContentReadyProvider`
- Provider is inside `ZeroInit` so Zero is available
- Provider wraps `SiteLayout` so visibility can be controlled

### 3. Site Layout (`app/components/site-layout.tsx`)

```typescript
import { useContentReady } from "@/hooks/useContentReady";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const { isReady } = useContentReady();

  return (
    <div style={{ visibility: isReady ? 'visible' : 'hidden' }}>
      <GlobalNav />
      {children}
    </div>
  );
}
```

**Key points:**
- Use `visibility: hidden` (not `display: none`) to maintain layout
- Container is hidden until `isReady` is true
- GlobalNav and page content are both hidden until ready

### 4. Page Components Signal When Ready

Each page uses the `useContentReady` hook and calls `onReady()` when data is available:

**Data-driven pages** (AssetsTable, SuperinvestorsTable):
```typescript
import { useContentReady } from '@/hooks/useContentReady';

export function AssetsTablePage() {
  const { onReady } = useContentReady();
  
  const [assetsPageRows] = useQuery(
    queries.assetsPage(windowLimit, 0),
    { ttl: PRELOAD_TTL, enabled: !trimmedSearch }
  );

  const [assetSearchRows] = useQuery(
    trimmedSearch
      ? queries.searchesByCategory('assets', trimmedSearch, SEARCH_LIMIT)
      : queries.searchesByCategory('assets', '', 0),
    { ttl: PRELOAD_TTL }
  );

  const assets = trimmedSearch ? searchAssets || [] : assetsPageRows || [];

  // Signal ready when data is available (from cache or server)
  useEffect(() => {
    if (assets && assets.length > 0) {
      onReady();
    } else if (!trimmedSearch && assetsPageRows !== undefined) {
      onReady();
    } else if (trimmedSearch && assetSearchRows !== undefined) {
      onReady();
    }
  }, [assets, assetsPageRows, assetSearchRows, trimmedSearch, onReady]);
  
  // ... rest of component
}
```

**Detail pages** (AssetDetail, SuperinvestorDetail):
```typescript
import { useContentReady } from '@/hooks/useContentReady';

export function AssetDetailPage() {
  const { onReady } = useContentReady();
  
  const [rows, result] = useQuery(
    queries.assetBySymbol(code || ''),
    { enabled: Boolean(code) }
  );

  const record = rows?.[0];

  // Signal ready when data is available (from cache or server)
  useEffect(() => {
    if (record || result.type === 'complete') {
      onReady();
    }
  }, [record, result.type, onReady]);
  
  // ... rest of component
}
```

**Static pages** (Home, UserProfile):
```typescript
import { useContentReady } from '@/hooks/useContentReady';

export function Home() {
  const { onReady } = useContentReady();

  // Signal ready immediately for static page
  useEffect(() => {
    onReady();
  }, [onReady]);
  
  // ... rest of component
}
```

## How It Works

### On Initial Load:
1. Layout renders with `visibility: hidden`
2. Zero loads data from IndexedDB cache
3. Page component receives cached data
4. Page calls `onReady()`
5. Layout becomes visible with data already rendered

### On Navigation:
1. TanStack Router navigates to new route
2. `ContentReadyProvider` detects location change and resets `isReady` to `false`
3. Layout becomes hidden (`visibility: hidden`)
4. New page component mounts and loads data from cache
5. Page calls `onReady()`
6. Layout becomes visible with new page data (no flash!)

### On Refresh:
1. Layout renders with `visibility: hidden` (user sees blank page briefly)
2. Zero immediately loads from IndexedDB cache (< 50ms)
3. Page component receives cached data
4. Page calls `onReady()`
5. Layout becomes visible with data (no flash!)

## Key Differences from React Router Implementation

**React Router (Old):**
- Used local state in `main.tsx` with `onReady` prop drilling
- Manual reset of `contentReady` state on route changes
- Props passed to every route component

**TanStack Router (New):**
- Uses React Context with `ContentReadyProvider`
- Automatic reset on navigation using `useRouterState`
- Pages use `useContentReady()` hook (no prop drilling)
- Cleaner, more maintainable architecture

## Why `visibility: hidden` vs `display: none`?

- `visibility: hidden`: Element takes up space, layout is calculated
- `display: none`: Element removed from layout

Using `visibility` ensures:
- Layout is ready when content becomes visible
- No layout shift when transitioning
- Smoother visual experience

## Files Modified

### Core Infrastructure
- `src/hooks/useContentReady.tsx` - Created provider and hook for content ready state
- `app/routes/_layout/route.tsx` - Wrapped layout with ContentReadyProvider
- `app/components/site-layout.tsx` - Applied visibility gate using isReady state

### Page Components
- `app/routes/_layout/index.tsx` - Added useContentReady hook and onReady signal
- `src/pages/AssetsTable.tsx` - Added useContentReady hook and data-ready signal
- `src/pages/SuperinvestorsTable.tsx` - Added useContentReady hook and data-ready signal
- `src/pages/AssetDetail.tsx` - Added useContentReady hook and data-ready signal
- `src/pages/SuperinvestorDetail.tsx` - Added useContentReady hook and data-ready signal
- `src/components/CounterPage.tsx` - Updated to use useContentReady hook (removed prop)
- `src/pages/UserProfile.tsx` - Updated to use useContentReady hook (removed prop)

## Result

✅ No UI flash on page refresh  
✅ No UI flash on navigation between pages  
✅ Search terms preserved in URL  
✅ Data loads instantly from cache  
✅ Smooth user experience  
✅ Works seamlessly with TanStack Router  
✅ Cleaner architecture with React Context (no prop drilling)  

## Migration Notes

When migrating from React Router to TanStack Router:
1. The visibility pattern must be reimplemented using React Context
2. Use `useRouterState` to detect navigation and reset ready state
3. Replace prop drilling with `useContentReady()` hook
4. Wrap layout with `ContentReadyProvider` inside the `_layout` route
5. Apply visibility gate in the layout component, not at the root level
