# MVP Full Implementation - Quick Reference

## Overview

Comprehensive implementation of the full MVP including:
- **Phase 1:** Router migration (TanStack Router → React Router)
- **Phase 2:** Investors, Assets, Search, and Auth functionality

## Documents

- **[proposal.md](./proposal.md)** - Complete change proposal and rationale
- **[phase-1-router-migration.md](./phase-1-router-migration.md)** - Detailed Phase 1 implementation
- **[PHASE-2-SPEC.md](./PHASE-2-SPEC.md)** - Detailed Phase 2 specification (entities, search, list/detail pages)

## Quick Start

### Phase 1: Router Migration (Do First)
```bash
# 1. Install React Router
bun add react-router-dom
bun remove @tanstack/react-router @tanstack/router-devtools

# 2. Follow phase-1-router-migration.md
# 3. Test counter/charts still work
# 4. Commit changes
```

### Phase 2: Investors/Assets (After Phase 1 Complete)
```bash
# 1. Run data generation script
bun run scripts/generate-dummy-data.ts

# 2. Apply database migrations
# 3. Seed database
# 4. Follow phase-2-investors-assets.md
```

## Key Features

### Phase 1
- ✅ React Router v6 integration
- ✅ Preserve counter + charts functionality
- ✅ Simpler routing architecture
- ✅ Smaller bundle size

### Phase 2
- ✅ Unified entities table (investors + assets)
- ✅ Entities list page (50 rows visible, category filtering)
- ✅ Individual detail pages (dynamic routing)
- ✅ Global search (Zero-sync ILIKE queries)
- ✅ Entity preloading (500 most recent)
- ✅ 1000 dummy entities generated (500 investors + 500 assets)

## Tech Stack Changes

### Removed
- `@tanstack/react-router` (~30KB)
- `@tanstack/router-devtools`
- `@tanstack/react-query` (briefly added in Phase 2.1, then removed)

### Added
- `react-router-dom` v7.9.4 (~10KB)
- `uplot` v1.6.32 (charting library)

## Timeline

- **Phase 1:** 4-6 hours
- **Phase 2:** 16-24 hours
- **Total:** 20-30 hours

## Success Criteria

### Phase 1
- [ ] Counter increments/decrements work
- [ ] All 10 charts render correctly
- [ ] Navigation between home and counter works
- [ ] No console errors
- [ ] Bundle size reduced

### Phase 2
- [ ] Search finds investors/assets
- [ ] Search shows category badges
- [ ] Click result navigates to detail page
- [ ] List pages show 10 rows with pagination
- [ ] Aggregate metrics display correctly
- [ ] Auth protects routes
- [ ] Database seeded with dummy data

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                         │
├─────────────────────────────────────────────────────────────┤
│  React Router                                                │
│  ├─ / (Home - public)                                        │
│  ├─ /counter (Counter + Charts - public demo)               │
│  ├─ /login (Auth)                                            │
│  └─ Protected Routes (auth-gated)                            │
│      ├─ /dashboard                                           │
│      ├─ /investors (list)                                    │
│      ├─ /investors/:id (detail)                              │
│      ├─ /assets (list)                                       │
│      ├─ /assets/:id (detail)                                 │
│      └─ /profile                                             │
├─────────────────────────────────────────────────────────────┤
│  Zero-sync (Client-side data layer)                          │
│  ├─ IndexedDB cache                                          │
│  ├─ Real-time sync                                           │
│  └─ Client-side queries (search, filters)                    │
├─────────────────────────────────────────────────────────────┤
│  Hono API Server                                             │
│  ├─ /api/counter (REST)                                      │
│  ├─ /api/quarters (REST)                                     │
│  ├─ /api/login (Auth)                                        │
│  └─ Zero-sync endpoints                                      │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                         │
│  ├─ counters                                                 │
│  ├─ value_quarters                                           │
│  ├─ investors (new)                                          │
│  ├─ assets (new)                                             │
│  ├─ users                                                    │
│  └─ messages                                                 │
└─────────────────────────────────────────────────────────────┘
```

## Data Model

### Entities Table (Unified)
```typescript
{
  id: string (UUID)
  name: string
  category: 'investor' | 'asset'
  description: string (optional)
  value: number (optional)
  created_at: number (timestamp)
}
```

**Why a single table?**
- Simpler schema
- Easier to search across both types
- Unified API
- Less code duplication

## Search Implementation

Uses Zero-sync for instant client-side search (no REST API):

```typescript
// GlobalSearch.tsx
const searchQuery = debouncedQuery.length >= 2
  ? z.query.entities
      .where('name', 'ILIKE', `%${debouncedQuery}%`)
      .limit(5)
  : z.query.entities.limit(0);

const [results] = useQuery(searchQuery);
```

**Preloading for instant results:**

```typescript
// main.tsx
z.preload(
  z.query.entities
    .orderBy('created_at', 'desc')
    .limit(500)
);
```

**Benefits:**
- Instant search (<10ms) over preloaded data
- Case-insensitive substring matching
- No network requests for cached data
- Async server fallback for non-cached entities

## Notes

- **Phase 1 Complete:** ✅ React Router migration successful
- **Phase 2 Complete:** ✅ Entities, search, list/detail pages working
- Counter/charts use REST API (not Zero-sync) - intentional for demo purposes
- Search uses Zero-sync ILIKE queries with preloading
- Single unified entities table (not separate investors/assets tables)
- Future: Auth-gated routes, SSR for public pages, batch data imports

## References

- [ztunes repo](https://github.com/rocicorp/ztunes) - Search implementation pattern
- [Zero documentation](https://zero.rocicorp.dev) - Zero-sync queries
- [React Router v6](https://reactrouter.com) - Routing documentation
