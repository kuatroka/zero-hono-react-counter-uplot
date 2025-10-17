import postgres from "postgres";

const connectionString = process.env.ZERO_UPSTREAM_DB;

if (!connectionString) {
  throw new Error("ZERO_UPSTREAM_DB environment variable is not set");
}

export const sql = postgres(connectionString);
