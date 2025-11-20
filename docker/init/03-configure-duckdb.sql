-- DuckDB configuration is handled via postgresql.conf or ALTER SYSTEM
-- The DUCKDB_FORCE_EXECUTION environment variable can be set in docker-compose.yml
-- and will be picked up by the extension if needed.
-- 
-- For now, we keep the default behavior (off) unless explicitly configured.

-- Materialize CIK directory from local parquet using pg_duckdb.
-- Host path /Users/yo_macbook/Documents/app_data is mounted as /app_data in the container.

-- 1) Ensure the table always exists (even if parquet load fails).
CREATE TABLE IF NOT EXISTS cik_directory (
  cik      TEXT PRIMARY KEY,
  cik_name TEXT NOT NULL
);

-- 2) Load / refresh data from parquet, but don't abort init if the file
--    is missing or unreadable. This keeps the table defined in code
--    while making the data load best-effort and idempotent.
DO $$
BEGIN
  BEGIN
    -- Step 1: Create a temp view over the parquet file using DuckDB
    EXECUTE $inner$
      CREATE TEMP VIEW cik_parquet_view AS
      SELECT DISTINCT
        (r['cik'])::TEXT      AS cik,
        (r['cik_name'])::TEXT AS cik_name
      FROM read_parquet('file:///app_data/MASTER_DATA/MD_03_CIK/MD_03_CIK_NAME_TICKER_FILE.parquet') AS r
    $inner$;
    
    -- Step 2: Insert from the view into the Postgres table (regular Postgres SQL)
    INSERT INTO cik_directory (cik, cik_name)
    SELECT cik, cik_name FROM cik_parquet_view
    ON CONFLICT (cik) DO NOTHING;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Skipping CIK parquet load: %', SQLERRM;
  END;
END;
$$;

GRANT SELECT ON cik_directory TO PUBLIC;
