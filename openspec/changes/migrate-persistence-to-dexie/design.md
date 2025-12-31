## Context

The app uses TanStack Query + TanStack DB for data fetching with IndexedDB persistence for offline capability and performance. The current persistence layer (`idb-keyval`) has fundamental limitations around connection lifecycle management that prevent reliable cache invalidation when the backend DuckDB is updated.

**Stakeholders**: Frontend app, ETL pipeline (updates DuckDB twice daily)

**Constraints**:
- Must maintain TanStack Query architecture (not switching to Dexie as primary store)
- Must support twice-daily cache invalidation without page reload
- Must preserve existing API and collection patterns

## Goals / Non-Goals

**Goals:**
- Reliable cache invalidation when DuckDB data version changes
- Single database with proper connection lifecycle management
- No page reload required after cache invalidation
- Proper error handling with meaningful error messages
- Maintain existing TanStack Query/DB patterns

**Non-Goals:**
- Switching to Dexie as primary data store (keep TanStack Query)
- Adding reactive queries from Dexie (TanStack DB already provides this)
- Multi-user sync or collaboration features
- Offline-first write capabilities

## Decisions

### Decision 1: Dexie.js over alternatives

**Choice**: Use Dexie.js for IndexedDB persistence

**Alternatives considered**:
1. **Fix idb-keyval with lazy stores** - Would require significant refactoring of store creation, and idb-keyval still lacks error handling
2. **LiveStore** - Overkill for our use case (event-sourcing, sync engine). Our data is server-authoritative, not client-generated
3. **localForage** - Similar limitations to idb-keyval, no connection lifecycle management
4. **Raw IndexedDB** - Too low-level, error-prone

**Rationale**: Dexie provides:
- Proper connection lifecycle: `db.close()`, `db.delete()`, `db.open()`
- Schema versioning and migrations
- Better error handling with proper Promise rejections
- Fluent API for queries (useful for future features)
- Well-maintained, 15K+ GitHub stars, used in production

### Decision 2: Single database with multiple tables

**Choice**: One Dexie database `app-cache` with tables: `queryCache`, `searchIndex`, `cikQuarterly`

**Alternatives considered**:
1. **Keep separate databases** - More complex invalidation, same as current problem
2. **Single table with type field** - Less efficient queries, harder to manage

**Rationale**:
- `db.delete()` clears everything atomically
- Tables provide logical separation without connection management overhead
- Easier to reason about cache state

### Decision 3: Custom TanStack Query persister

**Choice**: Create `DexiePersister` implementing TanStack Query's persister interface

**Implementation approach**:
```typescript
// src/lib/dexie-persister.ts
export function createDexiePersister(db: AppCacheDB): Persister {
  return {
    persistClient: async (client) => {
      await db.queryCache.put({ key: 'client', data: client })
    },
    restoreClient: async () => {
      const record = await db.queryCache.get('client')
      return record?.data
    },
    removeClient: async () => {
      await db.queryCache.delete('client')
    }
  }
}
```

**Rationale**: TanStack Query's experimental persister API is designed for custom storage backends. This keeps our data fetching layer unchanged while fixing persistence.

### Decision 4: Invalidation without page reload

**Choice**: Close Dexie connection, delete database, reopen, then trigger collection reload

**Flow**:
```
1. checkDataFreshness() detects stale cache
2. db.close() - close all connections
3. db.delete() - delete database (no blocking now)
4. db = new Dexie('app-cache') - create fresh instance
5. db.open() - open fresh connection
6. preloadCollections() - refetch from API
```

**Rationale**: Dexie handles connection state properly. Closing before delete ensures no blocked operations. Fresh instance after delete gets clean connections.

## Database Schema

```typescript
// src/lib/dexie-db.ts
import Dexie, { Table } from 'dexie'

interface QueryCacheEntry {
  key: string
  data: unknown
  timestamp: number
}

interface SearchIndexEntry {
  key: string
  codeExact: Record<string, number[]>
  codePrefixes: Record<string, number[]>
  namePrefixes: Record<string, number[]>
  items: Record<string, unknown>
  metadata?: { totalItems: number; persistedAt?: number }
}

interface CikQuarterlyEntry {
  cik: string
  rows: Array<{
    id: string
    cik: string
    quarter: string
    quarterEndDate: string
    totalValue: number
    totalValuePrcChg: number | null
    numAssets: number
  }>
  persistedAt: number
}

export class AppCacheDB extends Dexie {
  queryCache!: Table<QueryCacheEntry, string>
  searchIndex!: Table<SearchIndexEntry, string>
  cikQuarterly!: Table<CikQuarterlyEntry, string>

  constructor() {
    super('app-cache')
    this.version(1).stores({
      queryCache: 'key',
      searchIndex: 'key',
      cikQuarterly: 'cik'
    })
  }
}

export const db = new AppCacheDB()
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Bundle size increase | Dexie is ~20KB minified+gzipped, acceptable for reliability gains |
| Migration complexity | One-time migration, clean cut-over (no data migration needed - cache is ephemeral) |
| Learning curve | Dexie API is intuitive, team ramp-up minimal |
| Breaking existing cache | Intentional - old idb-keyval data won't be read, forcing fresh API fetches |

## Migration Plan

1. **Add Dexie dependency**: `bun add dexie`
2. **Create Dexie database schema**: `src/lib/dexie-db.ts`
3. **Create Dexie persister**: `src/lib/dexie-persister.ts`
4. **Update query-client.ts**: Replace idb-keyval imports with Dexie
5. **Update cik-quarterly.ts**: Use Dexie table for persistence
6. **Update data-freshness.ts**:
   - Replace `clearAllIndexedDB()` with `db.delete()`
   - Remove `window.location.reload()`
   - Add `db.open()` after delete
7. **Remove idb-keyval**: `bun remove idb-keyval`
8. **Test invalidation flow**: Verify no page reload needed

**Rollback**: If issues arise, revert to idb-keyval (commits preserved). Cache data is ephemeral so no data loss concerns.

## Open Questions

1. **TTL enforcement**: Should Dexie tables enforce TTL at the database level, or keep it in the persister logic?
   - **Recommendation**: Keep in persister logic for consistency with TanStack Query's maxAge

2. **Concurrent tab handling**: If multiple tabs have the app open during invalidation, they'll all have stale connections.
   - **Recommendation**: Use `Dexie.on('versionchange')` to handle cross-tab invalidation (future enhancement)
