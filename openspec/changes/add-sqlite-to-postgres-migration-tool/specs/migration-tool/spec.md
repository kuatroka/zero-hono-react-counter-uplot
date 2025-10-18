# Spec: Migration Tool Architecture

## Overview

A TypeScript-based CLI tool that orchestrates the migration of selected tables from SQLite to PostgreSQL, optimized for Zero-sync integration.

## ADDED Requirements

### Requirement: Command-Line Interface
The migration tool SHALL provide a command-line interface with configuration options, dry-run mode, help text, verbose logging, and proper exit codes.

#### Scenario: First-Time Migration
- **WHEN** user runs migration with full configuration on fresh PostgreSQL database
- **THEN** all configured tables are created and populated successfully

#### Scenario: Dry-Run Preview
- **WHEN** user runs migration with `--dry-run` flag
- **THEN** tool displays DDL and table selection without modifying database

#### Scenario: Configuration Error
- **WHEN** user runs migration with invalid YAML configuration
- **THEN** tool shows clear error message and exits before any database changes

### Requirement: Configuration-Driven Behavior
All migration behavior SHALL be configurable via YAML file including source path, target connection, table selection, batch sizes, parallelism, and table name mapping.

#### Scenario: Re-Run Migration (Data Refresh)
- **WHEN** user runs migration on PostgreSQL that already contains migrated tables
- **THEN** existing tables are truncated and reloaded with fresh data

### Requirement: Modular Architecture
The tool SHALL be composed of independent, testable modules for schema extraction, DDL generation, data export, data import, validation, and Zero schema generation.

#### Scenario: Interrupted Migration Recovery
- **WHEN** user re-runs migration after interruption mid-process
- **THEN** tool resumes from last completed table/shard without re-processing completed work

### Requirement: Progress Tracking
Long-running migrations SHALL display real-time progress bars, row count updates, ETA calculations, summary statistics, and write logs to file for debugging.

#### Scenario: Large Table Progress Display
- **WHEN** migration processes table with 100M+ rows
- **THEN** tool displays progress bar with current row count and estimated time remaining

### Requirement: Idempotency
Migration SHALL be safely re-runnable without manual cleanup using CREATE TABLE IF NOT EXISTS, table truncation with confirmation, temporary file cleanup, and state tracking.

#### Scenario: Connection Failure Recovery
- **WHEN** PostgreSQL is unreachable during migration
- **THEN** tool retries with exponential backoff, then fails gracefully with clear error message

## Technical Design

### Module Dependencies

```
migrate.ts (orchestrator)
  ├─> config.ts (load & validate)
  ├─> schema-extractor.ts (analyze SQLite)
  ├─> ddl-generator.ts (generate PostgreSQL DDL)
  ├─> data-exporter.ts (SQLite → CSV)
  ├─> data-loader.ts (CSV → PostgreSQL)
  ├─> validator.ts (verify migration)
  └─> zero-generator.ts (generate Zero schema)
```

### Data Flow

```
1. Load Configuration
   ↓
2. Extract SQLite Schema
   ↓
3. Generate PostgreSQL DDL
   ↓
4. Execute DDL (create tables)
   ↓
5. For each table:
   a. Export to CSV (with sharding if large)
   b. Load via COPY
   c. Validate row count
   ↓
6. Generate Zero Schema
   ↓
7. Report Summary
```

### Error Handling Strategy

- **Configuration errors**: Fail fast before any database operations
- **Connection errors**: Retry with exponential backoff (3 attempts)
- **Schema errors**: Rollback DDL and exit
- **Data errors**: Log problematic rows, continue with remaining data
- **Validation errors**: Report but don't rollback (allow manual inspection)

## Performance Targets

- **Small tables** (<10K rows): Complete in <5 seconds
- **Medium tables** (10K-1M rows): Complete in <2 minutes
- **Large tables** (>1M rows): Process at >50K rows/second
- **Overall migration**: Complete 6.7GB database in <2 hours

## Dependencies

- `better-sqlite3` - SQLite access
- `pg` - PostgreSQL client
- `yaml` - Configuration parsing
- `zod` - Schema validation
- `cli-progress` - Progress bars
- `chalk` - Colored terminal output
