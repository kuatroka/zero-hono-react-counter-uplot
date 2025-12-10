<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## DB and Schema Management

This project uses two main DBs:
1. **Postgres** - for user management, authorisations, subscriptions, favourite management, but the main data is stored in the **duckdb** DB in a local under variable **DUCKDB_PATH** in .env

There is a lot of other important data in parquet file format in the directory **APP_DATA_PATH** in .env
2. **Zero DB** - for real-time synchronization and client-side caching

This project uses **drizzle-orm** for schema generation only for the **Postgres**.

## JS runtime and package management - **bun**

## Backend Server - **hono** 

### Key Commands
```bash

bun run dev:db-up             # to start the dev Postgres container
bun run dev:db-down           # to stop the dev Postgres container
bun run dev:clean             # to delete data volumes Posgtres (use after stopping db)
bun run db:generate           # Generate Drizzle migration only
bun run db:migrate            # Apply migrations to database only
bun run dev                   # launches the web app

```
