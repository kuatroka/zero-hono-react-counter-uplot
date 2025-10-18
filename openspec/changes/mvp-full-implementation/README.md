# MVP Full Implementation - Quick Reference

## Overview

Comprehensive implementation of the full MVP including:
- **Phase 1:** Router migration (TanStack Router → React Router)
- **Phase 2:** Investors, Assets, Search, and Auth functionality

## Documents

- **[proposal.md](./proposal.md)** - Complete change proposal and rationale
- **[phase-1-router-migration.md](./phase-1-router-migration.md)** - Detailed Phase 1 implementation
- **[phase-2-investors-assets.md](./phase-2-investors-assets.md)** - Detailed Phase 2 implementation
- **[data-generation.md](./data-generation.md)** - Dummy data generation scripts
- **[database-schema.md](./database-schema.md)** - Complete database schema

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
- ✅ Investors list page (paginated, 10 rows)
- ✅ Assets list page (paginated, 10 rows)
- ✅ Individual detail pages (50k+ pages)
- ✅ Global search (Zero-sync powered)
- ✅ Aggregate metrics
- ✅ Auth-gated routes
- ✅ Dummy data generation

## Tech Stack Changes

### Removed
- `@tanstack/react-router` (~30KB)
- `@tanstack/router-devtools`

### Added
- `react-router-dom` (~10KB)
- `@faker-js/faker` (dev dependency for data generation)

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

### Investors Table
```typescript
{
  id: string (UUID)
  name: string
  category: 'investor'
  revenue: number
  founded_year: number
  employee_count: number
}
```

### Assets Table
```typescript
{
  id: string (UUID)
  name: string
  category: 'asset'
  value: number
  acquisition_date: string
  asset_type: string
}
```

## Search Implementation

Uses Zero-sync for instant client-side search:

```typescript
// Search both investors and assets
const investors = useQuery(
  z.query.investors
    .where('name', 'ILIKE', `%${query}%`)
    .limit(3)
);

const assets = useQuery(
  z.query.assets
    .where('name', 'ILIKE', `%${query}%`)
    .limit(2)
);
```

## Notes

- Phase 1 MUST be completed and verified before starting Phase 2
- Counter/charts currently use REST API, not Zero-sync (intentional)
- Search uses Zero-sync for instant results
- 99% of app will be auth-gated (subscription model)
- 3-4 public pages for SEO (home, blog, pricing)
- Data updates via batch imports (2-4x daily), not real-time streaming

## References

- [ztunes repo](https://github.com/rocicorp/ztunes) - Search implementation pattern
- [Zero documentation](https://zero.rocicorp.dev) - Zero-sync queries
- [React Router v6](https://reactrouter.com) - Routing documentation
