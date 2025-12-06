import { Hono } from "hono";
import { getDuckDBConnection } from "../duckdb";

const searchDuckdbRoutes = new Hono();

/**
 * GET /api/duckdb-search?q=<query>&limit=<n>
 *
 * Search the `searches` table in DuckDB.
 * Returns ranked results: exact code > code starts with > code contains > name matches.
 */
searchDuckdbRoutes.get("/", async (c) => {
  const query = (c.req.query("q") || "").trim();
  const limit = Math.min(parseInt(c.req.query("limit") || "20", 10), 100);

  // Minimum 2 characters required
  if (query.length < 2) {
    return c.json({ results: [], queryTimeMs: 0 });
  }

  try {
    const startTime = performance.now();
    const conn = await getDuckDBConnection();

    // Escape single quotes for SQL
    const escaped = query.replace(/'/g, "''");
    const pattern = `%${escaped}%`;

    // Query with ranking:
    // - score 100: exact code match (case-insensitive)
    // - score 80: code starts with query
    // - score 60: code contains query
    // - score 40: name starts with query
    // - score 20: name contains query
    const sql = `
      SELECT 
        id,
        cusip,
        code,
        name,
        category,
        CASE
          WHEN LOWER(code) = LOWER('${escaped}') THEN 100
          WHEN LOWER(code) LIKE LOWER('${escaped}%') THEN 80
          WHEN LOWER(code) LIKE LOWER('${pattern}') THEN 60
          WHEN LOWER(name) LIKE LOWER('${escaped}%') THEN 40
          WHEN LOWER(name) LIKE LOWER('${pattern}') THEN 20
          ELSE 0
        END AS score
      FROM searches
      WHERE LOWER(code) LIKE LOWER('${pattern}')
         OR LOWER(name) LIKE LOWER('${pattern}')
      ORDER BY score DESC, name ASC
      LIMIT ${limit}
    `;

    const reader = await conn.runAndReadAll(sql);
    const rows = reader.getRows();

    // Convert to objects
    const results = rows.map((row: any[]) => ({
      id: Number(row[0]),
      cusip: row[1],
      code: row[2],
      name: row[3],
      category: row[4],
      score: Number(row[5]),
    }));

    const queryTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    return c.json({
      results,
      count: results.length,
      queryTimeMs,
    });
  } catch (error) {
    console.error("[DuckDB Search] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ error: "Search failed", details: errorMessage }, 500);
  }
});

export default searchDuckdbRoutes;
