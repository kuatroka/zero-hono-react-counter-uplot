## Context

The web app uses DuckDB for analytics queries (15K superinvestors, 40K assets, quarterly data). A separate Dagster ETL pipeline rebuilds the DuckDB file periodically. DuckDB's file-level locking prevents concurrent access during ETL writes, causing 100% app unavailability during builds.

### Current Architecture
```
ETL (Python/Dagster)              Web App (Node/Hono)
       │                                  │
       ├─ Writes to ─────────────────────►├─ Reads from
       │  TR_05_DUCKDB_FILE.duckdb       │  TR_05_DUCKDB_FILE.duckdb
       │  (WRITE LOCK)                    │  (BLOCKED)
       │                                  │
```

### Proposed Architecture
```
ETL (Python/Dagster)              Manifest              Web App (Node/Hono)
       │                         db_manifest.json              │
       │                              │                        │
       ├─ Reads manifest ────────────►│◄───────── Reads ──────┤
       │  (active: "a")               │          manifest      │
       │                              │                        │
       ├─ Writes to ─────────►  _b.duckdb                     │
       │  (inactive)                                           │
       │                              │                        │
       ├─ Updates manifest ──────────►│         _a.duckdb ◄────┤
       │  (active: "b")               │         (active)       │
       │                              │                        │
       │                              │◄───── Detects change ──┤
       │                              │       switches to _b   │
```

## Goals / Non-Goals

**Goals:**
- 100% web app availability during ETL runs
- Zero data loss or corruption
- Atomic switchover (no partial state)
- Minimal changes to existing codebase
- Backwards compatible (fallback to single-file mode)

**Non-Goals:**
- Real-time data streaming (batch ETL is sufficient)
- Load balancing across databases
- Automatic failover between databases

## Decisions

### Decision: JSON Manifest File (vs Symlink)
**Choice**: JSON manifest file at `db_manifest.json`

**Alternatives Considered**:
1. **Symlink**: Atomic rename works on POSIX, but Windows compatibility issues
2. **Environment variable**: Requires app restart to switch
3. **Database table**: Chicken-and-egg problem for the database we're switching

**Rationale**: JSON manifest is portable, human-readable, and can include metadata (version, timestamps).

### Decision: Manifest Location
**Choice**: Same directory as DuckDB files (`TR_05_DB/db_manifest.json`)

**Rationale**: Keeps related files together, simplifies path resolution.

### Decision: Version-Based Change Detection
**Choice**: Manifest includes integer `version` that increments on each switch

**Rationale**:
- File mtime can be unreliable across filesystems
- Version number is unambiguous
- Enables frontend cache invalidation coordination

### Decision: Polling vs File Watching
**Choice**: Poll manifest on every connection request (read is cheap)

**Alternatives Considered**:
1. **fs.watch**: Unreliable on network filesystems, complex cleanup
2. **Periodic timer**: Adds delay between switch and detection

**Rationale**: Manifest read is <1ms, polling on connection request is simplest.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 2x disk space (6.2GB) | Acceptable for guaranteed availability |
| Manifest corruption | Fallback to DUCKDB_PATH env var |
| ETL crash mid-build | Inactive file corrupted, active untouched |
| Manifest read race | App reads version before switch, gets old data, detects on next request |

## Migration Plan

### Phase 1: App-Side (This Codebase)
1. Deploy manifest reader with fallback to env var
2. Update duckdb.ts to use manifest-based path
3. Add dbVersion to data-freshness API

### Phase 2: File Setup (Manual)
1. Copy current DB to `_a.duckdb` and `_b.duckdb`
2. Create initial `db_manifest.json`: `{"active": "a", "version": 1}`

### Phase 3: ETL-Side (Dagster Codebase)
1. Add manifest read/write utilities to `db_creation_utils.py`
2. Modify `concat_parquet_to_duckdb_no_md()` to use inactive path
3. Update `build_duckdb` asset to read manifest
4. Add manifest switch after successful build

### Rollback
1. Delete manifest file
2. App falls back to `DUCKDB_PATH` env var automatically
3. ETL continues writing to original path

## Open Questions

- None (design is straightforward)
