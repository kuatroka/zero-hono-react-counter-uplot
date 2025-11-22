# Spec: Schema Transfer System

## Overview

Automated extraction of SQLite schema and generation of equivalent PostgreSQL DDL, with focus on data structure only (no indexes or foreign keys).

## ADDED Requirements

### Requirement: SQLite to PostgreSQL Type Mapping
The tool SHALL accurately map SQLite types to PostgreSQL types (INTEGER→BIGINT, TEXT→TEXT, REAL→DOUBLE PRECISION, BLOB→BYTEA) with support for dynamic typing affinity rules and custom type overrides via configuration.

#### Scenario: Simple Table Type Mapping
- **WHEN** SQLite table has INTEGER, TEXT, REAL columns
- **THEN** PostgreSQL DDL is generated with BIGINT, TEXT, DOUBLE PRECISION types

#### Scenario: Custom Type Override
- **WHEN** configuration specifies `twrr: NUMERIC(10,4)` override
- **THEN** PostgreSQL table uses NUMERIC(10,4) instead of default DOUBLE PRECISION

### Requirement: Primary Key Preservation
The tool SHALL maintain primary key constraints from SQLite including single-column keys, composite keys, AUTOINCREMENT behavior (SERIAL/BIGSERIAL), and column order.

#### Scenario: Single Column Primary Key
- **WHEN** SQLite table has `id INTEGER PRIMARY KEY`
- **THEN** PostgreSQL table has `id BIGSERIAL PRIMARY KEY`

#### Scenario: Composite Primary Key
- **WHEN** SQLite table has `PRIMARY KEY (cik, quarter)`
- **THEN** PostgreSQL table has `PRIMARY KEY (cik, quarter)` with same column order

### Requirement: Column Attribute Preservation
The tool SHALL preserve column-level attributes including NOT NULL constraints, DEFAULT values with type conversion, column order, and generate column comments from SQLite schema.

#### Scenario: NOT NULL Constraints
- **WHEN** SQLite table has `name TEXT NOT NULL`
- **THEN** PostgreSQL table has `name TEXT NOT NULL`

#### Scenario: DEFAULT Values
- **WHEN** SQLite table has `created_at DATETIME DEFAULT CURRENT_TIMESTAMP`
- **THEN** PostgreSQL table has `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

### Requirement: Skip Indexes and Foreign Keys
The tool SHALL NOT create indexes or foreign key constraints (Zero-sync doesn't need them) but SHALL document relationships in comments for Zero schema hints.

#### Scenario: Foreign Key Documentation
- **WHEN** SQLite table has `FOREIGN KEY (cik) REFERENCES cik_md(cik)`
- **THEN** PostgreSQL DDL includes comment: `-- FK: cik → cik_md(cik) [for Zero schema]`

#### Scenario: Index Documentation
- **WHEN** SQLite table has index on `name` column
- **THEN** PostgreSQL DDL includes comment: `-- Original index: idx_name ON name [skipped for Zero]`

### Requirement: Idempotent DDL Generation
The tool SHALL generate clean, idempotent PostgreSQL DDL using CREATE TABLE IF NOT EXISTS, proper identifier quoting, schema-qualified table names, and separate DROP TABLE statements for cleanup.

#### Scenario: Idempotent Re-Run
- **WHEN** PostgreSQL already has table from previous migration and DDL executes with IF NOT EXISTS
- **THEN** no error occurs and existing table is preserved

## Type Mapping Rules

### SQLite → PostgreSQL

| SQLite Type | PostgreSQL Type | Notes |
|-------------|-----------------|-------|
| INTEGER | BIGINT | Safe default for large datasets |
| INT | INTEGER | When explicitly specified |
| TINYINT | SMALLINT | |
| SMALLINT | SMALLINT | |
| MEDIUMINT | INTEGER | |
| BIGINT | BIGINT | |
| UNSIGNED BIG INT | NUMERIC(20,0) | PostgreSQL has no unsigned |
| INT2 | SMALLINT | |
| INT8 | BIGINT | |
| TEXT | TEXT | |
| CHARACTER(n) | CHAR(n) | |
| VARCHAR(n) | VARCHAR(n) | |
| VARYING CHARACTER(n) | VARCHAR(n) | |
| NCHAR(n) | CHAR(n) | |
| NATIVE CHARACTER(n) | CHAR(n) | |
| NVARCHAR(n) | VARCHAR(n) | |
| CLOB | TEXT | |
| REAL | DOUBLE PRECISION | |
| DOUBLE | DOUBLE PRECISION | |
| DOUBLE PRECISION | DOUBLE PRECISION | |
| FLOAT | REAL | |
| NUMERIC | NUMERIC | |
| DECIMAL(p,s) | DECIMAL(p,s) | |
| BOOLEAN | BOOLEAN | |
| DATE | DATE | |
| DATETIME | TIMESTAMP | |
| BLOB | BYTEA | |
| NULL | TEXT | SQLite allows NULL type |

### Dynamic Typing Handling

SQLite uses type affinity, not strict types. The tool must:
1. Read declared type from `sqlite_master`
2. Apply affinity rules if type is ambiguous
3. Sample data to detect actual types if needed
4. Warn on type mismatches

## DDL Output Format

### Table Creation

```sql
-- Migrated from SQLite table: cik_md
-- Original indexes: idx_cik_name (skipped for Zero-sync)
-- Foreign keys referenced by: holdings_overview.cik

CREATE TABLE IF NOT EXISTS public.investors (
    cik BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_superinvestor BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.investors IS 'Investor metadata (13F filers)';
COMMENT ON COLUMN public.investors.cik IS 'Central Index Key (SEC identifier)';
```

### Cleanup Script

```sql
-- Rollback script for migration
-- WARNING: This will delete all migrated data

DROP TABLE IF EXISTS public.investors CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.holdings_overview CASCADE;
-- ... other tables
```

## Validation

### Pre-Generation Validation
- All source tables exist in SQLite
- All specified columns exist
- No circular dependencies in foreign keys

### Post-Generation Validation
- DDL is valid PostgreSQL syntax
- All configured tables have DDL generated
- No duplicate table names
- All column types are valid PostgreSQL types

## Performance Considerations

### Schema Extraction
- Single query to `sqlite_master` for all tables
- Parallel extraction for large schemas
- Cache schema metadata to avoid repeated queries

### DDL Generation
- Generate DDL in dependency order (referenced tables first)
- Batch DDL execution (single transaction)
- Use prepared statements for safety
