import { Hono } from "hono";
import { getDuckDBConnection } from "../duckdb";

const quarterlyDataRoutes = new Hono();

/**
 * GET /api/quarterly-data
 *
 * Returns all quarterly data from the DuckDB value_quarters table.
 * Used by TanStack DB collection for chart data.
 */
quarterlyDataRoutes.get("/", async (c) => {
    try {
        const conn = await getDuckDBConnection();

        const sql = `
      SELECT 
        quarter,
        value
      FROM value_quarters
      ORDER BY quarter ASC
    `;

        const reader = await conn.runAndReadAll(sql);
        const rows = reader.getRows();

        const results = rows.map((row: any[]) => ({
            quarter: row[0] as string,
            value: Number(row[1]),
        }));

        // Query completed in: Math.round((performance.now() - startTime) * 100) / 100 ms

        return c.json(results);
    } catch (error) {
        console.error("[DuckDB Quarterly Data] Error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return c.json({ error: "Quarterly data query failed", details: errorMessage }, 500);
    }
});

export default quarterlyDataRoutes;
