# table-selection Specification

## Purpose
TBD - created by archiving change add-sqlite-to-postgres-migration-tool. Update Purpose after archive.
## Requirements
### Requirement: Table Include/Exclude Patterns
Users SHALL be able to specify which tables to migrate using explicit lists, wildcard patterns, exclude lists, and automatic exclusion of SQLite system tables.

#### Scenario: Migrate All Tables
- **WHEN** configuration has no table list specified
- **THEN** all non-system tables are migrated with original names

#### Scenario: Selective Migration
- **WHEN** configuration lists 5 specific tables
- **THEN** only those 5 tables are migrated, others are skipped

#### Scenario: Exclude Pattern Matching
- **WHEN** configuration excludes `temp_*` pattern and SQLite has tables `temp_data`, `temp_cache`
- **THEN** both tables are skipped during migration

### Requirement: Table Name Mapping
The tool SHALL support renaming tables during migration with validation for SQL injection and reserved words, preserving original names when no mapping is specified.

#### Scenario: Table Renaming
- **WHEN** configuration maps `cik_md` → `investors`
- **THEN** PostgreSQL table is created as `investors` with data from `cik_md`

#### Scenario: Reserved Word Collision
- **WHEN** configuration maps table to PostgreSQL reserved word `user`
- **THEN** tool warns and suggests alternative name (e.g., `users`)

### Requirement: Column Selection
Users SHALL be able to select a subset of columns from source tables with validation that column names exist, defaulting to all columns if not specified.

#### Scenario: Column Filtering
- **WHEN** configuration specifies 3 columns from 10-column table
- **THEN** PostgreSQL table has only 3 columns with corresponding data

#### Scenario: Invalid Table Name
- **WHEN** configuration references non-existent table `foo`
- **THEN** tool reports error and exits before any database changes

### Requirement: Per-Table Configuration
The tool SHALL allow per-table configuration overrides for batch size, parallel shard count, validation skipping, and custom type mappings.

#### Scenario: Large Table Tuning
- **WHEN** configuration sets `holdings_overview` with 8 parallel shards
- **THEN** table is split into 8 shards and processed in parallel

