/**
 * TypeScript types for DuckDB tables.
 * These are READ-ONLY tables managed by an external data pipeline.
 * No Drizzle schema needed - just type definitions for API responses.
 */

/** Quarterly opened/closed position counts (for chart compatibility) */
export interface QuarterlyActivityPoint {
  quarter: string;
  opened: number;
  closed: number;
}

/** 
 * Row from all_assets_activity table.
 * Pre-aggregated totals across all assets per quarter.
 */
export interface AllAssetsActivityRow {
  id: number;
  quarter: string;
  totalOpen: number;
  totalAdd: number;
  totalReduce: number;
  totalClose: number;
  totalHold: number;
  // Chart-compatible aliases
  opened: number;
  closed: number;
}

/** Response from /api/all-assets-activity endpoint */
export interface AllAssetsActivityResponse {
  rows: AllAssetsActivityRow[];
  count: number;
  queryTimeMs: number;
}

/** Per-asset activity from cusip_quarter_investor_activity */
export interface AssetQuarterActivity {
  cusip: string | null;
  ticker: string | null;
  quarter: string;
  numOpen: number;
  numAdd: number;
  numReduce: number;
  numClose: number;
  numHold: number;
}
