import { Hono } from "hono";
import { getDuckDBConnection } from "../duckdb";

const duckdbInvestorDrilldownRoutes = new Hono();

/**
 * GET /api/duckdb-investor-drilldown?ticker=&quarter=&action=open|close&limit=
 *
 * Returns superinvestor-level rows for a given ticker, quarter, and action
 * using DuckDB native via @duckdb/node-api.
 */
duckdbInvestorDrilldownRoutes.get("/", async (c) => {
  const tickerRaw = (c.req.query("ticker") || "").trim();
  const quarterRaw = (c.req.query("quarter") || "").trim();
  const actionRaw = (c.req.query("action") || "").trim().toLowerCase();
  const limit = Math.min(parseInt(c.req.query("limit") || "500", 10), 5000);

  if (!tickerRaw || !quarterRaw) {
    return c.json({ error: "ticker and quarter are required" }, 400);
  }

  if (actionRaw !== "open" && actionRaw !== "close") {
    return c.json({ error: "action must be 'open' or 'close'" }, 400);
  }

  const ticker = tickerRaw.toUpperCase();
  const quarter = quarterRaw;

  try {
    const startTime = performance.now();
    const conn = await getDuckDBConnection();

    const escapedTicker = ticker.replace(/'/g, "''");
    const escapedQuarter = quarter.replace(/'/g, "''");
    const actionColumn = actionRaw === "open" ? "did_open" : "did_close";

    const sql = `
      SELECT
        d.cusip,
        d.quarter,
        d.cik,
        d.did_open,
        d.did_add,
        d.did_reduce,
        d.did_close,
        d.did_hold,
        s.cik_name,
        s.cik_ticker
      FROM cusip_quarter_investor_activity_detail d
      LEFT JOIN superinvestors s ON s.cik = d.cik
      WHERE d.cusip_ticker = '${escapedTicker}'
        AND d.quarter = '${escapedQuarter}'
        AND d.${actionColumn} = true
      LIMIT ${limit}
    `;

    const reader = await conn.runAndReadAll(sql);
    const rawRows = reader.getRows();

    const rows = rawRows.map((row: any[], index: number) => {
      const rawCik = row[2];
      let cik: string | null;
      if (rawCik === null || rawCik === undefined) {
        cik = null;
      } else if (typeof rawCik === "bigint") {
        cik = rawCik.toString();
      } else {
        cik = String(rawCik);
      }

      return {
        id: index,
        cusip: row[0] as string | null,
        quarter: row[1] as string | null,
        cik,
        didOpen: row[3] as boolean | null,
        didAdd: row[4] as boolean | null,
        didReduce: row[5] as boolean | null,
        didClose: row[6] as boolean | null,
        didHold: row[7] as boolean | null,
        cikName: row[8] as string | null,
        cikTicker: row[9] as string | null,
      };
    });

    const queryTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    return c.json({
      ticker,
      quarter,
      action: actionRaw,
      count: rows.length,
      queryTimeMs,
      rows,
    });
  } catch (error) {
    console.error("[DuckDB Investor Drilldown] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return c.json({ error: "Drilldown query failed", details: errorMessage }, 500);
  }
});

export default duckdbInvestorDrilldownRoutes;
