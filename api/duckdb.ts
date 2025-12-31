import { DuckDBInstance } from "@duckdb/node-api";
import { stat } from "node:fs/promises";

const DUCKDB_PATH = process.env.DUCKDB_PATH || "/Users/yo_macbook/Documents/app_data/TR_05_DB/TR_05_DUCKDB_FILE.duckdb";

let instance: DuckDBInstance | null = null;
let connection: Awaited<ReturnType<DuckDBInstance["connect"]>> | null = null;
let connectionInit: Promise<Awaited<ReturnType<DuckDBInstance["connect"]>>> | null = null;
let lastFileMtime: number | null = null;

/**
 * Get the file's modification time in milliseconds
 */
async function getFileMtime(): Promise<number | null> {
  try {
    const stats = await stat(DUCKDB_PATH);
    return stats.mtimeMs;
  } catch {
    return null;
  }
}

/**
 * Check if the DuckDB file has been modified since we opened the connection
 */
async function hasFileChanged(): Promise<boolean> {
  if (lastFileMtime === null) return false;
  const currentMtime = await getFileMtime();
  return currentMtime !== null && currentMtime !== lastFileMtime;
}

/**
 * Open a new DuckDB connection and track file mtime
 * Uses DuckDBInstance.create() instead of fromCache() to ensure fresh data after file changes.
 */
async function openConnection(): Promise<Awaited<ReturnType<DuckDBInstance["connect"]>>> {
  // Track file mtime before opening
  lastFileMtime = await getFileMtime();

  // Use create() instead of fromCache() to avoid stale cached instances
  // This ensures we always read fresh data when the file has changed
  instance = await DuckDBInstance.create(DUCKDB_PATH, {
    threads: "4",
    access_mode: "READ_ONLY",
  });
  const conn = await instance.connect();
  console.log(`[DuckDB] Connected to ${DUCKDB_PATH} (mtime: ${lastFileMtime})`);

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
}

/**
 * Get a singleton DuckDB connection.
 * Automatically reconnects if the DuckDB file has been modified (e.g., by ETL).
 */
export async function getDuckDBConnection() {
  // Check if file changed and reconnect if needed
  if (connection && await hasFileChanged()) {
    console.log("[DuckDB] File changed, reconnecting...");
    await closeDuckDBConnection();
  }

  if (connection) return connection;

  if (!connectionInit) {
    connectionInit = openConnection()
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
    lastFileMtime = null;
    console.log("[DuckDB] Connection closed");
  }
}
