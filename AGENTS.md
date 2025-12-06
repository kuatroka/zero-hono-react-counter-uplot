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

**CRITICAL ORDER**: Postgres migration MUST complete BEFORE Zero schema generation.
Generating Zero schema first will cause the running app to crash with `SchemaVersionNotSupported`.

1. Modify `src/db/schema.ts` (add tables, columns, relations)
2. Run `bun run db:sync` (generates migration, applies it, then generates Zero schema)
3. Update permissions in `src/zero/schema.ts` if needed

### Key Commands
```bash
bun run db:sync               # RECOMMENDED: Full sync (generate + migrate + zero-schema)
bun run db:generate           # Generate Drizzle migration only
bun run db:migrate            # Apply migrations to database only
bun run generate-zero-schema  # Regenerate Zero schema from Drizzle (run AFTER migrate)
```

### Why Order Matters
- Zero client schema is hot-reloaded by Vite immediately after `generate-zero-schema`
- If the table doesn't exist in Postgres yet, Zero server rejects the schema mismatch
- This breaks ALL data syncing, not just the new table