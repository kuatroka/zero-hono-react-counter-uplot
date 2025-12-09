import { Hono } from "hono";
import { getDuckDBConnection } from "../duckdb";

const assetsRoutes = new Hono();

/**
 * GET /api/assets?limit=<n>&offset=<n>
 *
 * Returns all assets from the DuckDB assets table.
 * Used by TanStack DB collection for eager loading.
 */
assetsRoutes.get("/", async (c) => {
    const limit = Math.min(parseInt(c.req.query("limit") || "50000", 10), 50000);
    const offset = parseInt(c.req.query("offset") || "0", 10);

    try {
        const conn = await getDuckDBConnection();

        const sql = `
      SELECT 
        asset,
        asset_name as "assetName",
        cusip
      FROM assets
      ORDER BY asset_name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

        const reader = await conn.runAndReadAll(sql);
        const rows = reader.getRows();

        const results = rows.map((row: any[], index: number) => ({
            id: `${row[0]}-${row[2] || index}`,
            asset: row[0] as string,
            assetName: row[1] as string,
            cusip: row[2] as string | null,
        }));

        // Query completed in: Math.round((performance.now() - startTime) * 100) / 100 ms

        return c.json(results);
    } catch (error) {
        console.error("[DuckDB Assets] Error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return c.json({ error: "Assets query failed", details: errorMessage }, 500);
    }
});

export default assetsRoutes;
