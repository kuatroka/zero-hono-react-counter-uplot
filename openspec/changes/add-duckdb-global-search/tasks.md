## 1. Backend Infrastructure

- [x] 1.1 Create DuckDB connection singleton (`api/duckdb.ts`)
- [x] 1.2 Add `DUCKDB_PATH` environment variable to `.env`
- [x] 1.3 Create DuckDB search API route (`api/routes/search-duckdb.ts`) exposed as `/api/duckdb-search`
- [x] 1.4 Register DuckDB search routes in `api/index.ts`

## 2. Search API Implementation

- [x] 2.1 Implement `GET /api/duckdb-search?q=<query>&limit=<n>` endpoint
- [x] 2.2 Support code-first matching (exact > starts with > contains)
- [x] 2.3 Support name matching with ILIKE
- [x] 2.4 Return ranked results with category, code, name, cusip fields
- [x] 2.5 Add query timing to response for monitoring

## 3. Second Search UI (DuckDB-based)

- [x] 3.1 Create new `DuckDBGlobalSearch` component using TanStack Query
- [x] 3.2 Add debounced search input (50ms)
- [x] 3.3 Maintain current ranking logic (code matches > name matches)
- [x] 3.4 Preserve keyboard navigation behavior
- [x] 3.5 Wire the new search box into the main navigation alongside the existing Zero-based global search
- [x] 3.6 Add TanStack Query provider (`QueryClientProvider`) in `app/components/zero-init.tsx`

## 4. Testing & Validation

- [ ] 4.1 Test DuckDB search with various queries (exact code, partial name, mixed case)
- [ ] 4.2 Verify DuckDB search latency is <5ms for typical queries
- [ ] 4.3 Test keyboard navigation (arrow keys, enter, escape)
- [ ] 4.4 Test result navigation to detail pages
- [ ] 4.5 Verify no regressions in existing Zero-based global search or other Zero-synced features
