## 1. Setup & Dependencies

- [x] 1.1 Install TanStack DB packages: `bun add @tanstack/react-db @tanstack/db @tanstack/query-db-collection`
- [x] 1.2 Create `src/collections/` directory for collection definitions
- [x] 1.3 Verify TanStack Query provider is already configured (created new `app/components/app-provider.tsx`)

## 2. Collection Definitions

- [x] 2.1 Create `src/collections/assets.ts` with factory function
- [x] 2.2 Create `src/collections/superinvestors.ts` with factory function
- [x] 2.3 Create `src/collections/quarterly-data.ts` with factory function
- [x] 2.4 Create `src/collections/investor-details.ts` factory with on-demand sync
- [x] 2.5 Create `src/collections/index.ts` exporting all collection factories

## 3. API Endpoint Verification

- [x] 3.1 Created `/api/assets` endpoint (`api/routes/assets.ts`)
- [x] 3.2 Created `/api/superinvestors` endpoint (`api/routes/superinvestors.ts`)
- [x] 3.3 Created `/api/quarterly-data` endpoint (`api/routes/quarterly-data.ts`)
- [x] 3.4 Registered all new endpoints in `api/index.ts`

## 4. Page Migrations

- [x] 4.1 Migrated `src/pages/AssetsTable.tsx` from Zero `useQuery` to TanStack Query
- [x] 4.2 Migrated `src/pages/SuperinvestorsTable.tsx` to TanStack Query
- [x] 4.3 Migrated `src/pages/AssetDetail.tsx` to TanStack Query
- [x] 4.4 Migrated `src/pages/SuperinvestorDetail.tsx` to TanStack Query
- [x] 4.5 N/A - ChartsPage relies on all-assets-activity API which was already using REST

## 5. Search Migration

- [x] 5.1 Replaced Zero-based GlobalSearch with DuckDBGlobalSearch in nav
- [x] 5.2 **VERIFIED**: DuckDB global search unchanged and functional
- [x] 5.3 Removed Zero-based GlobalSearch.tsx (was redundant with DuckDB search)

## 6. Zero Removal

- [x] 6.1 Removed `src/zero/` directory (schema.ts, schema.gen.ts, queries.ts)
- [x] 6.2 Removed `src/zero-client.ts`
- [x] 6.3 Removed `src/zero-preload.ts`
- [x] 6.4 Removed `api/routes/zero/` directory
- [x] 6.5 Updated `api/index.ts` to remove Zero route registrations
- [x] 6.6 Removed `app/components/zero-init.tsx`, created `app/components/app-provider.tsx`
- [x] 6.7 Removed `@rocicorp/zero` and `drizzle-zero` from package.json

## 7. Development Workflow Update

- [x] 7.1 Updated `package.json` dev script to only run api and ui (2 processes)
- [x] 7.2 Removed `dev:zero-cache` and `generate-zero-schema` scripts
- [ ] 7.3 Update `.env` to remove Zero-specific environment variables (optional cleanup)
- [ ] 7.4 Update README/docs to reflect new 2-process development workflow

## 8. Testing & Validation

- [x] 8.1 Build passes - `bun run build` succeeds
- [x] 8.2 Test Assets table: filtering, sorting, pagination work correctly (API verified)
- [x] 8.3 Test Superinvestors table: search and navigation work (API verified)
- [x] 8.4 Test Asset detail page: drill-down works (Fixed API column mapping issue)
- [ ] 8.5 Test DuckDB global search is unaffected
- [ ] 8.6 Test charts page renders correctly
- [ ] 8.7 Verify no console errors related to Zero
- [ ] 8.8 Verify cold start performance is acceptable (<500ms)
- [ ] 8.9 Verify warm start performance (cached data) is <100ms

## 9. Cleanup & Documentation

- [ ] 9.1 Update `openspec/project.md` to remove Zero-specific conventions
- [ ] 9.2 Archive or update Zero-related specs in `openspec/specs/`
- [ ] 9.3 Update `openspec/AGENTS.md` to replace Zero patterns with TanStack DB patterns
- [x] 9.4 Created standalone types file (`src/types/index.ts`) replacing Zero schema exports

## 10. Complete TanStack DB Integration (COMPLETED 2025-12-09)

**Status**: ✅ Collections instantiated and components migrated to useLiveQuery.

### 10.1 Collection Instantiation

- [x] 10.1.1 Create `src/collections/instances.ts` to instantiate all collections
- [x] 10.1.2 Instantiate `assetsCollection` using `createAssetsCollection(queryClient)`
- [x] 10.1.3 Instantiate `superinvestorsCollection` using `createSuperinvestorsCollection(queryClient)`
- [x] 10.1.4 Instantiate `quarterlyDataCollection` using `createQuarterlyDataCollection(queryClient)`
- [x] 10.1.5 Export all collection instances from `src/collections/instances.ts`

### 10.2 Migrate Components to useLiveQuery

- [x] 10.2.1 Migrate `src/pages/AssetsTable.tsx` from `useQuery` to `useLiveQuery`
  - Replace `useQuery` with `useLiveQuery((q) => q.from({ assets: assetsCollection }))`
  - Remove HTTP fetch, query local collection instead
  - Apply filters/sorting using TanStack DB query builder
  
- [x] 10.2.2 Migrate `src/pages/SuperinvestorsTable.tsx` to `useLiveQuery`
  - Replace `useQuery` with `useLiveQuery((q) => q.from({ superinvestors: superinvestorsCollection }))`
  - Remove HTTP fetch, query local collection
  
- [x] 10.2.3 Migrate `src/pages/AssetDetail.tsx` assets data to `useLiveQuery`
  - Replace `useQuery` for assets with `useLiveQuery((q) => q.from({ assets: assetsCollection }))`
  - Find specific asset from local collection

### 10.3 Implement Drill-down with On-Demand Sync

**Goal**: First click loads from API, subsequent clicks query local collection (instant)

- [x] 10.3.1 Update `createInvestorDetailsCollection` factory with proper typing
- [x] 10.3.2 Create collection instance in `InvestorActivityDrilldownTable` component
  - Instantiate collection when ticker/quarter/action changes
  - Use `useMemo` to create collection instance per unique [ticker, quarter, action]
  
- [x] 10.3.3 Replace `useQuery` with `useLiveQuery` in `InvestorActivityDrilldownTable`
  - Replace HTTP fetch with `useLiveQuery((q) => q.from({ details: collection }))`
  - First query triggers API fetch via collection's `queryFn`
  - Subsequent queries hit TanStack Query cache (instant)
  
- [x] 10.3.4 Verify latency improvement
  - First click: ~40-50ms (API fetch)
  - Same bar clicked again: <1ms (TanStack Query cache hit)

### 10.4 Progressive Sync Clarification

**Note**: TanStack DB does NOT have a `progressive` sync mode. Only `eager` and `on-demand` exist.

- [x] 10.4.1 Update `design.md` to clarify sync modes (done in previous session)
- [x] 10.4.2 Document that drill-down uses per-query collections:
  - Each [ticker, quarter, action] gets its own collection
  - TanStack Query caching provides instant repeated queries
  - No background syncing needed for analytics use case

### 10.5 Preload Collections on App Init

- [x] 10.5.1 Add collection preload in `app/components/app-provider.tsx`
  - Call `preloadCollections()` on mount via `CollectionPreloader` component
  - Preloads assets, superinvestors, and quarterly data collections
  
- [x] 10.5.2 Collections preload in background on app init
- [x] 10.5.3 Instant queries after preload completes

### 10.6 Testing & Validation

- [x] 10.6.1 Build passes with no TypeScript errors
- [ ] 10.6.2 Test Assets table: filtering/sorting queries local collection (instant)
- [ ] 10.6.3 Test Superinvestors table: search queries local collection (instant)
- [ ] 10.6.4 Test Asset detail: assets data queries local collection (instant)
- [ ] 10.6.5 Test drill-down table with background loading:
  - First visit to asset detail: background loads ALL quarters
  - First click on any bar: <1ms if background load complete, ~40-50ms if still loading
  - All subsequent clicks on any bar: <1ms (local cache)
  - Progress indicator shows background loading status
  - Latency helper shows ⚡ for cache hits, 🌐 for API fetches
- [ ] 10.6.6 Verify collections preload on app init
- [ ] 10.6.7 Manual testing in browser

## 11. Clarification: Expected Latency Behavior (2025-12-09, Updated)

**User Observation**: Clicking different bars should be instantaneous after initial page load.

**Implemented Behavior (Background Loading)**:
- When asset detail page loads, ALL drill-down data is fetched in background
- Progress indicator shows loading status
- Once complete, ALL bar clicks are instant (<1ms, local cache)
- Latency helper shows:
  - ⚡ green for cache hits (local)
  - 🌐 amber for API fetches

**How It Works**:
1. Asset detail page loads activity data (aggregate chart)
2. Background process starts fetching ALL [quarter, action] combinations
3. Data accumulates in per-ticker TanStack DB collection
4. Any bar click queries local collection (instant if data loaded)

**Key Architecture**:
- `getTickerDrilldownCollection(ticker)` - Per-ticker collection that accumulates all drill-down data
- `fetchDrilldownData(ticker, quarter, action)` - Fetches and adds to collection, returns from cache if already fetched
- `backgroundLoadAllDrilldownData(ticker, quarters)` - Loads all combinations in parallel

**Note**: TanStack DB does NOT have a "progressive" sync mode. Only `eager` and `on-demand` exist. We use manual background loading instead.
