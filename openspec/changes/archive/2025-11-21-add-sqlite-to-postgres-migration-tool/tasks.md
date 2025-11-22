# Implementation Tasks

## Phase 1: Foundation & Configuration

- [ ] **T1.1** Create migration scripts directory structure
- [ ] **T1.2** Define YAML configuration schema with Zod validation
- [ ] **T1.3** Implement configuration loader with environment variable support
- [ ] **T1.4** Create example configuration file with documentation
- [ ] **T1.5** Add migration dependencies (better-sqlite3, pg, yaml parser)

## Phase 2: Schema Analysis & DDL Generation

- [ ] **T2.1** Implement SQLite schema extractor
  - Read table definitions from sqlite_master
  - Extract column names, types, nullability, defaults
  - Identify primary keys
  - Detect foreign key relationships (for Zero schema hints)

- [ ] **T2.2** Build type mapping system (SQLite → PostgreSQL)
  - INTEGER → BIGINT/INTEGER
  - TEXT → TEXT/VARCHAR
  - REAL → DOUBLE PRECISION
  - BLOB → BYTEA
  - Handle SQLite's dynamic typing edge cases

- [ ] **T2.3** Create DDL generator
  - Generate CREATE TABLE statements
  - Include primary keys only (no indexes)
  - Add IF NOT EXISTS for idempotency
  - Generate DROP TABLE statements for cleanup

- [ ] **T2.4** Implement dry-run mode
  - Preview DDL without executing
  - Show table selection and mapping

## Phase 3: Data Export & Transfer

- [ ] **T3.1** Implement CSV exporter from SQLite
  - Batch processing with configurable size
  - Handle NULL values correctly
  - Escape special characters (quotes, newlines)
  - Support compression (gzip) for large tables

- [ ] **T3.2** Build sharding logic for large tables
  - Calculate rowid ranges for parallel processing
  - Create shard configuration based on table size
  - Generate shard-specific CSV files

- [ ] **T3.3** Implement PostgreSQL COPY loader
  - Use COPY FROM STDIN for efficiency
  - Handle errors gracefully with partial rollback
  - Support parallel loading of shards
  - Progress tracking with row counts

- [ ] **T3.4** Add resumability support
  - Track completed tables/shards in state file
  - Skip already-migrated data on re-run
  - Clean resume on validation failure

## Phase 4: Zero Integration

- [ ] **T4.1** Generate Zero schema definitions
  - Create TypeScript schema builder code
  - Map PostgreSQL types to Zero types
  - Include table and column definitions

- [ ] **T4.2** Suggest relationship mappings
  - Analyze foreign key patterns
  - Generate .one() and .many() relationship code
  - Create commented templates for manual review

- [ ] **T4.3** Generate permission templates
  - Default to ANYONE_CAN read for financial data
  - Create commented examples for custom rules
  - Document permission patterns

- [ ] **T4.4** Create database migration files
  - Generate numbered migration SQL files
  - Include rollback statements
  - Add to docker/migrations/ directory

## Phase 5: Validation & Testing

- [ ] **T5.1** Implement row count validator
  - Compare SQLite vs PostgreSQL counts per table
  - Report discrepancies with details
  - Exit with error code on mismatch

- [ ] **T5.2** Add data type validation
  - Verify column types match expectations
  - Check for truncation or overflow
  - Validate NULL handling

- [ ] **T5.3** Create sample data comparator
  - Select random sample rows from both databases
  - Compare values field-by-field
  - Report differences with context

- [ ] **T5.4** Build end-to-end test
  - Use small test SQLite database
  - Run full migration pipeline
  - Verify Zero-sync queries work
  - Clean up test data

## Phase 6: Documentation & Polish

- [ ] **T6.1** Write migration guide (docs/migration.md)
  - Prerequisites and setup
  - Configuration examples
  - Common issues and troubleshooting
  - Performance tuning tips

- [ ] **T6.2** Add CLI help and usage examples
  - Command-line argument parsing
  - --help output with examples
  - --dry-run mode documentation

- [ ] **T6.3** Create progress reporting
  - Real-time progress bars for large tables
  - ETA calculations
  - Summary statistics on completion

- [ ] **T6.4** Add logging system
  - Structured logs with timestamps
  - Log levels (debug, info, warn, error)
  - Log file output for debugging

## Phase 7: Production Readiness

- [ ] **T7.1** Add error handling and recovery
  - Graceful handling of connection failures
  - Retry logic for transient errors
  - Clear error messages with remediation steps

- [ ] **T7.2** Implement cleanup utilities
  - Script to drop migrated tables
  - Clear CSV staging files
  - Reset migration state

- [ ] **T7.3** Performance optimization
  - Tune batch sizes based on table characteristics
  - Optimize parallel shard count
  - Add PostgreSQL tuning recommendations

- [ ] **T7.4** Security review
  - Ensure credentials not logged
  - Validate file paths to prevent injection
  - Review SQL generation for injection risks

## Acceptance Criteria

- ✅ Migration completes for all 10 tables from TR_05_SQLITE_FILE.db
- ✅ All 101M+ rows transferred successfully
- ✅ Row counts validated (100% match)
- ✅ Zero schema generated and compiles without errors
- ✅ Sample queries work via useQuery hook
- ✅ Migration completes in under 2 hours
- ✅ Process is repeatable (can re-run without manual cleanup)
- ✅ Documentation is complete and accurate
