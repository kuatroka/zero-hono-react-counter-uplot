# Current State - Zero Hono React Counter uPlot

**Last Updated:** 2025-01-17  
**Status:** Phase 2.2 Complete ✅

---

## 🎯 What This App Does

A real-time analytics application demonstrating **Zero-sync** (Rocicorp's sync framework) with:
- **Entities Management:** 1000 investors and assets with instant search
- **Counter Demo:** Simple counter with 10 different uPlot chart visualizations
- **Real-time Sync:** Zero-sync keeps data synchronized across clients
- **Modern Stack:** React 19 + Bun + Hono + PostgreSQL

---

## 📊 Current Features

### 1. **Entities System** (Investors & Assets)
- **Single unified table:** `entities` with 1000 records (500 investors + 500 assets)
- **Global search:** Instant client-side search using Zero-sync ILIKE queries
- **List pages:** Paginated tables (50 rows visible) with category filtering
- **Detail pages:** Individual entity pages with full information
- **Preloading:** 500 most recent entities cached at startup for instant search

### 2. **Counter & Charts Demo**
- **Counter:** Simple increment/decrement with PostgreSQL persistence
- **10 uPlot Charts:** Different visualization types (bars, line, area, scatter, etc.)
- **Quarterly Data:** 107 quarters of sample data (1999Q1-2025Q4)

### 3. **Messages Demo** (Original Zero Example)
- **CRUD operations:** Create, read, update, delete messages
- **Relationships:** Messages linked to users and mediums
- **Filtering:** Filter by sender and text content
- **Real-time sync:** Multi-tab synchronization

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 19.2.0
- React Router 7.9.4 (migrated from TanStack Router in Phase 1)
- TypeScript 5.5.3
- Vite 5.4.1 (dev server on port 3003)
- @rocicorp/zero 0.24 (real-time sync)
- uPlot 1.6.32 (charting)
- DaisyUI 5.3.7 + Tailwind 4.1.14 (styling)

**Backend:**
- Hono 4.10.0 (edge runtime framework)
- Bun (JavaScript runtime, replaces Node.js)
- API server on port 4000
- jose (JWT signing and verification)

**Database & Sync:**
- PostgreSQL with Write-Ahead Logging (WAL)
- Zero Cache server (port 4848)
- Single `entities` table for investors and assets

**Development:**
- Podman/Docker for local PostgreSQL
- Concurrently for parallel dev processes
- ESLint 9.9.0 with flat config

### Data Model

```typescript
// entities table (unified investors + assets)
{
  id: string (UUID)
  name: string
  category: 'investor' | 'asset'
  description: string (optional)
  value: number (optional)
  created_at: number (timestamp)
}

// counters table
{
  id: string
  value: number
}

// value_quarters table
{
  id: string
  quarter: string
  value: number
}

// messages, users, mediums (original Zero demo)
```

### Search Implementation

**Zero-sync based (no REST API):**

```typescript
// GlobalSearch.tsx
const searchQuery = debouncedQuery.length >= 2
  ? z.query.entities
      .where('name', 'ILIKE', `%${debouncedQuery}%`)
      .limit(5)
  : z.query.entities.limit(0);

const [results] = useQuery(searchQuery);
```

**Preloading:**

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

---

## 📦 Bundle Size

- **Total:** 567KB (182KB gzipped)
- **React Router:** ~10KB (saved 20KB by removing TanStack Router)
- **Zero-sync:** Handles all data synchronization
- **uPlot:** Lightweight charting library

---

## 🚀 Development

### Quick Start

```bash
# Terminal 1: Start PostgreSQL
bun run dev:db-up

# Terminal 2: Start all services (API + UI + Zero Cache)
bun run dev
```

### Services

- **UI:** http://localhost:3003/
- **API:** http://localhost:4000/
- **Zero Cache:** http://localhost:4848/
- **PostgreSQL:** localhost:5432

### Routes

- `/` - Home (messages demo)
- `/counter` - Counter + 10 charts
- `/entities` - All entities (investors + assets)
- `/investors` - Investors only
- `/assets` - Assets only
- `/entities/:id` - Entity detail page
- `/profile` - User profile (placeholder)

---

## 📚 Implementation History

### Phase 1: Router Migration (Complete ✅)
**Duration:** 4-6 hours  
**Goal:** Migrate from TanStack Router to React Router

**Changes:**
- Removed `@tanstack/react-router` and `@tanstack/router-devtools`
- Added `react-router-dom` v7.9.4
- Refactored routing in `main.tsx`
- Updated all navigation links
- Reduced bundle size by 20KB

**Rationale:**
- TanStack Router's data loaders redundant with Zero-sync
- React Router is lighter and more battle-tested
- Simpler mental model (routing separate from data fetching)

### Phase 2.1: Full-Text Search Attempt (Rolled Back ❌)
**Duration:** 2 hours  
**Goal:** Implement PostgreSQL full-text search

**What Was Tried:**
- Added `pg_trgm` extension for fuzzy matching
- Created GIN indexes
- Created `search_entities()` function
- Added custom `/api/search` REST endpoint
- Added `@tanstack/react-query` dependency

**Why It Failed:**
- Bypassed Zero-sync entirely
- Added unnecessary complexity
- Broke entities table synchronization
- Went against Zero-sync architecture patterns

### Phase 2.2: Zero-Sync Search (Complete ✅)
**Duration:** 2 hours  
**Goal:** Implement search the Zero way

**Changes:**
- Removed custom REST API endpoint
- Removed PostgreSQL FTS extensions and indexes
- Removed `@tanstack/react-query` dependency
- Implemented Zero-sync ILIKE queries
- Added entity preloading (500 records)
- Saved 20KB bundle size

**Rationale:**
- Follows ztunes repo pattern
- Zero handles sync automatically
- Instant client-side search
- Simpler architecture

**Key Learning:**
> Don't fight the framework. Zero-sync is designed for client-side queries over synced data. Custom REST APIs bypass Zero's benefits.

---

## 🎓 Key Architectural Decisions

### 1. **Single Entities Table (Not Separate Tables)**
**Decision:** Use one `entities` table with `category` column  
**Rationale:**
- Simpler schema
- Easier to search across both types
- Unified API
- Less code duplication

### 2. **React Router (Not TanStack Router)**
**Decision:** Use React Router v7 for client-side routing  
**Rationale:**
- Lighter bundle (10KB vs 30KB)
- Data loaders redundant with Zero-sync
- More battle-tested at scale
- Simpler mental model

### 3. **Zero-Sync Search (Not PostgreSQL FTS)**
**Decision:** Use Zero's ILIKE queries with preloading  
**Rationale:**
- Follows Zero-sync architecture
- Instant client-side search
- No custom API endpoints needed
- Works for <100k records (per ztunes notes)

### 4. **Preload 500 Entities (Not All 1000)**
**Decision:** Preload 500 most recent entities at startup  
**Rationale:**
- Balance between instant search and startup time
- 146KB data size (negligible)
- Covers most common searches
- Async fallback for non-cached entities

### 5. **Order by created_at DESC (Not Popularity)**
**Decision:** Preload newest entities first  
**Rationale:**
- Simple to implement
- Reasonable assumption (recent = relevant)
- No popularity tracking yet
- Can add analytics later

---

## 📖 Documentation Structure

### Primary Documents
1. **README.md** - Setup, installation, development workflow
2. **CURRENT-STATE.md** (this file) - What the app does, architecture, decisions
3. **openspec/changes/mvp-full-implementation/PHASE-2-SPEC.md** - Detailed Phase 2 specification

### Historical Documents
Located in root directory (for reference):
- `PHASE-1-SUMMARY.md` - Phase 1 completion summary
- `PHASE-2.2-ZERO-SEARCH-FIX.md` - Phase 2.2 implementation details
- `SEARCH-FIX.md` - Search improvement documentation
- Other `PHASE-*.md` files - Implementation logs

### OpenSpec Documents
Located in `openspec/changes/mvp-full-implementation/`:
- `proposal.md` - Full MVP proposal
- `README.md` - Quick reference
- `phase-1-router-migration.md` - Phase 1 detailed guide
- `PHASE-2-SPEC.md` - Phase 2 specification

---

## ✅ Success Criteria (All Met)

### Phase 1
- [x] Counter increments/decrements work
- [x] All 10 charts render correctly
- [x] Navigation between home and counter works
- [x] No console errors
- [x] Bundle size reduced by 20KB

### Phase 2
- [x] 1000 entities in database (500 investors + 500 assets)
- [x] Search finds entities with 2+ characters
- [x] Case-insensitive substring matching works
- [x] Search shows category badges
- [x] Click result navigates to detail page
- [x] List pages show 50 rows with filtering
- [x] Detail pages display full entity information
- [x] Zero-sync keeps data in sync
- [x] No console errors
- [x] Build successful

---

## 🔮 Future Enhancements (Not Implemented)

### Phase 3 Ideas
- **Authentication:** Auth-gated routes (99% of app behind login)
- **Pagination:** Cursor-based pagination with `start()`
- **Advanced Search:** Search description field, value range filters
- **Charts & Analytics:** Aggregate metrics, trend charts
- **CRUD Operations:** Create/update/delete entities
- **Export:** CSV/JSON export functionality
- **Popularity Tracking:** Track search/view counts, preload popular entities
- **SSR:** Server-side rendering for 3-4 public pages (SEO)

---

## 🐛 Known Issues

None currently. All tests passing.

---

## 📞 References

- **Zero Documentation:** https://zero.rocicorp.dev
- **ZTunes Repo:** https://github.com/rocicorp/ztunes (search pattern reference)
- **React Router:** https://reactrouter.com
- **Hono:** https://hono.dev
- **uPlot:** https://github.com/leeoniya/uPlot

---

**For detailed implementation steps, see:**
- Phase 1: `openspec/changes/mvp-full-implementation/phase-1-router-migration.md`
- Phase 2: `openspec/changes/mvp-full-implementation/PHASE-2-SPEC.md`
