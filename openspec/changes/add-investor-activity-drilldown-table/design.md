## Context

The asset detail page currently shows investor activity charts (counts of superinvestors who opened/closed positions by quarter) based on aggregated data sourced from DuckDB/Parquet. However, there is no way to drill down into **which** superinvestors were involved in a given quarter for a given ticker.

We already have:
- Investor activity summary by ticker/quarter (charts).
- A Hono `drilldown` route reading directly from partitioned Parquet files via `pg_duckdb`.
- Existing tables and list pages for assets and superinvestors that establish a table look & feel.

This design adds an **interactive drilldown table** that listens to chart clicks and shows the matching superinvestors below the charts.

## Goals / Non-Goals

**Goals:**
- Add a table on the asset detail page that shows superinvestors who opened/closed positions for the current ticker and quarter.
- Drive the table selection by **chart clicks** (bar click → quarter + action → table filter).
- Default the table to **latest quarter, opened positions** when the page loads.
- Reuse existing table styling and UX from `/assets` and `/superinvestors`.

**Non-Goals:**
- Editing or mutating investor activity data (table is read-only).
- Building a full generic pivot/drilldown framework.
- Changing the underlying investor activity aggregation logic.

## High-Level Design

### Interaction Flow

1. User navigates to an asset detail page for ticker `T`.
2. Charts load investor activity summary series for ticker `T` by quarter.
3. **Default selection**:
   - Determine the latest quarter present in the series for `T`.
   - Set selection to `{ ticker: T, quarter: latest, action: "open" }`.
   - Load drilldown rows for that selection and render the table.
4. **Chart click**:
   - When the user clicks an **upper bar** (opened), emit `{ quarter, action: "open" }`.
   - When the user clicks a **lower bar** (closed), emit `{ quarter, action: "close" }`.
   - `AssetDetailPage` updates the selection and refreshes the table.

### Data Flow (DuckDB native via @duckdb/node-api)

The drilldown table SHALL use the same DuckDB-native pattern as the new DuckDB global search:

- Use `@duckdb/node-api` through the existing `api/duckdb.ts` singleton to connect to the DuckDB file.
- Add a dedicated Hono route (e.g. `GET /api/duckdb-investor-drilldown`) that:
  - Accepts `{ ticker, quarter, action }` as parameters.
  - Executes a DuckDB SQL query against the underlying detail data to return **superinvestor-level** rows.
- The React table uses TanStack Query to call this DuckDB-native endpoint, similar to how the DuckDB search box calls `/api/duckdb-search`.

There is **no Zero-synced drilldown table** in this change. Zero may be introduced later in a separate proposal if we want local-first behavior for drilldown, but this design treats DuckDB native as the single source of truth for investor-activity drilldown rows.

### UI Composition

- `AssetDetailPage` owns the selection state and passes it down:
  - `ticker` – from route params.
  - `selection = { quarter, action }` – from default logic or chart clicks.
- Charts receive a callback prop, e.g. `onBarClick({ quarter, action })`.
- New `InvestorActivityDrilldownTable` component:
  - Props: `{ ticker, quarter, action }`.
  - Uses TanStack Query to fetch rows from the chosen data source.
  - Renders a table styled like `/assets` and `/superinvestors` (columns: superinvestor name, CIK, quarter, action, etc.).

## Risks / Trade-offs

- **Data source divergence:** Drilldown table and charts must both reflect the same underlying data. Mitigation: ensure both are derived from the same DuckDB/Parquet pipeline.
- **Latency vs. complexity:** DuckDB/Hono path introduces network latency but avoids duplicating data into a Zero table. A future change can introduce Zero-backed drilldown if needed.
- **Click precision:** Chart libraries differ in how they expose click events; we must reliably map clicks to a specific `quarter` and `action`.
- **Layout shifts and scroll jumps:** When clicking chart bars to update linked tables, the page can jump or jitter if the table content is replaced during loading. See "Preventing Layout Shifts" section below for mitigation strategies.

## Migration Plan

1. Implement the selection state and chart click wiring (no backend changes yet).
2. Implement the drilldown data fetch using DuckDB/Hono (`api/drilldown`), returning superinvestor-level rows.
3. Build and integrate the `InvestorActivityDrilldownTable` component.
4. Verify default state and click behavior across multiple tickers.
5. Optionally introduce a Zero-backed drilldown query in a follow-up change if needed.

## Preventing Layout Shifts in Linked Chart/Table Interactions

When implementing linked charts and tables where clicking a chart updates a table below, **layout shifts** can cause poor UX:
- The page jumps up when the table content changes
- Scrollbars flicker or disappear momentarily
- Users lose their scroll position

### Root Cause

The issue occurs when:
1. User clicks a chart bar
2. Table component receives new props and triggers a data fetch
3. During loading, the table shows a short "Loading..." message
4. This replaces the full table (10+ rows), causing page height to collapse
5. The browser adjusts scroll position, creating a jarring jump

### Solution Pattern

Use these three techniques together to prevent layout shifts:

#### 1. Keep Previous Data Visible (React Query)

```tsx
const { data, isFetching } = useQuery({
  queryKey: ['drilldown', ticker, quarter, action],
  queryFn: () => fetchDrilldownData(ticker, quarter, action),
  placeholderData: (previousData) => previousData, // ← Key technique
});
```

The `placeholderData` option keeps the old data visible while fetching new data, preventing the component from unmounting.

#### 2. Maintain Minimum Height

```tsx
<div className="relative min-h-[360px]" aria-busy={isFetching}>
  {/* Table content */}
</div>
```

Set a `min-h-[XXXpx]` that matches your typical table height to prevent the container from collapsing during loading states.

#### 3. Loading Overlay Instead of Content Replacement

```tsx
{isFetching && hasRows && (
  <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
    <span className="text-sm text-muted-foreground">Refreshing data…</span>
  </div>
)}
```

Show a subtle overlay **on top of** existing content rather than replacing it. This maintains the DOM structure and prevents layout shifts.

### Benefits

- ✅ Scroll position remains stable
- ✅ No scrollbar flickering
- ✅ Better UX: users see previous data while new data loads
- ✅ Smooth, professional feel
- ✅ Accessible with proper `aria-busy` attributes

### When to Apply

Use this pattern whenever:
- A chart click updates a table or list below
- Multiple linked visualizations update each other
- Any interaction causes a data refetch that might change content height

### Example Implementation

See `src/components/InvestorActivityDrilldownTable.tsx` for a complete reference implementation.

## Open Questions

- Exact column list for the table.
- Whether we also want to support other actions (add, reduce, hold) as filters in the UI or keep the initial scope to open/close.
