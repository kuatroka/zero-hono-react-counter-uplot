## Context

The app has ~40k searchable entities (12k superinvestors + 30k assets). Current implementation hits DuckDB via API on every search, adding 18-23ms latency per keystroke. Users expect instant typeahead. TanStack DB provides a local-first query model, and Dexie provides robust IndexedDB persistence.

**Constraints**:
- Must not regress existing search UX during migration.
- Must handle ~40k rows without blocking UI.
- IndexedDB persistence preferred so data survives reloads.

## Goals / Non-Goals

**Goals**:
- Instant global search after initial sync (~0ms local queries).
- Data persists across page reloads (IndexedDB).
- Progressive sync: first search works immediately via API, full dataset syncs in background.
- Clean integration with existing TanStack DB collection pattern.

**Non-Goals**:
- Real-time sync of search index changes (acceptable to be stale for minutes).
- Offline-first mutations (search is read-only).
- Replacing the existing DuckDB backend (DuckDB remains source of truth).

## Decisions

### Decision 1: Use Dexie via `tanstack-dexie-db-collection`

**Why**: Dexie is a mature, production-ready IndexedDB wrapper. The community adapter `tanstack-dexie-db-collection` integrates it with TanStack DB collections. This avoids writing custom IndexedDB logic.

**Alternatives considered**:
- **TanStack DB first-party localStorage adapter**: localStorage has 5-10MB limit; ~40k rows may exceed this.
- **TanStack DB first-party IndexedDB adapter**: Not yet mature; the Dexie adapter is better documented for this use case.
- **In-memory only**: Data lost on reload; user would re-sync every visit.

### Decision 2: Progressive sync mode

**Why**: 
- First search should work immediately (on-demand fetch from DuckDB).
- After first use, trigger background sync of full ~40k dataset.
- Subsequent searches resolve locally without API calls.

**Implementation**:
1. `searchesCollection` configured with Dexie adapter.
2. On first search, TanStack DB fetches from `/api/duckdb-search`.
3. After first successful result, kick off `/api/searches/full-dump` pagination in background.
4. Full dataset inserted into Dexie/IndexedDB.
5. Future queries resolve from local collection.

### Decision 3: Paginated full-dump endpoint

**Why**: Loading 40k rows in one request risks timeout/memory issues. Paginated endpoint with cursor returns ~1000 rows per page.

**Endpoint**: `GET /api/searches/full-dump?cursor=<id>&pageSize=1000`

**Response**:
```json
{
  "items": [...],
  "nextCursor": "12345" | null
}
```

### Decision 4: Keep existing `/api/duckdb-search` endpoint

**Why**: The on-demand search endpoint remains useful for:
- Initial search before full sync completes.
- Fallback if IndexedDB is unavailable.
- Existing functionality preserved.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Dexie adapter is community-maintained | It's well-documented and used; pin version; can migrate to first-party adapter later |
| 40k rows may take seconds to sync | Background sync doesn't block UI; show "syncing" indicator; sync only after first search |
| IndexedDB quota limits | ~40k rows ≈ 5-10MB; well within browser limits |
| Stale data | Acceptable for search index; can add TTL-based re-sync later |

## Migration Plan

1. **Add dependencies**: `dexie`, `tanstack-dexie-db-collection`.
2. **Create `searchesCollection`** with Dexie adapter.
3. **Add `/api/searches/full-dump` endpoint** with pagination.
4. **Update `DuckDBGlobalSearch`** to use `useLiveQuery`.
5. **Wire up background sync** after first successful search.
6. **Test**: Verify first search works, background sync completes, subsequent searches are instant.
7. **Rollback**: If issues, revert to current `useQuery` + `fetch` pattern.

## Open Questions

- Should we show a "syncing search index" indicator in the UI?
- Should we add a TTL to re-sync the search index periodically (e.g., every 24h)?
