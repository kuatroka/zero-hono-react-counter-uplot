## Why

DuckDB uses file-level locking that blocks all connections (including READ_ONLY) when the ETL pipeline holds a write lock. During the ~10+ minute ETL build process, the web app becomes completely inaccessible, showing blank pages and lock errors.

## What Changes

- **Blue-Green Database Pattern**: Maintain two DuckDB files (`_a.duckdb` and `_b.duckdb`) with a manifest tracking which is active
- **App-Side**: Read manifest to determine active database, auto-switch when manifest version changes
- **ETL-Side**: Write to inactive database, atomically switch manifest after completion
- **Data Freshness Enhancement**: Include manifest version in `/api/data-freshness` response

## Impact

- Affected specs: `data-freshness` (MODIFIED to include dbVersion)
- Affected code:
  - `api/duckdb.ts` - manifest-based path resolution
  - `api/duckdb-manifest.ts` - NEW manifest utilities
  - `api/routes/data-freshness.ts` - add dbVersion to response
  - External: `db_creation_utils.py` (Dagster ETL) - manifest read/write utilities
- Breaking: None (backwards compatible with fallback to env var)
