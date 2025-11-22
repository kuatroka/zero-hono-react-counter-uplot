# Spec: Data Transfer System

## Overview

High-performance data transfer from SQLite to PostgreSQL using CSV intermediate format and PostgreSQL COPY command, with support for parallel processing of large tables.

## ADDED Requirements

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

## CSV Format Specification

### Standard Format
```csv
column1,column2,column3
value1,value2,value3
"quoted,value","another""quote",normal
\N,\N,null_values
```

### Special Cases
- **NULL values**: `\N` (PostgreSQL standard)
- **Quotes**: Double-quote escaping (`""`)
- **Newlines**: Preserve within quoted fields
- **Backslashes**: Escape as `\\`
- **Commas**: Quote field if contains comma
- **Empty strings**: `""` (different from NULL)

### Header Row
- Include column names in first row
- Use for validation (column order verification)
- Skip during COPY (use HEADER option)

## Sharding Strategy

### Shard Calculation

```typescript
function calculateShards(rowCount: number, targetShardSize: number = 1_000_000): number {
  if (rowCount < targetShardSize) return 1;
  const shards = Math.ceil(rowCount / targetShardSize);
  return Math.min(shards, 16); // Max 16 parallel shards
}
```

### Rowid Range Partitioning

```sql
-- Shard 1 of 4
SELECT * FROM table WHERE rowid >= 1 AND rowid < 25000000;

-- Shard 2 of 4
SELECT * FROM table WHERE rowid >= 25000000 AND rowid < 50000000;

-- Shard 3 of 4
SELECT * FROM table WHERE rowid >= 50000000 AND rowid < 75000000;

-- Shard 4 of 4
SELECT * FROM table WHERE rowid >= 75000000;
```

### Parallel Execution
- Use worker pool (default: 4 workers)
- Queue shards for processing
- Monitor progress across all workers
- Aggregate statistics on completion

## Performance Optimization

### CSV Export Tuning
- **Batch size**: 10,000 rows per write (configurable)
- **Buffer size**: 64KB write buffer
- **Compression**: Optional gzip for large files (trade CPU for disk I/O)
- **Streaming**: Don't load entire table into memory

### PostgreSQL COPY Tuning
- **Transaction size**: One transaction per table (not per shard)
- **Parallel workers**: 4-8 workers depending on CPU cores
- **Connection pooling**: Reuse connections across shards
- **Temporary tuning**: Disable WAL compression during COPY (re-enable after)

### Disk I/O Optimization
- **Staging location**: Use fast SSD for CSV files
- **Cleanup**: Delete CSV files immediately after successful COPY
- **Streaming**: Pipe CSV directly to COPY when possible (avoid disk)

## State Management

### State File Format (JSON)

```json
{
  "migration_id": "20250117_143022",
  "started_at": "2025-01-17T14:30:22Z",
  "completed_tables": [
    {
      "name": "periods",
      "rows": 107,
      "completed_at": "2025-01-17T14:30:25Z"
    }
  ],
  "in_progress": {
    "table": "holdings_overview",
    "total_shards": 8,
    "completed_shards": [1, 2, 3],
    "remaining_shards": [4, 5, 6, 7, 8]
  }
}
```

### State Operations
- **Create**: Initialize state file at migration start
- **Update**: Mark table/shard complete after successful COPY
- **Read**: Check state on resume to skip completed work
- **Clean**: Delete state file on successful migration completion
- **Rollback**: Reset state on validation failure

## Error Handling

### Recoverable Errors
- **Connection timeout**: Retry with exponential backoff
- **Disk full**: Pause, alert user, wait for space
- **Lock timeout**: Retry after delay

### Non-Recoverable Errors
- **Type mismatch**: Log error, fail migration
- **Constraint violation**: Log error, fail migration
- **Corrupt CSV**: Log error, fail migration

### Error Reporting
- **Context**: Table name, shard number, row number (if available)
- **Message**: Clear description of error
- **Remediation**: Suggested fix (e.g., "Increase disk space")
- **Logs**: Full stack trace in log file

## Validation Strategy

### Row Count Validation
```sql
-- SQLite
SELECT COUNT(*) FROM table;

-- PostgreSQL
SELECT COUNT(*) FROM public.table;

-- Compare and report
```

### Sample Data Validation
```sql
-- SQLite: Random 100 rows
SELECT * FROM table ORDER BY RANDOM() LIMIT 100;

-- PostgreSQL: Same rows by primary key
SELECT * FROM public.table WHERE id IN (...);

-- Compare field-by-field
```

### Type Validation
- Check for truncated strings (VARCHAR length)
- Check for numeric overflow
- Check for date/time format issues
- Check for encoding problems (UTF-8)

## Performance Targets

| Table Size | Export Time | Import Time | Total Time |
|------------|-------------|-------------|------------|
| 1K rows | <1s | <1s | <2s |
| 10K rows | <2s | <2s | <5s |
| 100K rows | <10s | <5s | <20s |
| 1M rows | <30s | <15s | <1min |
| 10M rows | <5min | <3min | <10min |
| 100M rows | <45min | <30min | <90min |

**Target throughput**: >50,000 rows/second for large tables
