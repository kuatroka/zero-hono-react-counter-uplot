## ADDED Requirements

### Requirement: Automated Zero Schema Generation

The system SHALL use drizzle-zero to automatically generate Zero schema from Drizzle schema, eliminating manual schema synchronization.

#### Scenario: Install drizzle-zero

- **WHEN** the project is set up
- **THEN** `drizzle-zero` SHALL be installed as a dev dependency
- **AND** SHALL be compatible with current drizzle-orm version

#### Scenario: Generate Zero schema

- **WHEN** a developer runs `bun run generate-zero-schema`
- **THEN** drizzle-zero SHALL read `src/db/schema.ts`
- **AND** SHALL generate `src/zero/schema.gen.ts`
- **AND** the generated file SHALL include all tables and columns
- **AND** the generated file SHALL include relationships

#### Scenario: Generated file header

- **WHEN** `schema.gen.ts` is generated
- **THEN** it SHALL include a header comment warning not to edit manually
- **AND** SHALL include source attribution to drizzle-zero
- **AND** SHALL be excluded from linting

### Requirement: Schema Wrapper File

The system SHALL provide a wrapper file that imports the generated schema and adds Zero-specific configuration.

#### Scenario: Create schema wrapper

- **WHEN** `src/zero/schema.ts` is created
- **THEN** it SHALL import schema from `./schema.gen`
- **AND** SHALL set `enableLegacyMutators: false`
- **AND** SHALL set `enableLegacyQueries: false`
- **AND** SHALL export the combined schema

#### Scenario: Export builder and types

- **WHEN** `src/zero/schema.ts` is imported
- **THEN** it SHALL export `schema` object
- **AND** SHALL export `builder` from `createBuilder(schema)`
- **AND** SHALL export `Schema` type
- **AND** SHALL export `permissions` definition

### Requirement: Schema Generation Script

The system SHALL provide a package.json script for schema generation.

#### Scenario: Define generation script

- **WHEN** package.json scripts are defined
- **THEN** `generate-zero-schema` script SHALL exist
- **AND** SHALL run `drizzle-zero generate --format -o src/zero/schema.gen.ts`
- **AND** SHALL be runnable with `bun run generate-zero-schema`

#### Scenario: Auto-generation in development

- **WHEN** Drizzle schema changes during development
- **THEN** developer SHALL run `generate-zero-schema` manually
- **AND** Zero schema SHALL be updated to match
- **AND** TypeScript types SHALL be updated

### Requirement: Relationship Generation

The system SHALL generate Zero relationships from Drizzle relations.

#### Scenario: Generate one-to-many relationships

- **WHEN** Drizzle schema has `relations()` with `many()`
- **THEN** drizzle-zero SHALL generate corresponding Zero relationships
- **AND** `.related()` queries SHALL work correctly

#### Scenario: Generate many-to-one relationships

- **WHEN** Drizzle schema has `relations()` with `one()`
- **THEN** drizzle-zero SHALL generate corresponding Zero relationships
- **AND** `.related()` queries SHALL return single objects

### Requirement: Column Mapping

The system SHALL correctly map Drizzle column types to Zero column types.

#### Scenario: Map varchar to string

- **WHEN** Drizzle schema has `varchar()` column
- **THEN** Zero schema SHALL have `type: 'string'`

#### Scenario: Map integer to number

- **WHEN** Drizzle schema has `integer()` or `bigint()` column
- **THEN** Zero schema SHALL have `type: 'number'`

#### Scenario: Map timestamp to number

- **WHEN** Drizzle schema has `timestamp()` column
- **THEN** Zero schema SHALL have `type: 'number'` (epoch milliseconds)

#### Scenario: Map boolean to boolean

- **WHEN** Drizzle schema has `boolean()` column
- **THEN** Zero schema SHALL have `type: 'boolean'`

#### Scenario: Handle nullable columns

- **WHEN** Drizzle column is nullable (no `.notNull()`)
- **THEN** Zero schema SHALL have `optional: true`

#### Scenario: Handle server name mapping

- **WHEN** Drizzle column has different JS name than DB name
- **THEN** Zero schema SHALL include `serverName` property
- **AND** SHALL map camelCase to snake_case correctly
