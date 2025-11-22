# Tasks: Add Data Table Routes

## Phase 1: Foundation (Schema & Components)

### 1.1 Add shadcn/ui Table Components
**Estimated effort:** 15 minutes

Install required shadcn/ui components:
```bash
npx shadcn@latest add table
npx shadcn@latest add select
```

**Validation:**
- [x] `src/components/ui/table.tsx` exists
- [x] `src/components/ui/select.tsx` exists
- [x] Components compile without errors

**Dependencies:** None

---

### 1.2 Define Zero Schema for Assets and Superinvestors
**Estimated effort:** 30 minutes

Add table definitions to `src/schema.ts`:
- Define `assets` table with columns: id, asset, asset_name
- Define `superinvestors` table with columns: id, cik, cik_name, cik_ticker, active_periods
- Add TypeScript types for Asset and Superinvestor rows
- Configure permissions for read-only access (ANYONE_CAN select)
- Add tables to schema export

**Validation:**
- [x] Zero schema compiles without errors
- [x] TypeScript types exported: `Asset`, `Superinvestor`
- [x] Permissions configured for both tables
- [x] Tables added to schema.tables array

**Dependencies:** None

---

### 1.3 Create Reusable DataTable Component
**Estimated effort:** 2 hours

Create `src/components/DataTable.tsx` with:
- Generic TypeScript interface for column definitions
- Table header with sortable column headers
- Table body with row rendering
- Search input box (using shadcn/ui Input)
- Pagination controls (rows per page selector, page navigation)
- Sorting state management (column, direction)
- Pagination state management (page, pageSize)
- Filter/search state management
- Responsive layout (mobile, tablet, desktop)

**Features:**
- Click column header to sort (toggle asc/desc)
- Search box filters rows by matching any column
- Rows per page: 10, 20, 50, 100
- Page navigation: First, Previous, Next, Last
- Display "Showing X-Y of Z rows"
- Empty state when no results

**Validation:**
- [x] Component accepts generic column definitions
- [x] Sorting works (asc/desc toggle)
- [x] Search filters rows correctly
- [x] Pagination controls work
- [x] Responsive on mobile (320px), tablet (768px), desktop (1024px+)
- [x] TypeScript compiles without errors
- [x] Follows shadcn/ui Tasks example patterns

**Dependencies:** 1.1, 1.2

---

## Phase 2: Assets Page

### 2.1 Create AssetsTable Page Component
**Estimated effort:** 1 hour

Create `src/pages/AssetsTable.tsx`:
- Use Zero query to fetch assets: `z.query.assets.orderBy('asset', 'asc')`
- Define column configuration for DataTable:
  - ID column (sortable)
  - Asset column (sortable, searchable)
  - Asset Name column (sortable, searchable)
- Pass data and columns to DataTable component
- Add page header: "Assets"
- Add page description: "Browse and search all assets"
- Handle loading state
- Handle empty state

**Validation:**
- [x] Page renders without errors
- [x] Assets data loads from Zero
- [x] All columns display correctly
- [x] Sorting works on all columns
- [x] Search filters by asset or asset_name
- [x] Loading state shows while data loads
- [x] Empty state shows when no data

**Dependencies:** 1.3

---

### 2.2 Add Assets Route
**Estimated effort:** 15 minutes

Update `src/main.tsx`:
- Import AssetsTable component
- Add route: `<Route path="/assets" element={<AssetsTable />} />`
- Ensure route is within the router configuration

**Validation:**
- [x] Route compiles without errors
- [x] Navigating to `/assets` renders AssetsTable page
- [x] No console errors

**Dependencies:** 2.1

---

### 2.3 Add Assets Navigation Link
**Estimated effort:** 15 minutes

Update `src/components/GlobalNav.tsx`:
- Add "Assets" link to navigation bar
- Link to `/assets` route
- Use consistent styling with existing nav links
- Position between existing links (suggest after Counter, before User Profile)

**Validation:**
- [x] "Assets" link appears in navigation
- [x] Clicking link navigates to `/assets`
- [x] Active state highlights when on `/assets` page
- [x] Responsive on mobile (link doesn't overflow)

**Dependencies:** 2.2

---

## Phase 3: Superinvestors Page

### 3.1 Create SuperinvestorsTable Page Component
**Estimated effort:** 1 hour

Create `src/pages/SuperinvestorsTable.tsx`:
- Use Zero query to fetch superinvestors: `z.query.superinvestors.orderBy('cik_name', 'asc')`
- Define column configuration for DataTable:
  - ID column (sortable)
  - CIK column (sortable, searchable)
  - Name column (sortable, searchable)
  - Ticker column (sortable, searchable)
  - Active Periods column (sortable)
- Pass data and columns to DataTable component
- Add page header: "Superinvestors"
- Add page description: "Browse and search institutional investors (13F filers)"
- Handle loading state
- Handle empty state

**Validation:**
- [x] Page renders without errors
- [x] Superinvestors data loads from Zero
- [x] All columns display correctly
- [x] Sorting works on all columns
- [x] Search filters by cik, cik_name, or cik_ticker
- [x] Loading state shows while data loads
- [x] Empty state shows when no data

**Dependencies:** 1.3

---

### 3.2 Add Superinvestors Route
**Estimated effort:** 15 minutes

Update `src/main.tsx`:
- Import SuperinvestorsTable component
- Add route: `<Route path="/superinvestors" element={<SuperinvestorsTable />} />`
- Ensure route is within the router configuration

**Validation:**
- [x] Route compiles without errors
- [x] Navigating to `/superinvestors` renders SuperinvestorsTable page
- [x] No console errors

**Dependencies:** 3.1

---

### 3.3 Add Superinvestors Navigation Link
**Estimated effort:** 15 minutes

Update `src/components/GlobalNav.tsx`:
- Add "Superinvestors" link to navigation bar
- Link to `/superinvestors` route
- Use consistent styling with existing nav links
- Position after Assets link

**Validation:**
- [x] "Superinvestors" link appears in navigation
- [x] Clicking link navigates to `/superinvestors`
- [x] Active state highlights when on `/superinvestors` page
- [x] Responsive on mobile (link doesn't overflow)

**Dependencies:** 3.2

---

## Phase 4: Testing & Polish

### 4.1 Test Data Loading and Preloading
**Estimated effort:** 30 minutes

Test Zero-sync data loading:
- Verify data loads on first visit
- Test preloading strategy (if needed for large datasets)
- Verify search is instant (no network delay)
- Test with empty database (no data scenario)
- Test with large dataset (1000+ rows)

**Validation:**
- [x] Data loads correctly on first visit
- [x] Search is instant (< 100ms)
- [x] Pagination is instant (< 100ms)
- [x] Sorting is instant (< 100ms)
- [x] No unnecessary network requests
- [x] Empty state displays correctly
- [x] Large datasets perform well

**Dependencies:** 2.3, 3.3

---

### 4.2 Test Responsive Layout
**Estimated effort:** 30 minutes

Test on different screen sizes:
- Mobile (320px, 375px, 414px)
- Tablet (768px, 1024px)
- Desktop (1280px, 1920px)

**Validation:**
- [x] Table scrolls horizontally on mobile if needed
- [x] Search box is full width on mobile
- [x] Pagination controls stack properly on mobile
- [x] Navigation links don't overflow on mobile
- [x] All interactive elements are touch-friendly (44px min)
- [x] No horizontal scroll on any screen size (except table content)

**Dependencies:** 2.3, 3.3

---

### 4.3 Test Search and Filtering
**Estimated effort:** 30 minutes

Test search functionality:
- Search for exact matches
- Search for partial matches (substring)
- Search for case-insensitive matches
- Search with special characters
- Search with empty string (show all)
- Search with no results

**Validation:**
- [x] Exact matches work
- [x] Partial matches work (substring)
- [x] Case-insensitive search works
- [x] Special characters don't break search
- [x] Empty search shows all rows
- [x] No results shows empty state
- [x] Search is instant (< 100ms)

**Dependencies:** 2.3, 3.3

---

### 4.4 Test Sorting
**Estimated effort:** 30 minutes

Test sorting on all columns:
- Click column header to sort ascending
- Click again to sort descending
- Click third time to remove sort (optional)
- Test sorting on text columns
- Test sorting on numeric columns
- Test sorting with null/empty values

**Validation:**
- [x] Ascending sort works correctly
- [x] Descending sort works correctly
- [x] Sort indicator shows current sort direction
- [x] Sorting is instant (< 100ms)
- [x] Null/empty values sort consistently
- [x] Multiple clicks toggle sort direction

**Dependencies:** 2.3, 3.3

---

### 4.5 Test Pagination
**Estimated effort:** 30 minutes

Test pagination controls:
- Change rows per page (10, 20, 50, 100)
- Navigate to next page
- Navigate to previous page
- Navigate to first page
- Navigate to last page
- Test with fewer rows than page size
- Test with exactly page size rows
- Test with many pages (100+)

**Validation:**
- [x] Rows per page selector works
- [x] Next/Previous buttons work
- [x] First/Last buttons work
- [x] Page indicator shows correct page number
- [x] Buttons disable appropriately (first page, last page)
- [x] Pagination is instant (< 100ms)
- [x] "Showing X-Y of Z" displays correctly

**Dependencies:** 2.3, 3.3

---

## Summary

**Total estimated effort:** ~8-10 hours

**Parallelizable work:**
- Phase 2 (Assets) and Phase 3 (Superinvestors) can be done in parallel after Phase 1
- Testing tasks (4.1-4.5) can be done in parallel

**Critical path:**
1. Phase 1 (Foundation) → 2.5 hours
2. Phase 2 (Assets) OR Phase 3 (Superinvestors) → 1.5 hours each
3. Phase 4 (Testing) → 2.5 hours

**Deliverables:**
- 2 new routes: `/assets`, `/superinvestors`
- 3 new components: DataTable, AssetsTable, SuperinvestorsTable
- 2 new navigation links
- Zero schema definitions for 2 tables
- Comprehensive test coverage
