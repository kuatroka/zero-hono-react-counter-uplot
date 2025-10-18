# Change Proposal: SQLite to PostgreSQL Migration Tool

**Status:** Draft  
**Created:** 2025-01-17  
**Type:** Feature Addition

## Why

The project needs to import financial data (13F holdings, investor metadata, asset information) from a 6.7GB SQLite database into PostgreSQL for Zero-sync integration. Current challenges:

1. **No migration tooling** - Manual SQL scripts are error-prone and don't scale to 100M+ rows
2. **Selective import needed** - Not all SQLite tables are relevant; need configurable table selection
3. **Zero-first architecture** - Direct database indexes are unnecessary since Zero Cache handles all queries via local-first sync
4. **Large dataset** - 101M rows in holdings_overview requires performant bulk loading strategy
5. **Repeatable process** - Need scriptable, automated approach for future data refreshes

## What Changes

### New Migration Tool (`scripts/sqlite-to-postgres/`)

A configurable migration system that:

1. **Table Selection**
   - Configuration file to specify which SQLite tables to migrate
   - Support for table name mapping (SQLite → PostgreSQL)
   - Ability to exclude tables or columns

2. **Schema Transfer**
   - Automatic SQLite → PostgreSQL type mapping
   - DDL generation for CREATE TABLE statements
   - Primary key preservation (no foreign keys or indexes initially)
   - Column nullability and default values preserved

3. **Data Transfer**
   - CSV export from SQLite with configurable batch sizes
   - PostgreSQL COPY command for bulk loading
   - Parallel processing for large tables (shard by rowid ranges)
   - Progress tracking and resumability

4. **Zero Integration**
   - Generate Zero schema definitions from PostgreSQL tables
   - Suggest relationship mappings based on foreign key patterns
   - Template for permission rules

5. **Validation**
   - Row count verification (SQLite vs PostgreSQL)
   - Data type validation
   - Sample data comparison

### Configuration Format

```yaml
# config/migration.yml
source:
  path: /path/to/sqlite.db
  
target:
  connection: $ZERO_UPSTREAM_DB
  schema: public

tables:
  - name: cik_md
    target_name: investors
    columns:
      - cik
      - name
      - description
    
  - name: cusip_md
    target_name: assets
    
  - name: holdings_overview
    batch_size: 100000
    parallel_shards: 8

exclude_tables:
  - searches  # FTS5 not needed
  - sqlite_sequence
```

### Scripts Structure

```
scripts/sqlite-to-postgres/
├── migrate.ts              # Main orchestrator
├── config.ts               # Configuration loader
├── schema-extractor.ts     # SQLite schema analysis
├── ddl-generator.ts        # PostgreSQL DDL generation
├── data-exporter.ts        # CSV export from SQLite
├── data-loader.ts          # COPY to PostgreSQL
├── validator.ts            # Post-migration validation
└── zero-generator.ts       # Zero schema template generator
```

## Impact Assessment

### Benefits
- ✅ **Repeatable**: Script-based migration can be re-run for data refreshes
- ✅ **Configurable**: Select only needed tables, rename as needed
- ✅ **Performant**: Parallel CSV+COPY approach handles 100M+ rows efficiently
- ✅ **Zero-optimized**: No unnecessary indexes since Zero Cache handles queries
- ✅ **Validated**: Automatic verification ensures data integrity
- ✅ **Maintainable**: TypeScript implementation with clear separation of concerns

### Risks
- ⚠️ **Disk space**: Requires ~20GB for CSV staging (mitigated: user confirmed availability)
- ⚠️ **Type mapping edge cases**: Some SQLite types may need manual mapping (mitigated: validation step catches issues)
- ⚠️ **Long-running process**: 100M rows may take 30-60 minutes (mitigated: progress tracking and resumability)

### Affected Components
- **New**: Migration scripts and configuration
- **Modified**: PostgreSQL schema (new tables added)
- **Modified**: Zero schema (src/schema.ts) with new table definitions
- **Modified**: Database migrations (docker/migrations/)

## Success Criteria

1. ✅ Migration completes successfully for all configured tables
2. ✅ Row counts match between SQLite and PostgreSQL
3. ✅ Data types are correctly mapped
4. ✅ Zero schema generated and validated
5. ✅ Sample queries work via Zero-sync (useQuery)
6. ✅ Migration can be re-run without manual cleanup
7. ✅ Process completes in under 2 hours for 6.7GB database

## Open Questions

1. **Incremental updates**: Should the tool support incremental data updates (only new/changed rows)?
2. **Data transformations**: Do we need ETL capabilities (e.g., computed columns, data cleaning)?
3. **Rollback strategy**: Should we support automatic rollback on validation failure?
4. **Monitoring**: Do we need Slack/email notifications for long-running migrations?

## References

- SQLite source: `/Users/yo_macbook/Documents/app_data/TR_05_DB/TR_05_SQLITE_FILE.db`
- Target: PostgreSQL via `$ZERO_UPSTREAM_DB`
- Zero docs: https://zerosync.dev
- PostgreSQL COPY: https://www.postgresql.org/docs/current/sql-copy.html
