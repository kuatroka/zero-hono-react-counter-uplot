# drizzle-schema-management Specification

## Purpose
TBD - created by archiving change migrate-to-ztunes-architecture. Update Purpose after archive.
## Requirements
### Requirement: Single Source of Truth Schema Definition

The system SHALL use Drizzle ORM as the single source of truth for database schema definitions, eliminating manual schema synchronization between PostgreSQL and Zero.

#### Scenario: Define database schema with Drizzle

- **WHEN** a developer defines a table in `db/schema.ts` using Drizzle ORM
- **THEN** the schema SHALL be the authoritative definition for both PostgreSQL and Zero
- **AND** no manual schema definition SHALL be required in `src/schema.ts`

#### Scenario: Generate Zero schema from Drizzle

- **WHEN** a developer runs `bun run generate-zero-schema`
- **THEN** drizzle-zero SHALL automatically generate `zero/schema.gen.ts`
- **AND** the generated schema SHALL match the Drizzle schema exactly
- **AND** the generated file SHALL include a warning comment: "Auto-generated, do not edit manually"

#### Scenario: Schema changes propagate automatically

- **WHEN** a developer modifies a table definition in `db/schema.ts`
- **AND** runs the schema generation script
- **THEN** the Zero schema SHALL be updated automatically
- **AND** TypeScript types SHALL be updated automatically
- **AND** no manual synchronization SHALL be required

### Requirement: Type-Safe Database Queries

The system SHALL provide full type safety from database schema to client code through Drizzle ORM and generated Zero schema.

#### Scenario: Type-safe table definitions

- **WHEN** a developer defines a table with Drizzle
- **THEN** TypeScript SHALL infer column types automatically
- **AND** invalid column types SHALL produce compile-time errors
- **AND** nullable columns SHALL be typed as `T | null`

#### Scenario: Type-safe query results

- **WHEN** a developer queries data using the generated Zero schema
- **THEN** query results SHALL be typed according to the Drizzle schema
- **AND** accessing non-existent columns SHALL produce compile-time errors
- **AND** type mismatches SHALL be caught at compile time

### Requirement: Drizzle Configuration

The system SHALL provide a Drizzle configuration file that specifies PostgreSQL connection and schema paths.

#### Scenario: Configure Drizzle for PostgreSQL

- **WHEN** `drizzle.config.ts` is created
- **THEN** it SHALL specify the PostgreSQL connection string
- **AND** it SHALL specify the schema path as `db/schema.ts`
- **AND** it SHALL specify the output directory for migrations (if using Drizzle migrations)

#### Scenario: Use Bun runtime with Drizzle

- **WHEN** Drizzle commands are executed
- **THEN** they SHALL use Bun as the runtime
- **AND** Node.js SHALL NOT be required
- **AND** all Drizzle operations SHALL work with Bun

### Requirement: Schema Generation Script

The system SHALL provide a script that generates Zero schema from Drizzle schema using drizzle-zero.

#### Scenario: Run schema generation

- **WHEN** a developer runs `bun run generate-zero-schema`
- **THEN** the script SHALL read the Drizzle schema from `db/schema.ts`
- **AND** SHALL generate Zero schema in `zero/schema.gen.ts`
- **AND** SHALL include TypeScript types for all tables
- **AND** SHALL preserve relationships between tables

#### Scenario: Schema generation errors

- **WHEN** the Drizzle schema contains unsupported types
- **THEN** the generation script SHALL fail with a descriptive error message
- **AND** SHALL indicate which table and column caused the error
- **AND** SHALL suggest how to fix the issue

### Requirement: Table Definitions

The system SHALL define all application tables in `db/schema.ts` using Drizzle ORM syntax.

#### Scenario: Define entities table

- **WHEN** the entities table is defined
- **THEN** it SHALL include columns: id (varchar, primary key), name (varchar, not null), category (varchar, not null), description (varchar, nullable), value (integer, nullable), created_at (timestamp, not null)
- **AND** the table name SHALL be 'entities'

#### Scenario: Define messages table

- **WHEN** the messages table is defined
- **THEN** it SHALL include columns: id (varchar, primary key), body (varchar, not null), labels (jsonb, nullable), timestamp (timestamp, not null), sender_id (varchar, not null), medium_id (varchar, not null)
- **AND** the table name SHALL be 'messages'

#### Scenario: Define users table

- **WHEN** the users table is defined
- **THEN** it SHALL include columns: id (varchar, primary key), name (varchar, not null), is_partner (boolean, not null)
- **AND** the table name SHALL be 'users'

#### Scenario: Define mediums table

- **WHEN** the mediums table is defined
- **THEN** it SHALL include columns: id (varchar, primary key), name (varchar, not null)
- **AND** the table name SHALL be 'mediums'

#### Scenario: Define counters table

- **WHEN** the counters table is defined
- **THEN** it SHALL include columns: id (varchar, primary key), value (double precision, not null)
- **AND** the table name SHALL be 'counters'

#### Scenario: Define value_quarters table

- **WHEN** the value_quarters table is defined
- **THEN** it SHALL include columns: quarter (varchar, primary key), value (double precision, not null)
- **AND** the table name SHALL be 'value_quarters'

### Requirement: Schema Export

The system SHALL export all table definitions from `db/schema.ts` for use by drizzle-zero and other tools.

#### Scenario: Export table definitions

- **WHEN** `db/schema.ts` is imported
- **THEN** all table definitions SHALL be exported as named exports
- **AND** each table SHALL be usable by Drizzle ORM
- **AND** each table SHALL be usable by drizzle-zero for schema generation

### Requirement: No Manual Schema Maintenance

The system SHALL NOT require manual maintenance of Zero schema definitions after initial Drizzle schema is created.

#### Scenario: Schema changes require only one file edit

- **WHEN** a developer needs to add a new column
- **THEN** they SHALL edit only `db/schema.ts`
- **AND** run the schema generation script
- **AND** SHALL NOT edit `zero/schema.gen.ts` manually
- **AND** SHALL NOT edit any other schema files

#### Scenario: Prevent manual edits to generated schema

- **WHEN** a developer opens `zero/schema.gen.ts`
- **THEN** they SHALL see a warning comment at the top
- **AND** the comment SHALL state: "Auto-generated by drizzle-zero, do not edit manually"
- **AND** any manual edits SHALL be overwritten on next generation

