import { DuckDBInstance } from "@duckdb/node-api";

const DUCKDB_PATH = process.env.DUCKDB_PATH || "/Users/yo_macbook/Documents/app_data/TR_05_DB/TR_05_DUCKDB_FILE.duckdb";

let instance: DuckDBInstance | null = null;
let connection: Awaited<ReturnType<DuckDBInstance["connect"]>> | null = null;

/**
 * Get a singleton DuckDB connection.
 * DuckDB file locking requires a single connection; reuse avoids cold start overhead.
 */
export async function getDuckDBConnection() {
  if (!connection) {
    instance = await DuckDBInstance.create(DUCKDB_PATH, { threads: "4" });
    connection = await instance.connect();
    console.log(`[DuckDB] Connected to ${DUCKDB_PATH}`);
  }
  return connection;
}

/**
 * Close the DuckDB connection (for graceful shutdown).
 */
export async function closeDuckDBConnection() {
  if (connection) {
    connection.closeSync();
    connection = null;
    instance = null;
    console.log("[DuckDB] Connection closed");
  }
}
