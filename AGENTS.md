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

## Schema Management

This project uses **drizzle-zero** to auto-generate Zero schema from Drizzle ORM schema.

### Schema Files
- `src/db/schema.ts` - **Source of truth** (Drizzle ORM tables and relations)
- `src/zero/schema.gen.ts` - Auto-generated Zero schema (DO NOT EDIT)
- `src/zero/schema.ts` - Wrapper that adds permissions and re-exports

### Workflow
1. Modify `src/db/schema.ts` (add tables, columns, relations)
2. Run `bun run generate-zero-schema` to regenerate Zero schema
3. Update permissions in `src/zero/schema.ts` if needed
4. Run `bun run db:generate` and `bun run db:migrate` for database migrations

### Key Commands
```bash
bun run generate-zero-schema  # Regenerate Zero schema from Drizzle
bun run db:generate           # Generate Drizzle migration
bun run db:migrate            # Apply migrations to database
```