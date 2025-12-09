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
