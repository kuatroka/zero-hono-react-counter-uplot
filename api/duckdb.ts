import { DuckDBInstance } from "@duckdb/node-api";



const DUCKDB_PATH = process.env.DUCKDB_PATH || "/Users/yo_macbook/Documents/app_data/TR_05_DB/TR_05_DUCKDB_FILE.duckdb";

let instance: DuckDBInstance | null = null;
let connection: Awaited<ReturnType<DuckDBInstance["connect"]>> | null = null;
let connectionInit: Promise<Awaited<ReturnType<DuckDBInstance["connect"]>>> | null = null;

/**
 * Get a singleton DuckDB connection.
 * DuckDB file locking requires a single connection; reuse avoids cold start overhead.
 */
export async function getDuckDBConnection() {
  if (connection) return connection;

  if (!connectionInit) {
    connectionInit = (async () => {
      instance = await DuckDBInstance.fromCache(DUCKDB_PATH, {
        threads: "4",
        access_mode: "READ_ONLY",
      });
      const conn = await instance.connect();
      console.log(`[DuckDB] Connected to ${DUCKDB_PATH}`);

      try {
        const reader = await conn.runAndRead(
        "SELECT current_setting('access_mode') AS access_mode"
        );
        await reader.readAll();
        const rows = reader.getRowObjects();
        console.log(
          "[DuckDB] access_mode current_setting:",
          rows?.[0]?.access_mode ?? rows?.[0]
        );
      } catch (err) {
        try {
          const reader = await conn.runAndRead("PRAGMA show;");
          await reader.readAll();
          const rows = reader.getRowObjects();
          const accessRow = rows.find((r: any) => r.name === "access_mode");
          console.log("[DuckDB] PRAGMA show access_mode row:", accessRow);
        } catch (err2) {
          console.warn("[DuckDB] Failed to log access_mode", err, err2);
        }
      }
      return conn;
    })()
      .then((conn) => {
        connection = conn;
        return conn;
      })
      .catch((err) => {
        connectionInit = null;
        throw err;
      });
  }

  return connectionInit;
}

/**
 * Close the DuckDB connection (for graceful shutdown).
 */
export async function closeDuckDBConnection() {
  if (connection) {
    connection.closeSync();
    connection = null;
    instance = null;
    connectionInit = null;
    console.log("[DuckDB] Connection closed");
  }
}
