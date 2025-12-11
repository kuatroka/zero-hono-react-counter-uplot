#!/usr/bin/env python3
"""Generate pre-computed search index for sub-millisecond browser search.

This script reads the ``searches`` table from DuckDB and generates a JSON index
file that can be served by the API for instant loading in the browser.

Usage::

    python scripts/generate-search-index.py

Requires env vars (from shared .env files):

    - ``DUCKDB_PATH`` **or** ``TR_05_DUCKDB_FILE`` (path to DuckDB file)
    - ``SEARCH_INDEX_PATH`` (full path to ``search_index.json``)
"""

import json
import os
import time
from collections import defaultdict
from pathlib import Path

# Try to load from .env files (frontend/backend + data pipeline)
try:
    from dotenv import load_dotenv

    # Local project .env (frontend/backend)
    load_dotenv()

    # Data pipeline .env (dagster) so vars are interchangeable on the VPS
    load_dotenv("/Users/yo_macbook/Documents/dev/sec_app/dagster_sec_app/.env")
except ImportError:
    # If python-dotenv is not installed, rely on process environment
    pass


def generate_search_index(db_path: str, index_path: str) -> str:
    """Generate a pre-computed search index JSON file from the ``searches`` table.

    Args:
        db_path: Path to the DuckDB database file.
        index_path: Full path to the JSON index file to write
            (for example ``/app_data/TR_05_DB/TR_05_WEB_SEARCH_INDEX/search_index.json``).

    The resulting index enables O(1) prefix lookups in the browser instead of
    O(n) filtering, reducing per-query latency from ~10ms to well under 1ms
    even for 50k+ items.
    """
    import duckdb
    
    t_start = time.perf_counter()
    
    # Ensure output directory exists
    index_path_obj = Path(index_path)
    index_dir = index_path_obj.parent
    index_dir.mkdir(parents=True, exist_ok=True)
    
    # Connect to DuckDB and fetch all search data
    print(f"[SearchIndex] Connecting to DuckDB: {db_path}")
    con = duckdb.connect(database=str(db_path), read_only=True)
    
    rows = con.execute("""
        SELECT id, cusip, code, name, category
        FROM searches
        ORDER BY id
    """).fetchall()
    
    con.close()
    
    print(f"[SearchIndex] Loaded {len(rows)} rows from searches table")
    
    # Build index structures
    code_exact = defaultdict(list)      # exact code -> [ids]
    code_prefixes = defaultdict(list)   # code prefix -> [ids]
    name_prefixes = defaultdict(list)   # name prefix -> [ids]
    items = {}                          # id -> item data
    
    for row in rows:
        item_id, cusip, code, name, category = row
        
        if not code:
            continue
        
        # Store item data
        items[item_id] = {
            "id": item_id,
            "cusip": cusip or "",
            "code": code,
            "name": name or "",
            "category": category
        }
        
        lower_code = code.lower()
        lower_name = (name or "").lower()
        
        # Index exact code
        code_exact[lower_code].append(item_id)
        
        # Index code prefixes (up to 10 chars)
        for i in range(1, min(len(lower_code), 10) + 1):
            prefix = lower_code[:i]
            code_prefixes[prefix].append(item_id)
        
        # Index name prefixes (up to 10 chars)
        if lower_name:
            for i in range(1, min(len(lower_name), 10) + 1):
                prefix = lower_name[:i]
                name_prefixes[prefix].append(item_id)
    
    # Convert to regular dicts for JSON serialization
    index_data = {
        "codeExact": dict(code_exact),
        "codePrefixes": dict(code_prefixes),
        "namePrefixes": dict(name_prefixes),
        "items": items,
        "metadata": {
            "totalItems": len(items),
            "generatedAt": time.strftime("%Y-%m-%d %H:%M:%S")
        }
    }
    
    # Write to JSON file
    output_path = index_path_obj
    with open(output_path, "w") as f:
        json.dump(index_data, f, separators=(",", ":"))  # Compact JSON
    
    file_size_mb = output_path.stat().st_size / (1024 * 1024)
    elapsed = time.perf_counter() - t_start
    
    print(f"[SearchIndex] Generated index in {elapsed:.2f}s")
    print(f"[SearchIndex] Output: {output_path} ({file_size_mb:.2f} MB)")
    print(f"[SearchIndex] Index stats: {len(code_exact)} exact codes, {len(code_prefixes)} code prefixes, {len(name_prefixes)} name prefixes")
    
    return str(output_path)


if __name__ == "__main__":
    # Get paths from environment (shared between pipeline and web app)
    raw_duckdb_path = os.getenv("DUCKDB_PATH") or os.getenv("TR_05_DUCKDB_FILE")
    raw_search_index_path = os.getenv("SEARCH_INDEX_PATH")

    if not raw_duckdb_path:
        print("Error: DUCKDB_PATH or TR_05_DUCKDB_FILE environment variable not set")
        print("Set it in .env or export it, for example:")
        print("  export DUCKDB_PATH=/path/to/TR_05_DUCKDB_FILE.duckdb")
        exit(1)

    if not raw_search_index_path:
        print("Error: SEARCH_INDEX_PATH environment variable not set")
        print("Set it in .env or export it, for example:")
        print("  export SEARCH_INDEX_PATH=/app_data/TR_05_DB/TR_05_WEB_SEARCH_INDEX/search_index.json")
        exit(1)

    # Allow ${APP_DATA_PATH} and friends in paths
    duckdb_path = os.path.expandvars(raw_duckdb_path)
    search_index_path = os.path.expandvars(raw_search_index_path)

    print(f"DUCKDB_PATH (resolved): {duckdb_path}")
    print(f"SEARCH_INDEX_PATH (resolved): {search_index_path}")
    print()

    generate_search_index(duckdb_path, search_index_path)
