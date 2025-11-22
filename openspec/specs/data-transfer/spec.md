# data-transfer Specification

## Purpose
TBD - created by archiving change add-sqlite-to-postgres-migration-tool. Update Purpose after archive.
## Requirements
### Requirement: CSV Export from SQLite
The tool SHALL export SQLite table data to CSV format with proper escaping (quotes, newlines, commas), NULL value handling (PostgreSQL \N format), UTF-8 encoding, configurable batch size, and progress tracking.

#### Scenario: Small Table Export
- **WHEN** table with 1,000 rows is exported
- **THEN** single CSV file is created in under 1 second

#### Scenario: NULL Value Handling
- **WHEN** SQLite table with NULL values is exported to CSV
- **THEN** NULLs are represented as `\N` in CSV

#### Scenario: Special Character Escaping
- **WHEN** text field contains `He said, "Hello"` and is exported to CSV
- **THEN** field is quoted and escaped as `"He said, ""Hello"""`

### Requirement: Parallel Sharding for Large Tables
The tool SHALL split large tables into shards for parallel processing using automatic shard calculation, rowid-based range partitioning, configurable shard count (1-16), independent CSV files per shard, and parallel COPY execution.

#### Scenario: Large Table Sharding
- **WHEN** table with 101M rows is exported with 8 shards configured
- **THEN** 8 CSV files are created, each containing approximately 12.6M rows

#### Scenario: Parallel COPY Execution
- **WHEN** 8 CSV shard files are ready and import runs with 4 workers
- **THEN** 4 shards load simultaneously while remaining 4 are queued

### Requirement: PostgreSQL COPY Bulk Loading
The tool SHALL bulk load CSV data using PostgreSQL COPY FROM STDIN for efficiency, streaming data without full file buffering, handling errors with partial rollback, using one transaction per table, and tracking progress with row counts.

#### Scenario: Data Type Overflow Error
- **WHEN** SQLite INTEGER value exceeds PostgreSQL INTEGER range and COPY executes
- **THEN** error is caught, logged, and migration fails gracefully with clear message

### Requirement: Migration Resumability
The tool SHALL support resuming interrupted migrations using state file tracking of completed tables/shards, skipping already-loaded data on re-run, validating existing data before skipping, and clean resume after validation failure.

#### Scenario: Interrupted Migration Resume
- **WHEN** migration stopped after 3 of 8 shards loaded and migration re-runs
- **THEN** first 3 shards are skipped and processing resumes from shard 4

### Requirement: Data Integrity Validation
The tool SHALL verify data integrity after transfer using row count comparison (SQLite vs PostgreSQL), sample data verification (random rows), type validation (no truncation/overflow), and detailed discrepancy reporting.

#### Scenario: Row Count Mismatch Detection
- **WHEN** SQLite has 1000 rows but PostgreSQL has 998 after COPY and validation runs
- **THEN** error is reported with table name and both row counts

