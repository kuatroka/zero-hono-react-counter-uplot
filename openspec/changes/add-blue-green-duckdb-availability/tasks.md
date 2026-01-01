## 1. App-Side Implementation (This Codebase) ✓ COMPLETE

### 1.1 Manifest Utilities
- [x] 1.1.1 Create `api/duckdb-manifest.ts` with manifest types and read function
- [x] 1.1.2 Implement `readManifest()` with JSON parsing and validation
- [x] 1.1.3 Implement `getActiveDuckDbPath()` returning full path to active database
- [x] 1.1.4 Implement `getInactiveDuckDbPath()` for ETL reference
- [x] 1.1.5 Add fallback to `DUCKDB_PATH` env var when manifest missing

### 1.2 Connection Manager Update
- [x] 1.2.1 Update `api/duckdb.ts` to import manifest utilities
- [x] 1.2.2 Replace hardcoded `DUCKDB_PATH` with `getActiveDuckDbPath()`
- [x] 1.2.3 Add manifest version tracking alongside file mtime
- [x] 1.2.4 Trigger reconnection when manifest version changes
- [x] 1.2.5 Add logging for manifest version detection

### 1.3 Data Freshness Enhancement
- [x] 1.3.1 Update `/api/data-freshness` to read manifest version
- [x] 1.3.2 Add `dbVersion` field to response JSON
- [x] 1.3.3 Handle manifest read errors gracefully (return null)

### 1.4 Testing
- [ ] 1.4.1 Test fallback when manifest missing (uses env var)
- [ ] 1.4.2 Test connection switch when manifest version changes
- [ ] 1.4.3 Test data-freshness includes dbVersion
- [ ] 1.4.4 Verify no regressions in existing queries

## 2. File Setup (Manual Steps)

- [ ] 2.1 Copy current `TR_05_DUCKDB_FILE.duckdb` to `TR_05_DUCKDB_FILE_a.duckdb`
- [ ] 2.2 Copy current `TR_05_DUCKDB_FILE.duckdb` to `TR_05_DUCKDB_FILE_b.duckdb`
- [ ] 2.3 Create `db_manifest.json` with initial content: `{"active":"a","version":1,"lastUpdated":"..."}`
- [ ] 2.4 Update `.env` to remove `DUCKDB_PATH` (or keep as fallback)

## 3. ETL-Side Implementation (Dagster Codebase) ✓ COMPLETE

### 3.1 Python Manifest Utilities in `db_creation_utils.py`
- [x] 3.1.1 Add manifest read/write functions to `db_creation_utils.py`
- [x] 3.1.2 Implement `read_db_manifest()` returning dict with active/version
- [x] 3.1.3 Implement `get_inactive_db_path()` based on manifest
- [x] 3.1.4 Implement `switch_active_db()` for atomic manifest update

### 3.2 ETL Pipeline Update in `dbs.py`
- [x] 3.2.1 Modify `build_duckdb` asset to use blue-green pattern
- [x] 3.2.2 Call manifest utilities to get inactive path
- [x] 3.2.3 Switch manifest after successful build completion
- [x] 3.2.4 Update `update_webapp_duckdb` to skip copy when same directory

### 3.3 ETL Testing
- [ ] 3.3.1 Test manifest read during ETL
- [ ] 3.3.2 Test build writes to inactive database
- [ ] 3.3.3 Test atomic manifest switch
- [ ] 3.3.4 Test web app detects switch and reconnects

## 4. Documentation

- [ ] 4.1 Add Blue-Green explanation to project README or docs
- [ ] 4.2 Document manifest file format
- [ ] 4.3 Document rollback procedure
