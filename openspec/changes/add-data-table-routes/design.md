# Design: Data Table Routes

## Overview

This design document outlines the architecture and implementation approach for adding data table routes for Assets and Superinvestors. The solution follows the local-first architecture pattern using Zero-sync queries and implements the shadcn/ui table design patterns.

## Architecture Decisions

### 1. Local-First Data Access

**Decision:** Use Zero-sync queries exclusively for all data access.

**Rationale:**
- Consistent with project's local-first architecture
- Instant search and filtering (no network latency)
- Automatic data synchronization
- Reactive updates when data changes
- No need for custom REST endpoints

**Implementation:**
```typescript
// ✅ CORRECT: Zero-sync query
const [assets] = useQuery(z.query.assets.orderBy('asset', 'asc'));

// ❌ WRONG: REST API endpoint
const assets = await fetch('/api/assets').then(r => r.json());
```

**Trade-offs:**
- ✅ Instant queries after initial sync
- ✅ Works offline
- ✅ Automatic updates
- ⚠️ Initial sync time for large datasets
- ⚠️ Memory usage for cached data

**Mitigation:** Implement selective preloading if datasets are very large (>10,000 rows).

---

### 2. Client-Side Pagination vs Server-Side Pagination

**Decision:** Use client-side pagination for locally cached data.

**Rationale:**
- Data is already synced to local IndexedDB via Zero
- Instant page changes (no network requests)
- Simpler implementation (no cursor management)
- Consistent with local-first architecture
- Typical dataset sizes (hundreds to low thousands) fit in memory

**Implementation:**
```typescript
// Client-side pagination
const startIndex = (currentPage - 1) * pageSize;
const endIndex = startIndex + pageSize;
const paginatedData = filteredData.slice(startIndex, endIndex);
```

**Trade-offs:**
- ✅ Instant pagination
- ✅ Simple implementation
- ✅ No server load
- ⚠️ All data must fit in memory
- ⚠️ Initial sync time for large datasets

**When to reconsider:** If datasets exceed 50,000 rows, consider server-side pagination with cursor-based queries.

---

### 3. Sorting Strategy

**Decision:** Use Zero's `.orderBy()` for initial sort, client-side sorting for UI interactions.

**Rationale:**
- Zero's `.orderBy()` provides efficient database-level sorting
- Client-side sorting is instant for cached data
- Allows multiple sort columns without complex queries
- Simpler state management

**Implementation:**
```typescript
// Initial sort via Zero query
const [assets] = useQuery(
  z.query.assets.orderBy('asset', 'asc')
);

// Client-side sort for UI interactions
const sortedData = [...assets].sort((a, b) => {
  if (sortColumn === 'asset') {
    return sortDirection === 'asc' 
      ? a.asset.localeCompare(b.asset)
      : b.asset.localeCompare(a.asset);
  }
  // ... other columns
});
```

**Trade-offs:**
- ✅ Instant sort changes
- ✅ Flexible multi-column sorting
- ✅ Simple implementation
- ⚠️ Sorting happens in JavaScript (not database)

---

### 4. Search Implementation

**Decision:** Use Zero's ILIKE operator for case-insensitive substring matching.

**Rationale:**
- Consistent with existing search implementation (CikSearch, GlobalSearch)
- Case-insensitive by default
- Supports substring matching
- Efficient database-level filtering

**Implementation:**
```typescript
// Search across multiple columns
const [results] = useQuery(
  z.query.assets
    .where('asset', 'ILIKE', `%${searchQuery}%`)
    .or('asset_name', 'ILIKE', `%${searchQuery}%`)
    .limit(100)
);
```

**Alternative considered:** Client-side filtering with JavaScript `.filter()`
- ✅ More flexible (can search across all columns easily)
- ⚠️ Less efficient for large datasets
- ⚠️ Doesn't leverage database indexes

**Decision:** Use ILIKE for now, can switch to client-side if needed for more complex search.

---

### 5. Component Architecture

**Decision:** Create a reusable generic DataTable component.

**Rationale:**
- DRY principle (don't repeat table logic)
- Consistent UX across Assets and Superinvestors pages
- Easier to maintain and test
- Follows shadcn/ui patterns (generic, composable components)

**Component Hierarchy:**
```
DataTable (generic, reusable)
├── Search Input (shadcn/ui Input)
├── Table (shadcn/ui Table)
│   ├── TableHeader
│   │   └── TableRow
│   │       └── TableHead (sortable)
│   └── TableBody
│       └── TableRow (for each data row)
│           └── TableCell
└── Pagination Controls
    ├── Rows Per Page Selector (shadcn/ui Select)
    └── Page Navigation Buttons
```

**Props Interface:**
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  defaultPageSize?: number;
  defaultSortColumn?: keyof T;
  defaultSortDirection?: 'asc' | 'desc';
}

interface ColumnDef<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  searchable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}
```

**Trade-offs:**
- ✅ Reusable across multiple pages
- ✅ Type-safe with generics
- ✅ Easy to extend with new features
- ⚠️ More complex initial implementation
- ⚠️ May need customization for specific use cases

---

### 6. Responsive Design Strategy

**Decision:** Follow shadcn/ui Tasks example responsive patterns.

**Breakpoints:**
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (sm to lg)
- Desktop: > 1024px (lg+)

**Responsive Behaviors:**
- **Mobile:** 
  - Search box full width
  - Table scrolls horizontally if needed
  - Pagination controls stack vertically
  - Rows per page selector full width
- **Tablet:**
  - Search box constrained width
  - Table displays all columns
  - Pagination controls inline
- **Desktop:**
  - Full table layout
  - All controls inline

**Implementation:**
```typescript
// Search box
<Input 
  className="w-full sm:w-96" 
  placeholder="Search..." 
/>

// Pagination controls
<div className="flex flex-col sm:flex-row gap-4 items-center">
  <Select>...</Select>
  <div className="flex gap-2">
    <Button>Previous</Button>
    <Button>Next</Button>
  </div>
</div>
```

---

### 7. Performance Considerations

**Preloading Strategy:**
- Preload assets and superinvestors data on app initialization
- Use `z.preload()` to cache data in IndexedDB
- Limit initial preload to reasonable size (e.g., 1000 rows)

**Optimization Techniques:**
1. **Memoization:** Use `useMemo` for expensive computations (sorting, filtering)
2. **Debouncing:** Debounce search input to avoid excessive re-renders
3. **Virtualization:** Consider `@tanstack/react-virtual` if datasets exceed 1000 rows
4. **Lazy Loading:** Load table component only when route is accessed

**Performance Targets:**
- Search response: < 100ms
- Sort response: < 100ms
- Pagination response: < 50ms
- Initial page load: < 2s (including data sync)

---

## Data Flow

### Assets Page Flow

```
User navigates to /assets
    ↓
AssetsTable component mounts
    ↓
useQuery(z.query.assets) executes
    ↓
Zero checks local IndexedDB cache
    ↓
If cached: Return data instantly
If not cached: Sync from PostgreSQL
    ↓
Data passed to DataTable component
    ↓
DataTable renders table with data
    ↓
User interacts (search, sort, paginate)
    ↓
DataTable updates local state
    ↓
Table re-renders with filtered/sorted/paginated data
```

### Search Flow

```
User types in search box
    ↓
Debounced input handler (300ms)
    ↓
Update search state
    ↓
Filter data array with search query
    ↓
Reset pagination to page 1
    ↓
Re-render table with filtered results
```

### Sort Flow

```
User clicks column header
    ↓
Toggle sort direction (asc ↔ desc)
    ↓
Sort data array by column
    ↓
Re-render table with sorted results
```

### Pagination Flow

```
User clicks page navigation
    ↓
Update current page state
    ↓
Calculate slice indices (startIndex, endIndex)
    ↓
Slice data array
    ↓
Re-render table with paginated results
```

---

## Schema Design

### Zero Schema Definitions

```typescript
// src/schema.ts

const asset = table("assets")
  .columns({
    id: number(),
    asset: string(),
    assetName: string().from("asset_name"),
  })
  .primaryKey("id");

const superinvestor = table("superinvestors")
  .columns({
    id: number(),
    cik: string(),
    cikName: string().from("cik_name"),
    cikTicker: string().from("cik_ticker"),
    activePeriods: string().from("active_periods"),
  })
  .primaryKey("id");

// Add to schema
export const schema = createSchema({
  tables: [
    // ... existing tables
    asset,
    superinvestor,
  ],
  relationships: [
    // ... existing relationships
  ],
});

// Export types
export type Asset = Row<typeof schema.tables.assets>;
export type Superinvestor = Row<typeof schema.tables.superinvestors>;
```

### Permissions

```typescript
// Read-only access for both tables
export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  return {
    // ... existing permissions
    assets: {
      row: {
        select: ANYONE_CAN,
      },
    },
    superinvestors: {
      row: {
        select: ANYONE_CAN,
      },
    },
  };
});
```

---

## UI/UX Design

### Assets Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Navigation Bar                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Assets                                                 │
│  Browse and search all assets                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔍 Search assets...                             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ID ↑ │ Asset ↕ │ Asset Name ↕                   │   │
│  ├──────┼─────────┼────────────────────────────────┤   │
│  │ 1    │ AAPL    │ Apple Inc.                     │   │
│  │ 2    │ GOOGL   │ Alphabet Inc.                  │   │
│  │ 3    │ MSFT    │ Microsoft Corporation          │   │
│  │ ...  │ ...     │ ...                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Showing 1-20 of 1,234 rows                             │
│  Rows per page: [20 ▼]  [◀ First] [◀ Prev] [Next ▶] [Last ▶] │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Superinvestors Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Navigation Bar                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Superinvestors                                         │
│  Browse and search institutional investors (13F filers) │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔍 Search superinvestors...                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ID ↑ │ CIK │ Name ↕ │ Ticker │ Active Periods   │   │
│  ├──────┼─────┼────────┼────────┼──────────────────┤   │
│  │ 1    │ 001 │ Berkshire Hathaway │ BRK.A │ 2020Q1-2024Q4 │   │
│  │ 2    │ 002 │ Vanguard Group │ - │ 2019Q1-2024Q4 │   │
│  │ ...  │ ... │ ...    │ ...    │ ...              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Showing 1-20 of 567 rows                               │
│  Rows per page: [20 ▼]  [◀ First] [◀ Prev] [Next ▶] [Last ▶] │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Visual Design Tokens

Following shadcn/ui theme variables:

- **Background:** `bg-background`
- **Card:** `bg-card`
- **Border:** `border-border`
- **Text:** `text-foreground`
- **Muted Text:** `text-muted-foreground`
- **Table Header:** `bg-muted/50`
- **Table Row Hover:** `hover:bg-muted/50`
- **Button Primary:** `bg-primary text-primary-foreground`
- **Button Secondary:** `bg-secondary text-secondary-foreground`

---

## Testing Strategy

### Unit Tests (Optional)
- DataTable component rendering
- Sorting logic
- Pagination logic
- Search filtering logic

### Integration Tests
- Zero query execution
- Data loading and caching
- Route navigation
- Component interactions

### Manual Testing Checklist
- [ ] Assets page loads data
- [ ] Superinvestors page loads data
- [ ] Search filters results
- [ ] Sorting works on all columns
- [ ] Pagination controls work
- [ ] Responsive layout on mobile
- [ ] Responsive layout on tablet
- [ ] Responsive layout on desktop
- [ ] Empty state displays correctly
- [ ] Loading state displays correctly
- [ ] Navigation links work
- [ ] Active route highlights in nav

---

## Success Criteria

### Functional Requirements
✅ Users can view all assets in a table
✅ Users can view all superinvestors in a table
✅ Users can search assets by asset or asset_name
✅ Users can search superinvestors by cik, cik_name, or cik_ticker
✅ Users can sort by any column (ascending/descending)
✅ Users can paginate through results
✅ Users can change rows per page (10, 20, 50, 100)

### Performance Requirements
✅ Search response < 100ms
✅ Sort response < 100ms
✅ Pagination response < 50ms
✅ Initial page load < 2s

### UX Requirements
✅ Responsive on mobile, tablet, desktop
✅ Follows shadcn/ui design patterns
✅ Consistent with existing app styling
✅ Accessible (keyboard navigation, screen readers)
✅ Loading states for async operations
✅ Empty states when no data

### Technical Requirements
✅ Uses Zero-sync queries (no REST endpoints)
✅ Type-safe TypeScript implementation
✅ Reusable DataTable component
✅ No console errors or warnings
✅ Follows project conventions (code style, architecture)

---

## Future Enhancements

### Phase 2 (Not in Scope)
- **Column visibility toggle:** Allow users to show/hide columns
- **Export to CSV:** Download table data as CSV
- **Advanced filters:** Filter by multiple criteria (e.g., active_periods range)
- **Bulk actions:** Select multiple rows and perform actions
- **Row details:** Click row to view detailed information
- **Virtualization:** For very large datasets (>10,000 rows)

### Phase 3 (Not in Scope)
- **Real-time updates:** Show live updates when data changes
- **Collaborative features:** See what other users are viewing
- **Saved searches:** Save and recall search queries
- **Custom views:** Save column configurations and filters

---

## Risk Assessment

### High Risk
None identified.

### Medium Risk
1. **Large dataset performance:** If datasets exceed 10,000 rows, client-side pagination may be slow.
   - **Mitigation:** Implement virtualization or server-side pagination if needed.

2. **Search performance:** Searching across multiple columns with ILIKE may be slow for large datasets.
   - **Mitigation:** Add database indexes on searchable columns, or use client-side filtering.

### Low Risk
1. **Mobile UX:** Table may be difficult to use on small screens.
   - **Mitigation:** Implement horizontal scroll with sticky first column.

2. **Empty data:** If tables are empty, users may be confused.
   - **Mitigation:** Clear empty state messaging with instructions.

---

## Open Questions

1. **Data volume:** How many rows are expected in each table?
   - Assets: ~1,000-10,000 rows
   - Superinvestors: ~500-5,000 rows

2. **Update frequency:** How often does data change?
   - Assumption: Data is relatively static (updated daily or weekly)

3. **Preloading:** Should we preload all data on app start, or lazy load on route access?
   - Recommendation: Lazy load on route access to reduce initial bundle size

4. **Column customization:** Do users need to customize which columns are visible?
   - Recommendation: Not in initial scope, add in Phase 2 if needed

5. **Relationships:** Are there relationships between assets and superinvestors?
   - Assumption: No relationships in initial scope, may add later (e.g., holdings)

---

## References

- [shadcn/ui Tasks Example](https://ui.shadcn.com/examples/tasks)
- [shadcn/ui Table Component](https://ui.shadcn.com/docs/components/table)
- [Zero Query Documentation](https://github.com/rocicorp/zero)
- [Project OpenSpec: Zero-Sync Architecture Patterns](../../../openspec/AGENTS.md)
