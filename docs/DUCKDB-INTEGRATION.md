# DuckDB Integration Guide

This document describes how DuckDB tables are integrated into this application and the process for adding new tables.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  DATA PIPELINE (separate codebase)                              │
│  Creates/updates tables in DuckDB file                          │
│  Location: /Users/yo_macbook/Documents/app_data/TR_05_DB/       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  THIS APP (zero-hono-react-counter-uplot)                       │
│                                                                 │
│  DuckDB tables → Query via duckdb-node-neo (READ_ONLY)          │
│  - No schema management needed in this app                      │
│  - Just add API routes that query the tables                    │
│  - TypeScript types defined in src/types/duckdb.ts              │
│                                                                 │
│  Postgres tables → Drizzle ORM + Zero sync                      │
│  - For data that needs real-time sync to client                 │
│  - Schema managed via Drizzle migrations                        │
└─────────────────────────────────────────────────────────────────┘
```

## Key Principle: DuckDB is READ-ONLY

This app connects to DuckDB in `READ_ONLY` mode. Schema is managed by the external data pipeline, not this app.

**DO NOT use Drizzle for DuckDB tables.** Drizzle is only for Postgres tables that need Zero sync.

## Current DuckDB Tables

| Table | Purpose |
|-------|---------|
| `all_assets_activity` | **Pre-aggregated** totals across all assets per quarter (total_open, total_add, total_reduce, total_close, total_hold) |
| `assets` | Asset metadata (id, asset, asset_name) |
| `cusip_quarter_investor_activity` | Per-asset quarterly opened/closed/add/reduce/hold counts |
| `cusip_quarter_investor_activity_detail` | Detail rows for drilldown (via Parquet files) |
| `superinvestors` | Superinvestor metadata |
| `searches` | Search index for assets/superinvestors |
| `every_qtr` | Quarter-level aggregates |
| `high_level_totals` | Global totals |

## Process: Adding a New DuckDB Table

When a new table becomes available from the data pipeline:

### 1. Document the Schema

Get column names and types from the data pipeline team or inspect the DuckDB file:

```sql
DESCRIBE table_name;
SELECT * FROM table_name LIMIT 5;
```

### 2. Add TypeScript Interface

Create or update `src/types/duckdb.ts`:

```typescript
/** Description of what this table contains */
export interface NewTableRow {
  column1: string;
  column2: number;
  // ... etc
}

/** API response type */
export interface NewTableResponse {
  data: NewTableRow[];
  queryTimeMs: number;
}
```

### 3. Add API Route

Create `api/routes/new-table.ts`:

```typescript
import { Hono } from "hono";
import { getDuckDBConnection } from "../duckdb";

const newTableRoutes = new Hono();

newTableRoutes.get("/", async (c) => {
  try {
    const startTime = performance.now();
    const conn = await getDuckDBConnection();

    const sql = `SELECT * FROM new_table ORDER BY some_column`;
    const reader = await conn.runAndReadAll(sql);
    const rows = reader.getRows();

    const data = rows.map((row: any[]) => ({
      column1: row[0],
      column2: Number(row[1]),
    }));

    return c.json({
      data,
      queryTimeMs: Math.round((performance.now() - startTime) * 100) / 100,
    });
  } catch (error) {
    console.error("[NewTable] Error:", error);
    return c.json({ error: "Query failed" }, 500);
  }
});

export default newTableRoutes;
```

### 4. Register the Route

In `api/index.ts`:

```typescript
import newTableRoutes from "./routes/new-table";
// ...
app.route("/new-table", newTableRoutes);
```

### 5. Add React Component/Hook

Create a component that fetches from the API:

```typescript
import { useQuery } from "@tanstack/react-query";

export function useNewTableData() {
  return useQuery({
    queryKey: ["new-table"],
    queryFn: async () => {
      const res = await fetch("/api/new-table");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

## Example: All Assets Activity

The `AllAssetsActivityChart` component demonstrates this pattern:

1. **Type**: `src/types/duckdb.ts` → `QuarterlyActivityPoint`, `AllAssetsActivityResponse`
2. **API**: `api/routes/all-assets-activity.ts` → aggregates `cusip_quarter_investor_activity`
3. **Component**: `src/components/charts/AllAssetsActivityChart.tsx` → fetches and renders

## DuckDB Connection

Singleton connection in `api/duckdb.ts`:

```typescript
const instance = await DuckDBInstance.fromCache(DUCKDB_PATH, {
  threads: "4",
  access_mode: "READ_ONLY",
});
```

- Uses `fromCache` for shared in-process instance
- `READ_ONLY` prevents any writes
- Connection is reused across requests

## Troubleshooting

### "Conflicting lock" Error

If you see:
```
IO Error: Could not set lock on file: Conflicting lock is held
```

Another process (like Tad or DBeaver) has the DuckDB file open. Close that application.

### Schema Changes

If the data pipeline adds/removes columns:
1. Update TypeScript interfaces in `src/types/duckdb.ts`
2. Update SQL queries in API routes
3. No migrations needed - DuckDB schema is external
