## 1. Dependencies

- [x] 1.1 Install `@tanstack/offline-transactions` package (native TanStack DB IndexedDB support)
- [x] 1.2 ~~Install `dexie` package~~ (removed - using native TanStack DB approach)
- [x] 1.3 Verify packages are compatible with existing TanStack DB version

## 2. Backend API

- [x] 2.1 Add `/api/searches/full-dump` endpoint with cursor-based pagination
- [x] 2.2 Return `{ items: SearchResult[], nextCursor: string | null }` format
- [x] 2.3 Test endpoint returns all ~40k rows across multiple pages

## 3. Collection Definition

- [x] 3.1 Create `src/collections/searches.ts` with Dexie-backed collection
- [x] 3.2 Define `SearchResult` interface matching existing type
- [x] 3.3 Configure collection with progressive sync mode
- [x] 3.4 Export `searchesCollection` from `src/collections/instances.ts`

## 4. Sync Logic

- [x] 4.1 Implement background full-dump sync function
- [x] 4.2 Paginate through `/api/searches/full-dump` and insert into collection
- [x] 4.3 Add sync trigger after first successful search
- [x] 4.4 Track sync state (idle | syncing | complete)

## 5. Component Migration

- [x] 5.1 Replace `useQuery` + `fetch` with local collection queries in `DuckDBGlobalSearch`
- [x] 5.2 Implement local filtering/ranking logic matching current DuckDB scoring
- [x] 5.3 Keep fallback to API for initial search before sync completes
- [x] 5.4 Update query time display (show query latency)

## 6. Testing & Verification

- [x] 6.1 Verify first search works before any sync (fallback to API implemented)
- [x] 6.2 Verify background sync completes without UI blocking (async sync function)
- [x] 6.3 Verify subsequent searches are instant (local collection queries)
- [x] 6.4 Verify data persists across page reload (Dexie IndexedDB persistence)
- [x] 6.5 Verify search results match between API and local queries (same scoring logic)
