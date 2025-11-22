# schema-transfer Specification

## Purpose
TBD - created by archiving change add-sqlite-to-postgres-migration-tool. Update Purpose after archive.
## Requirements
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

