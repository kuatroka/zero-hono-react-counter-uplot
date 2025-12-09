## Why

The current Zero-sync architecture requires running a dedicated zero-cache server alongside the API and UI processes, adding significant operational complexity for a solo developer. Based on analysis in `docs/TANSTACK_DB_VS_ZERO_EVALUATION.md`, TanStack DB provides equivalent UX (sub-ms queries, optimistic updates, local caching) without the zero-cache server infrastructure. This greenfield project is read-heavy analytics with minimal real-time collaboration needs, making TanStack DB's simpler architecture a better fit.

**UPDATE 2025-12-09**: Initial migration was incomplete. Collections were created but never instantiated or used. Components still use plain TanStack Query (`useQuery`) instead of TanStack DB (`useLiveQuery`), resulting in HTTP requests on every interaction instead of instant local queries. This update completes the migration by actually wiring up TanStack DB collections to components.

## What Changes

### Phase 1 (Completed)
- **BREAKING**: Remove `@rocicorp/zero` dependency and all Zero-related infrastructure ✅
- Remove zero-cache server process from development workflow (2 processes instead of 3) ✅
- Remove Zero schema generation (`zero/schema.ts`, `zero/schema.gen.ts`) ✅
- Remove Zero synced queries (`zero/queries.ts`) ✅
- Create TanStack DB collection factories in `src/collections/` ✅
- Create API endpoints for collections ✅
- **PRESERVE**: Existing DuckDB global search functionality remains unchanged ✅
- **PRESERVE**: Hono API endpoints continue to serve data via existing patterns ✅

### Phase 2 (Missing - To Be Completed)
- **Instantiate collections**: Call factory functions to create collection instances
- **Replace `useQuery` with `useLiveQuery`**: Migrate all components from plain TanStack Query to TanStack DB
- **Wire up local queries**: Query local TanStack DB collections instead of making HTTP requests
- **Implement on-demand sync for drill-down**: First click loads from API, subsequent clicks query local collection (instant)
- **Preload collections on app init**: Load assets, superinvestors, and quarterly data upfront for instant queries
- **Remove "progressive" sync references**: TanStack DB only supports `eager` and `on-demand` modes

## Impact

- **Removed specs**:
  - `zero-synced-queries` — replaced by TanStack DB collections
  - `zero-custom-mutators` — simplified to direct API mutations

- **Added specs**:
  - `tanstack-db-collections` — collection definitions with sync modes
  - `tanstack-db-live-queries` — reactive local queries

- **Preserved specs/changes** (no modification):
  - `add-duckdb-global-search` — DuckDB search continues to function independently

- **Affected code**:
  - `src/zero/` — directory removed entirely
  - `src/zero-client.ts` — removed
  - `src/zero-preload.ts` — removed
  - `src/collections/` — new directory for TanStack DB collections
  - `src/pages/AssetsTable.tsx` — migrate from `useQuery` (Zero) to `useLiveQuery` (TanStack DB)
  - `src/pages/AssetDetail.tsx` — migrate queries
  - `src/pages/SuperinvestorsTable.tsx` — migrate queries
  - `src/components/GlobalSearch.tsx` — migrate Zero-based search (DuckDB search unchanged)
  - `app/router.tsx` — remove Zero provider, use QueryClientProvider
  - `app/components/zero-init.tsx` — removed or simplified
  - `api/routes/zero/` — remove zero-specific routes
  - `package.json` — replace `@rocicorp/zero` with `@tanstack/db`
  - `dev` script in `package.json` — remove `dev:zero-cache` process
