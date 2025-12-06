## Context

The application currently uses Zero-sync for global search, querying the `searches` table via Zero's reactive queries. Benchmarks show:
- DuckDB native: ~1ms queries
- pg_duckdb via HTTP: ~10ms queries
- Zero sync adds overhead for data that rarely changes

The `searches` table contains ~10,000 rows of reference data (superinvestors, assets, periods) that is updated infrequently (quarterly SEC filings).

## Goals / Non-Goals

**Goals:**
- Add a second, DuckDB-based global search path for side-by-side comparison
- Achieve sub-millisecond latency for the new DuckDB search
- Preserve the existing Zero-based global search and its UX (typeahead, code/name matching, ranking)

**Non-Goals:**
- Changing or removing the existing Zero-based global search
- Real-time search updates (data is batch-updated quarterly)
- Offline search support (requires network for DuckDB queries)
- Full-text search with stemming/fuzzy matching

## Decisions

### Decision 1: Use DuckDB native via `@duckdb/node-api`

**Why:** Benchmarks show ~10x faster than pg_duckdb via HTTP.

**Alternatives considered:**
- pg_duckdb via Hono API (~10ms) - Slower, adds Postgres overhead
- Zero sync (current) - Adds sync overhead, unnecessary for read-only data
- SQLite FTS5 - Would require separate database, more complexity

### Decision 2: Single DuckDB connection singleton

**Why:** DuckDB file locking requires single connection. Connection reuse avoids cold start overhead.

```typescript
// api/duckdb.ts
import { DuckDBInstance } from "@duckdb/node-api";

let instance: DuckDBInstance | null = null;
let connection: any = null;

export async function getDuckDBConnection() {
  if (!connection) {
    instance = await DuckDBInstance.create(process.env.DUCKDB_PATH!);
    connection = await instance.connect();
  }
  return connection;
}
```

### Decision 3: TanStack Query for client-side caching in the new search box

**Why:** Provides caching, deduplication, and stale-while-revalidate without Zero's sync overhead.

```typescript
// Client-side (new DuckDB-based search box)
const { data: results } = useQuery({
  queryKey: ['duckdb-search', query],
  queryFn: () => fetch(`/api/duckdb-search?q=${query}`).then(r => r.json()),
  staleTime: 5 * 60 * 1000, // 5 minutes
  enabled: query.length >= 2,
});
```

### Decision 4: Minimal debounce (50ms)

**Why:** 50ms is imperceptible to users but reduces request volume by ~80% during rapid typing. TanStack Query handles race conditions automatically, so we can use a very short debounce.

```typescript
const debouncedQuery = useDebounce(query, 50);
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| DuckDB file locking conflicts | Single connection singleton, read-only queries |
| No offline support | Acceptable - search requires network anyway |
| Cold start latency (~50ms) | Keep connection warm, acceptable for first query |
| TanStack Query bundle size | Already using React Query patterns elsewhere |

## Migration Plan

1. Add DuckDB connection singleton (`api/duckdb.ts`)
2. Create DuckDB search API endpoint (`api/routes/search-duckdb.ts`, exposed as `/api/duckdb-search`)
3. Add a new `DuckDBGlobalSearch` (name TBD) component that uses TanStack Query and calls `/api/duckdb-search`
4. Wire the new search box into the main navigation alongside the existing Zero-based global search
5. Test DuckDB search functionality and compare latency vs Zero-based search
6. Deploy and monitor usage and performance of both search paths

**Rollback:** Hide or remove the new DuckDB-based search box and endpoint; existing Zero-based search remains unchanged.

## Open Questions

- Should we add an index on `code` and `name` columns in DuckDB for faster ILIKE queries?
- Should we cache popular search results in memory on the server?
