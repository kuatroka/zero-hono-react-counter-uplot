# UI Flash Fix - Final Implementation

## Problem Analysis

After comparing the working React Router implementation with the TanStack Router migration, I identified the root cause of the UI flash issue.

### Working React Router Implementation

**Key Characteristics:**
1. **State Location**: `contentReady` state managed at top level (`AppContent` component)
2. **No Reset**: Once `contentReady` becomes `true`, it NEVER resets
3. **Visibility Wrapper**: Applied at top level, wrapping both `<GlobalNav />` and `<Routes>`
4. **Single Call Pattern**: Each page uses `readyCalledRef` to call `onReady()` only once

```tsx
// Old React Router code (main.tsx)
function AppContent() {
  const [contentReady, setContentReady] = useState(false);
  const onReady = () => setContentReady(true);

  return (
    <BrowserRouter>
      <div style={{ visibility: contentReady ? 'visible' : 'hidden' }}>
        <GlobalNav />
        <Routes>
          <Route path="/" element={<LandingPage onReady={onReady} />} />
          {/* ... */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}
```

**Why It Works:**
- First page load: hidden → data loads from cache (< 50ms) → visible
- Subsequent navigations: **stays visible** (no reset, no flash!)
- Navigation is instant because data is already in Zero's IndexedDB cache

### Broken TanStack Router Implementation

**Initial Problems:**
1. **Context Reset**: `ContentReadyProvider` was resetting `isReady` on every navigation
2. **Wrong Location**: Provider was inside `_layout` route (could re-mount)
3. **Multiple Calls**: Pages were calling `onReady()` multiple times without ref guard

```tsx
// Broken implementation
export function ContentReadyProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // THIS WAS THE PROBLEM - Reset on every navigation!
  useEffect(() => {
    setIsReady(false);
  }, [pathname]);
  
  // ...
}
```

**Why It Failed:**
- Every navigation: `isReady` reset to `false` → layout hidden → data loads → layout visible
- **Result**: Flash on every page change!

## Solution

### 1. Move ContentReadyProvider to Root Level

**File**: `app/routes/__root.tsx`

```tsx
function RootComponent() {
  return (
    <RootDocument>
      <ContentReadyProvider>
        <Outlet />
      </ContentReadyProvider>
    </RootDocument>
  );
}
```

**Why**: Ensures the provider NEVER re-mounts during navigation. It's at the absolute top level, outside the route tree.

### 2. Remove Navigation Reset Logic

**File**: `src/hooks/useContentReady.tsx`

```tsx
export function ContentReadyProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  // Once ready, stay ready - cache loads are fast enough (< 50ms)
  const onReady = useCallback(() => setIsReady(true), []);

  const value = useMemo(() => ({ isReady, onReady }), [isReady, onReady]);

  return (
    <ContentReadyContext.Provider value={value}>
      {children}
    </ContentReadyContext.Provider>
  );
}
```

**Why**: Matches the React Router pattern - once visible, stays visible forever.

### 3. Add readyCalledRef to All Pages

**Pattern** (applied to all pages):

```tsx
export function SomePage() {
  const { onReady } = useContentReady();
  const [data, result] = useQuery(/* ... */);
  
  // Only call onReady once per page mount
  const readyCalledRef = useRef(false);
  useEffect(() => {
    if (readyCalledRef.current) return;
    
    if (data || result.type === 'complete') {
      readyCalledRef.current = true;
      onReady();
    }
  }, [data, result.type, onReady]);
  
  // ...
}
```

**Why**: Prevents multiple `onReady()` calls on re-renders, matching the React Router pattern.

### 4. Keep Visibility Wrapper in Layout

**File**: `app/components/site-layout.tsx`

```tsx
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

**Why**: Hides both navigation and content until first page loads data from cache.

## Files Modified

### Core Infrastructure
1. **`app/routes/__root.tsx`** - Moved ContentReadyProvider to root level
2. **`app/routes/_layout/route.tsx`** - Removed ContentReadyProvider (now in root)
3. **`src/hooks/useContentReady.tsx`** - Removed navigation reset logic
4. **`app/components/site-layout.tsx`** - Kept visibility wrapper (no changes needed)

### Pages (Added readyCalledRef Pattern)
5. **`src/pages/AssetsTable.tsx`** - Added ref guard
6. **`src/pages/SuperinvestorsTable.tsx`** - Added ref guard
7. **`src/pages/AssetDetail.tsx`** - Added ref guard
8. **`src/pages/SuperinvestorDetail.tsx`** - Added ref guard
9. **`app/routes/_layout/index.tsx`** - Already correct (simple page)
10. **`src/components/CounterPage.tsx`** - Already correct (simple page)
11. **`src/pages/UserProfile.tsx`** - Already correct (simple page)

## Expected Behavior

### First Page Load (e.g., localhost:3000)
1. App renders with `isReady = false` (hidden)
2. Home page mounts, `useEffect` runs
3. `onReady()` called → `isReady = true` (visible)
4. **Duration**: < 50ms (one React render cycle)

### Navigation to Data Page (e.g., /assets)
1. **Layout stays visible** (`isReady` still `true`)
2. AssetsTable mounts, queries Zero cache
3. Data loads from IndexedDB (< 50ms)
4. `onReady()` called (but layout already visible)
5. **No flash!**

### Subsequent Navigations
1. **Layout stays visible** (`isReady` never resets)
2. New page mounts, queries Zero cache
3. Data loads instantly from cache
4. **No flash!**

## Key Differences from React Router

| Aspect | React Router | TanStack Router |
|--------|--------------|-----------------|
| State Management | Props (`onReady` callback) | React Context |
| State Location | `AppContent` component | `__root.tsx` (outside route tree) |
| Reset Behavior | Never resets | Never resets (after fix) |
| Visibility Wrapper | Inline in `AppContent` | `SiteLayout` component |
| Page Pattern | `readyCalledRef` + `useEffect` | Same pattern |

## Why This Works

1. **Top-Level State**: Provider at root level ensures it never re-mounts
2. **No Reset**: Once `isReady` is `true`, it stays `true` forever
3. **Fast Cache**: Zero's IndexedDB cache loads in < 50ms
4. **Single Call**: `readyCalledRef` prevents multiple `onReady()` calls
5. **Instant Navigation**: Subsequent navigations are instant because layout stays visible

## Testing

1. **Fresh Load**: Go to `localhost:3000` → Should see brief flash, then content
2. **Navigate to /assets**: Should be instant, no flash
3. **Click asset row**: Should navigate instantly, no flash
4. **Use global search**: Should navigate instantly, no flash
5. **Refresh page (Cmd+R)**: Brief flash expected (app reloads), then instant

## Comparison with Old Codebase

The old codebase at `/Users/yo_macbook/Documents/dev/zero-hono-before-tanstack-migration` demonstrates the exact same pattern:

- State at top level (never resets)
- Visibility wrapper at top level
- `readyCalledRef` in all pages
- Fast cache loads (< 50ms)

The TanStack Router version now matches this pattern exactly, just using React Context instead of props.
