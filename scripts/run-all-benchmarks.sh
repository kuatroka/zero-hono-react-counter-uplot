#!/bin/bash

# Performance Benchmarking Suite
# Run all benchmarks and generate comprehensive performance report

set -e

echo "🏁 Performance Benchmarking Suite"
echo "=================================="
echo ""

# Check if server is running
echo "Checking if API server is running on port 4000..."
if ! curl -s http://localhost:4000/api/assets > /dev/null 2>&1; then
    echo "❌ API server not running!"
    echo "Please start the server with: bun run dev"
    exit 1
fi
echo "✅ API server is running"
echo ""

# 1. API Endpoint Benchmarks
echo "═══════════════════════════════════════════════════════"
echo "1️⃣  Running API Endpoint Benchmarks"
echo "═══════════════════════════════════════════════════════"
echo ""
bun run scripts/benchmark-api-endpoints.ts
echo ""

# 2. Chart Rendering Benchmarks
echo "═══════════════════════════════════════════════════════"
echo "2️⃣  Running Chart Rendering Benchmarks"
echo "═══════════════════════════════════════════════════════"
echo ""
timeout 180 bun run scripts/run-chart-benchmark.ts || true
echo ""

# 3. DuckDB Native Benchmarks (optional)
if [ -f "scripts/benchmark-duckdb-native.ts" ]; then
    echo "═══════════════════════════════════════════════════════"
    echo "3️⃣  Running DuckDB Native Benchmarks"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    bun run scripts/benchmark-duckdb-native.ts
    echo ""
fi

echo "═══════════════════════════════════════════════════════"
echo "✅ All Benchmarks Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📊 Results saved to: docs/PERFORMANCE-BENCHMARKS-$(date +%Y-%m-%d).md"
echo ""
echo "To run individual benchmarks:"
echo "  • API endpoints:      bun run scripts/benchmark-api-endpoints.ts"
echo "  • Chart rendering:    bun run scripts/run-chart-benchmark.ts"
echo "  • DuckDB native:      bun run scripts/benchmark-duckdb-native.ts"
echo ""
