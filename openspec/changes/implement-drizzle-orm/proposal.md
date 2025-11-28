## Why
The current database schema management relies on raw SQL files in `docker/migrations` that only execute on empty volumes. This forces developers to delete database data to apply schema changes. Additionally, the project has an existing spec for Drizzle ORM that was never implemented.

## What Changes
- Install `drizzle-orm` and `drizzle-kit`.
- Create `drizzle.config.ts` and `src/db/schema.ts`.
- Port existing raw SQL tables (counters, entities, etc.) to Drizzle TypeScript definitions.
- Replace the manual Docker volume reset workflow with `bun run db:migrate`.
- **BREAKING**: The source of truth for schema changes moves from `docker/migrations/*.sql` to `src/db/schema.ts`.

## Impact
- **Database**: Existing data can be preserved during schema evolution.
- **DX**: Type-safe schema definitions and automatic migration generation.
- **Specs**: Implements `drizzle-schema-management`.
