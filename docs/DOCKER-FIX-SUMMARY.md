# Docker Database Initialization Fix

## Problem

The database initialization was failing because:
1. `init-db.sh` was checking if tables existed BEFORE `seed.sql` ran
2. `seed.sql` was mounted separately and ran after `init-db.sh`
3. This created a race condition where the script thought data existed when it didn't
4. `seed.sql` was not idempotent (no `IF NOT EXISTS` or `ON CONFLICT`)
5. The DuckDB configuration script used psql variables that don't work in docker-entrypoint-initdb.d

## Solution

**Simplified the initialization process:**

1. **Removed `init-db.sh`** - No longer needed with idempotent SQL
2. **Made `seed.sql` idempotent** - Added `IF NOT EXISTS` and `ON CONFLICT DO NOTHING`
3. **Removed duplicate code** - Removed counters/value_quarters from seed.sql (handled by migration)
4. **Fixed script ordering** - All scripts now run in correct numerical order
5. **Simplified DuckDB config** - Removed problematic psql variable usage

## Changes Made

### Modified Files

1. **docker/docker-compose.yml**
   - Removed `init-db.sh` mount
   - Mounted individual migration files with clear naming
   - Scripts now run in order: 01 → 02 → 03 → 04 → 05 → 06

2. **docker/seed.sql**
   - Added `IF NOT EXISTS` to all CREATE TABLE statements
   - Added `ON CONFLICT DO NOTHING` to all INSERT statements
   - Removed duplicate counters/value_quarters code (handled by migration)

3. **docker/README.md**
   - Updated documentation to reflect new initialization process
   - Added clear explanation of what happens on first startup

### Deleted Files

- **docker/init-db.sh** - No longer needed

## Verification

✅ Database initializes correctly on first startup
✅ All tables created with correct data:
   - 9 users
   - 4 mediums
   - 1 counter
   - 108 value_quarters
   - 1000 entities (500 investors + 500 assets)
✅ Both extensions loaded (pg_duckdb 1.1.0, pg_mooncake 0.2.0)
✅ Scripts are idempotent (safe to run multiple times)
✅ Data persists across container restarts

## Usage

```bash
# Start database (auto-initializes on first run)
bun run dev:db-up

# Stop database
bun run dev:db-down

# Clean restart (removes all data)
bun run dev:clean && bun run dev:db-up
```

## Technical Details

**Initialization Order:**
1. `01-setup-extensions.sql` - Enables pg_mooncake and pg_duckdb
2. `02-seed.sql` - Creates base tables (user, medium, message)
3. `03-migration-counters.sql` - Adds counters and value_quarters
4. `04-migration-entities.sql` - Adds entities table with 1000 records
5. `05-migration-rollback.sql` - Removes full-text search (if exists)
6. `06-configure-duckdb.sql` - DuckDB configuration

All scripts use:
- `CREATE TABLE IF NOT EXISTS` - Safe to run multiple times
- `INSERT ... ON CONFLICT DO NOTHING` - Prevents duplicate data
- `DROP ... IF EXISTS` - Safe cleanup operations
