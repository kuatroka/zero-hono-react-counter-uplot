# Drilldown API Benchmarks

**Date:** December 5, 2025  
**Environment:** macOS, Docker PostgreSQL with pg_duckdb extension  
**Data:** ~32,000 ticker partitions, 334MB total Parquet files  
**Benchmark config:** 5 warmup iterations, 20 measured iterations, no LIMIT (full result sets)

---

## Global Summary Table

All queries return full result sets (no LIMIT). Ordered by performance (fastest first).

| Approach | Data Source | AAPL 2024Q3 open | MSFT 2024Q3 close | AAPL summary |
|----------|-------------|------------------|-------------------|---------------|
| **DuckDB native (duckdb-node-neo)** | DuckDB file | **0.7 ms** | **0.9 ms** | **4.1 ms** |
| **Hono + postgres npm (pg_duckdb)** | Parquet | 9.2 ms | 10.5 ms | 9.0 ms |
| **Bun Native SQL (pg_duckdb)** | Parquet | 9.8 ms | 9.6 ms | 10.0 ms |
| **PostgreSQL native** | Postgres table | ~3,600 ms | ~5,300 ms | ~4,500 ms |
| **PostgreSQL + duckdb.force_execution** | Postgres table | ~5,400 ms | ~5,300 ms | ~4,000 ms |

**Key insight:** DuckDB native is **~10x faster** than pg_duckdb via HTTP, and **~5,000x faster** than querying the Postgres detail table directly.

---

## Benchmark Queries

```sql
-- Query 1: AAPL 2024Q3 open
SELECT cusip, quarter, cik, did_open, did_add, did_reduce, did_close, did_hold
FROM [source]
WHERE ticker = 'AAPL' AND quarter = '2024Q3' AND did_open = true

-- Query 2: MSFT 2024Q3 close  
SELECT cusip, quarter, cik, did_open, did_add, did_reduce, did_close, did_hold
FROM [source]
WHERE ticker = 'MSFT' AND quarter = '2024Q3' AND did_close = true

-- Query 3: AAPL summary by quarter
SELECT quarter,
  COUNT(*) FILTER (WHERE did_open) AS open_count,
  COUNT(*) FILTER (WHERE did_add) AS add_count,
  COUNT(*) FILTER (WHERE did_reduce) AS reduce_count,
  COUNT(*) FILTER (WHERE did_close) AS close_count,
  COUNT(*) FILTER (WHERE did_hold) AS hold_count,
  COUNT(*) AS total_count
FROM [source]
WHERE ticker = 'AAPL'
GROUP BY quarter ORDER BY quarter DESC
```

---

## 1. DuckDB Native (duckdb-node-neo + DuckDB file)

Direct query against `TR_05_DUCKDB_FILE.duckdb` using `@duckdb/node-api`.

| Query | Avg | Min | Max | P50 | P95 |
|-------|-----|-----|-----|-----|-----|
| AAPL 2024Q3 open | **0.72 ms** | 0.64 ms | 1.06 ms | 0.69 ms | 0.81 ms |
| MSFT 2024Q3 close | **0.88 ms** | 0.71 ms | 1.02 ms | 0.89 ms | 1.00 ms |
| AAPL summary | **4.06 ms** | 3.76 ms | 4.30 ms | 4.08 ms | 4.21 ms |

---

## 2. Hono + postgres npm (pg_duckdb → Parquet)

Hono API on port 4000 using `postgres` npm package to query pg_duckdb.

| Query | Avg | Min | Max | P50 | P95 | P99 |
|-------|-----|-----|-----|-----|-----|-----|
| AAPL 2024Q3 open | **9.15 ms** | 6.29 ms | 15.08 ms | 7.93 ms | 13.50 ms | 15.08 ms |
| MSFT 2024Q3 close | **10.50 ms** | 5.88 ms | 18.19 ms | 9.74 ms | 14.41 ms | 18.19 ms |
| AAPL summary | **9.04 ms** | 7.84 ms | 10.07 ms | 9.00 ms | 9.87 ms | 10.07 ms |

---

## 3. Bun Native SQL (pg_duckdb → Parquet)

Bun server on port 3006 using Bun's native SQL driver to query pg_duckdb.

| Query | Avg | Min | Max | P50 | P95 | P99 |
|-------|-----|-----|-----|-----|-----|-----|
| AAPL 2024Q3 open | **9.82 ms** | 6.37 ms | 16.60 ms | 9.01 ms | 16.11 ms | 16.60 ms |
| MSFT 2024Q3 close | **9.59 ms** | 6.45 ms | 15.79 ms | 8.46 ms | 14.68 ms | 15.79 ms |
| AAPL summary | **9.97 ms** | 8.28 ms | 13.08 ms | 9.55 ms | 12.43 ms | 13.08 ms |

---

## 4. PostgreSQL Native (detail table, no pg_duckdb)

Direct query against `cusip_quarter_investor_activity_detail` table in Postgres.

| Query | Time |
|-------|------|
| AAPL 2024Q3 open | **~3,600 ms** |
| MSFT 2024Q3 close | **~5,300 ms** |
| AAPL summary | **~4,500 ms** |

---

## 5. PostgreSQL + duckdb.force_execution (detail table)

Same Postgres table, but with `SET duckdb.force_execution = true` to use DuckDB engine.

| Query | Time |
|-------|------|
| AAPL 2024Q3 open | **~5,400 ms** |
| MSFT 2024Q3 close | **~5,300 ms** |
| AAPL summary | **~4,000 ms** |

Forcing DuckDB execution on Postgres tables provides no benefit—data must be in Parquet for fast queries.

---

## Key Findings

1. **DuckDB native is the clear winner** — sub-millisecond queries (~0.7-0.9ms) for filtered lookups, ~4ms for aggregations
2. **DuckDB native is ~10x faster than pg_duckdb** — eliminating Postgres/HTTP overhead matters
3. **pg_duckdb + Parquet** achieves ~9-10ms via HTTP API — still excellent for web interactivity
4. **Hono vs Bun Native SQL** perform identically (~9-10ms) — driver choice doesn't matter for pg_duckdb
5. **Postgres detail table is ~5,000x slower** than DuckDB native, ~400x slower than pg_duckdb
6. **duckdb.force_execution** doesn't help — the bottleneck is data format (row-based table vs columnar), not query engine
7. **Data layout matters** — ordering the DuckDB table by `ticker` (not `cusip`) fixed the MSFT vs AAPL performance gap

## Recommendations

| Goal | Recommendation |
|------|----------------|
| **Fastest possible queries** | DuckDB native via `@duckdb/node-api` (~1ms) |
| **Simple architecture** | pg_duckdb + Parquet via Hono API (~10ms) |
| **Offline/edge support** | DuckDB-WASM in browser |
| **Avoid at all costs** | Large Postgres tables for analytical queries |

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│  Hono API   │────▶│  PostgreSQL │────▶│  Parquet    │
│   Client    │     │  (Bun)      │     │  pg_duckdb  │     │  Files      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

**Parquet structure:**
```
TR_BY_TICKER_CONSOLIDATED/
├── cusip_ticker=AAPL/*.parquet
├── cusip_ticker=MSFT/*.parquet
└── ... (~32,000 ticker partitions, 334MB total)
```

---

## How to Run Benchmarks

```bash
# Start Postgres with pg_duckdb
bun run dev:db-up

# Start Hono API (port 4000)
bun run dev:api

# Start Bun Native SQL server (port 3006)
bun run api/bun-native-benchmark.ts

# Run API benchmarks
bun run scripts/benchmark-drivers.ts

# Run DuckDB native benchmark
bun run scripts/benchmark-duckdb-native.ts
```
