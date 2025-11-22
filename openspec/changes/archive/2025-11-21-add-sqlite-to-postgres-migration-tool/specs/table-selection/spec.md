# Spec: Table Selection System

## Overview

Configurable system to specify which SQLite tables to migrate, with support for filtering, renaming, and column selection.

## ADDED Requirements

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

## Configuration Schema

```yaml
tables:
  # Simple table (all columns, default settings)
  - name: periods
  
  # Table with rename
  - name: cik_md
    target_name: investors
  
  # Table with column selection
  - name: cusip_md
    target_name: assets
    columns:
      - cusip
      - name
      - description
      # Excludes other columns
  
  # Large table with tuning
  - name: holdings_overview
    batch_size: 100000
    parallel_shards: 8
    skip_validation: false
  
  # Table with custom type mapping
  - name: twrr_per_cik_per_qtr
    target_name: performance_metrics
    column_types:
      twrr: NUMERIC(10,4)  # Override default REAL → DOUBLE PRECISION

# Exclude tables
exclude_tables:
  - searches           # FTS5 not needed
  - sqlite_sequence    # SQLite internal
  - temp_*             # Temporary tables
```

## Validation Rules

### Table Name Validation
- Must exist in source SQLite database
- Target name must be valid PostgreSQL identifier
- Target name must not be reserved word (or must be quoted)
- No duplicate target names across configuration

### Column Name Validation
- All specified columns must exist in source table
- Column names must be valid PostgreSQL identifiers
- At least one column must be selected (no empty tables)

### Metadata Validation
- `batch_size` must be positive integer
- `parallel_shards` must be between 1 and 16
- Custom type mappings must be valid PostgreSQL types

## Default Behavior

### When No Configuration Provided
- Migrate all tables except system tables
- Use original table names
- Include all columns
- Use default batch size (10,000 rows)
- No parallel sharding (single-threaded)

### System Tables Auto-Excluded
- `sqlite_sequence`
- `sqlite_stat1`, `sqlite_stat2`, `sqlite_stat3`, `sqlite_stat4`
- Tables starting with `sqlite_`
- FTS5 shadow tables (e.g., `*_data`, `*_idx`, `*_content`, `*_docsize`, `*_config`)

## Performance Considerations

### Large Table Detection
- Automatically detect tables >1M rows
- Suggest parallel sharding in dry-run output
- Warn if large table has small batch size

### Column Selection Impact
- Fewer columns = faster CSV export
- Reduced disk space for staging
- Faster COPY import to PostgreSQL
