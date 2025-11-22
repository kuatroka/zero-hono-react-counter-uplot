# Add Data Table Routes for Assets and Superinvestors

## Why

The application currently has `assets` and `superinvestors` tables in PostgreSQL (created in migration 07) but no UI to view or interact with this data. Users need dedicated pages to browse, search, sort, and paginate through these datasets. The shadcn/ui table component (as seen in the Tasks example) provides an excellent pattern for displaying tabular data with built-in filtering, sorting, and pagination capabilities.

This feature will:
- Provide visibility into the assets and superinvestors data
- Enable efficient searching and filtering using Zero-sync queries
- Follow established shadcn/ui design patterns for consistency
- Leverage local-first architecture for instant search and filtering

## What Changes

- **NEW**: Add `/assets` route with a data table page for browsing assets
- **NEW**: Add `/superinvestors` route with a data table page for browsing superinvestors
- **NEW**: Create reusable DataTable component based on shadcn/ui table patterns
- **NEW**: Add Zero schema definitions for `assets` and `superinvestors` tables
- **NEW**: Implement cursor-based sorting for table columns
- **NEW**: Implement pagination controls (rows per page, page navigation)
- **NEW**: Add search functionality using Zero-sync queries
- **NEW**: Add shadcn/ui Table component and related primitives
- Update navigation to include links to new routes
- Configure Zero permissions for read-only access to these tables

## Impact

### New Components
- `src/pages/AssetsTable.tsx` - Assets data table page
- `src/pages/SuperinvestorsTable.tsx` - Superinvestors data table page
- `src/components/DataTable.tsx` - Reusable data table component with sorting, pagination, search
- `src/components/ui/table.tsx` - shadcn/ui Table component
- `src/components/ui/pagination.tsx` - shadcn/ui Pagination component (if not already added)
- `src/components/ui/select.tsx` - shadcn/ui Select component for rows per page (if not already added)

### Affected Components
- `src/main.tsx` - Add new routes for `/assets` and `/superinvestors`
- `src/components/GlobalNav.tsx` - Add navigation links to new pages
- `src/schema.ts` - Add table definitions for `assets` and `superinvestors`

### Affected Configuration
- None (all dependencies already installed via shadcn/ui migration)

### Affected Specs
- New capability: `data-tables` - Defines data table UI patterns and requirements
- Modified: `zero-synced-queries` - Add query patterns for assets and superinvestors

### User-Visible Changes
- New "Assets" navigation link in the header
- New "Superinvestors" navigation link in the header
- New `/assets` page with searchable, sortable, paginated table of assets
- New `/superinvestors` page with searchable, sortable, paginated table of superinvestors
- Instant search and filtering using local-first Zero-sync queries
- Responsive table layout that works on mobile, tablet, and desktop

### Technical Approach
1. **Zero-Sync First**: All data queries use Zero's query builder (no REST endpoints)
2. **Local-First**: Data preloaded to IndexedDB for instant queries
3. **Cursor-Based Sorting**: Use Zero's `.orderBy()` for efficient sorting
4. **Client-Side Pagination**: Paginate locally cached data for instant page changes
5. **ILIKE Search**: Use Zero's ILIKE operator for case-insensitive substring matching
6. **shadcn/ui Patterns**: Follow the Tasks example for table structure and interactions

### Data Schema

**Assets Table:**
- `id` (BIGINT) - Primary key
- `asset` (TEXT) - Asset identifier (e.g., ticker symbol)
- `asset_name` (TEXT) - Full asset name

**Superinvestors Table:**
- `id` (BIGINT) - Primary key
- `cik` (TEXT) - CIK number (SEC identifier)
- `cik_name` (TEXT) - Investor name
- `cik_ticker` (TEXT) - Ticker symbol (if applicable)
- `active_periods` (TEXT) - Periods when investor was active

### Migration Path
1. Add shadcn/ui Table component via CLI
2. Define Zero schema for assets and superinvestors tables
3. Create reusable DataTable component with sorting, pagination, search
4. Create AssetsTable page using DataTable component
5. Create SuperinvestorsTable page using DataTable component
6. Add routes to main.tsx
7. Add navigation links to GlobalNav
8. Test search, sorting, and pagination functionality
9. Verify responsive layout on mobile, tablet, desktop
