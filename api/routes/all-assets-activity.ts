import { Hono } from "hono";
import { getDuckDBConnection } from "../duckdb";

const allAssetsActivityRoutes = new Hono();

/**
 * GET /api/all-assets-activity
 *
 * Returns opened/closed position counts by quarter across ALL assets.
 * Reads directly from the pre-aggregated `all_assets_activity` table.
 */
allAssetsActivityRoutes.get("/", async (c) => {
  try {
    const startTime = performance.now();
    const conn = await getDuckDBConnection();

    // Query the pre-aggregated all_assets_activity table
    const sql = `
      SELECT 
        id,
        quarter,
        total_open,
        total_add,
        total_reduce,
        total_close,
        total_hold
      FROM all_assets_activity
      ORDER BY quarter ASC
    `;

    const reader = await conn.runAndReadAll(sql);
    const rows = reader.getRows();

    const data = rows.map((row: any[]) => ({
      id: Number(row[0]),
      quarter: row[1] as string,
      totalOpen: Number(row[2]) || 0,
      totalAdd: Number(row[3]) || 0,
      totalReduce: Number(row[4]) || 0,
      totalClose: Number(row[5]) || 0,
      totalHold: Number(row[6]) || 0,
      // For chart compatibility
      opened: Number(row[2]) || 0,
      closed: Number(row[5]) || 0,
    }));

    const queryTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    return c.json({
      data,
      count: data.length,
      queryTimeMs,
    });
  } catch (error) {
    console.error("[All Assets Activity] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ error: "Query failed", details: errorMessage }, 500);
  }
});

export default allAssetsActivityRoutes;
