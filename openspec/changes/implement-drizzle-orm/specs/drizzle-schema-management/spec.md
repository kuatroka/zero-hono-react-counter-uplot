## ADDED Requirements
### Requirement: Migration Scripts
The system SHALL provide scripts to generate and run migrations via Drizzle Kit.

#### Scenario: Generate migrations
- **WHEN** developer runs `bun run db:generate`
- **THEN** Drizzle Kit SHALL inspect `src/db/schema.ts`
- **AND** generate SQL migrations in `docker/migrations` (or configured folder)
- **AND** not require manual SQL writing

#### Scenario: Apply migrations
- **WHEN** developer runs `bun run db:migrate`
- **THEN** Drizzle Kit SHALL connect to the running database
- **AND** apply pending migrations without data loss
- **AND** track migration state in the database
