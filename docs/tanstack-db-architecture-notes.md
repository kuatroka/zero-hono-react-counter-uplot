# TanStack DB Architecture Notes

## 1. IndexedDB vs localStorage

### IndexedDB
- **Type**: Browser-native NoSQL object store (key–value stores with indexes, transactions).
- **Data model**: Stores complex JS objects (via structured clone) and binary data (Blobs, ArrayBuffers).
- **Capacity**: Much larger (hundreds of MB to GB, subject to quota). Suitable for large datasets like tens/hundreds of thousands of rows.
- **API**: Asynchronous, transactional; low-level and verbose, usually wrapped by libraries (Dexie) or frameworks (TanStack DB adapters).
- **Use cases**: Local-first apps, offline caches, large analytic datasets, search indexes, reference tables.

### localStorage
- **Type**: Simple synchronous key–value store (string → string).
- **Data model**: Only strings; objects must be JSON-encoded/decoded manually.
- **Capacity**: Small (typically 5–10MB per origin).
- **API**: Synchronous (`getItem`, `setItem`), easy but blocks main thread.
- **Use cases**: Small config, feature flags, simple user preferences, tokens. Not appropriate for large chart/table datasets.

**Implication for this app**: IndexedDB (likely via TanStack DB’s first-party adapters) is the right choice for large local datasets (assets, search index, reference tables). localStorage is only for small settings/preferences.

---

## 2. What TanStack DB Actually Does (and Does Not Do)

### What TanStack DB *is*
- A **client-side reactive data layer** built around:
  - **Collections**: typed buckets of data (e.g. `assets`, `superinvestors`, `searches`).
  - **Queries**: `useLiveQuery` that lets components declare what data they need.
  - **Sync modes**: `eager`, `on-demand`, `progressive` to control how/when data is loaded.
  - **Mutations** and **optimistic updates** with optional offline support.
  - **Reactivity**: when collection contents change, all subscribers react automatically.

From the docs and blog posts (e.g. "TanStack DB 0.5 — Query-Driven Sync"):
- In **on-demand mode**, your component query effectively "becomes the API call".
- In **eager mode**, collections sync everything during preload.
- In **progressive mode**, they load just the subset needed for the first paint, then hydrate the full dataset in the background.

### What TanStack DB *is not*
- It is **not itself a physical database engine** like Postgres, DuckDB, or SQLite.
- It does **not embed a native SQLite or Postgres engine** into the browser by default.
- It does **not own storage** directly; instead it plugs into storage backends via adapters.
- It does **not mandate** a specific persistence mechanism (could be in-memory, localStorage, IndexedDB, or a custom engine).

### Storage and adapters
- Under the hood, TanStack DB is designed to work across environments:
  - Browsers: in-memory, localStorage, IndexedDB.
  - Node/Bun/Deno: in-memory, file-based, SQLite/PGlite through adapters.
- It uses **storage adapters** that implement a simple read/write/transaction interface. Examples:
  - First-party **localStorage collection options**.
  - First-party **offline-transaction adapters** (IndexedDB, localStorage) in `@tanstack/offline-transactions`.
  - Custom adapters for other engines (e.g. Dexie, PGlite, ElectricSQL), often maintained by the community.

**Key mental model**:
> TanStack DB = queryable, reactive client-side data & sync engine. Storage (IndexedDB, localStorage, SQLite, etc.) is plugged in underneath via adapters.

---

## 3. TanStack DB vs Zero Sync

### Zero Sync (in this project)
- Designed to **sync server-side tables into the browser automatically**.
- In your case, attempting to sync the full **111M-row asset detail table** caused problems:
  - Zero Sync tried to sync too much data by default.
  - Browser + network + memory couldnt handle it (crashes / unusable behavior).
- Less fine-grained control over *what* should be synced eagerly vs on-demand.

### TanStack DB
- Gives **per-collection control over sync strategy**:
  - For **dimension/lookup tables** (assets, search index, superinvestors):
    - Use `eager` or `progressive` sync; keep them in the browser for instant lookups.
  - For **large fact tables** (111M detail rows):
    - Use `on-demand` only; queries hit the server (DuckDB/Postgres) and return only scoped slices.
- Encourages a design where:
  - Components always query **collections** (`useLiveQuery`).
  - Collections decide **when to hit the backend** and **how to cache**.

**Difference in philosophy**:
- **Zero Sync**: "Sync whole tables / schemas to the browser and keep them mirrored."
- **TanStack DB**: "Declare what the UI needs; collections + sync modes decide how much to load and when."

For this app, TanStack DB allows you to:
- Keep **big analytical tables (111M rows)** server-side, only fetching filtered/aggregated slices.
- Eager/progressively sync **smaller index/lookup tables** into the browser for instant cross-linking and search.

---

## 4. Why You Might Still Consider a WASM SQL Engine (PGlite / SQLite WASM / DuckDB WASM)

Even with TanStack DB doing client-side caching and reactivity, you might still want a **client-side SQL engine** for:
- Very rich, ad-hoc analytics that are awkward to express as TanStack DB queries.
- Complex joins, group-bys, window functions performed locally.
- True "data cube in the browser" behavior.

### PGlite (WASM Postgres)
- A **WebAssembly build of Postgres** (from ElectricSQL).
- Runs Postgres in the browser/Node/Bun without a server.
- Approximated size:
  - Docs and ecosystem resources suggest **under ~3MB gzipped** for the WASM bundle + FS.
- Benefits:
  - Full Postgres SQL in the browser.
  - Can mirror a subset of your Postgres/DuckDB schema locally.
- Costs:
  - Additional ~2.53MB download per user.
  - Need to design client-side schema + sync strategy.

### SQLite WASM (e.g. sql.js, official sqlite-wasm)
- SQLite compiled to WebAssembly for browser use.
- Typical bundles (depending on configuration) are in the **~1.52MB gzipped** range.
- Benefits:
  - Simple, embeddable SQL engine.
  - Good for local analytics and ad-hoc querying of synced tables.
- Costs:
  - Still a non-trivial WASM payload.
  - Need schema and sync bootstrapping.

### DuckDB WASM
- WebAssembly version of **DuckDB**, optimized for analytical workloads.
- DuckDB docs and repos indicate typical bundles roughly **~23MB gzipped**, with some extensions loaded lazily.
- Benefits:
  - Analytical SQL engine designed for OLAP.
  - Reads Parquet/CSV/Arrow in the browser.
- Costs:
  - Similar payload to PGlite.
  - Need a strategy to sync or import data (e.g. HTTP, Parquet from object storage).

**Trade-offs**:
- **TanStack DB only**:
  - Lighter bundles, simpler architecture.
  - Good fit for: reference tables, pre-aggregated results, search indexes, moderate-size data.
- **TanStack DB + WASM SQL engine**:
  - Heavier bundles (~23MB extra) but richer local analytics.
  - Good fit for: very complex analytics, flexible pivoting, heavy cross-table queries entirely in-browser.

In your case, a reasonable progression is:
1. Use TanStack DB collections + first-party persistence (IndexedDB/localStorage) for most needs.
2. Keep heavy fact-table analytics on the server (DuckDB/Postgres) with well-designed APIs.
3. Introduce a WASM SQL engine (PGlite/SQLite/DuckDB WASM) later only if you truly need richer client-side analytics than TanStack DB + backend DuckDB can comfortably support.

---

## 5. Summary of What TanStack DB Does vs These Other Pieces

- **TanStack DB**
  - Manages **client-side collections**, queries, mutations, and sync modes.
  - Keeps the UI **reactive**: components subscribe via `useLiveQuery`.
  - Delegates persistence to **storage adapters** (in-memory, localStorage, IndexedDB, custom engines).
  - Talks to **your APIs** (Hono routes over DuckDB/Postgres) to fetch and mutate data.

- **IndexedDB vs localStorage**
  - IndexedDB: large, asynchronous, structured storage. Suited for big datasets.
  - localStorage: small, synchronous string store for small config/preferences.

- **Zero Sync**
  - Tried to sync **entire tables** into the browser.
  - Failed when used against massive tables (111M rows) because the sync scope was too broad.
  - Less explicit control per domain over what is synced eagerly vs on-demand.

- **WASM SQL engines (PGlite, SQLite WASM, DuckDB WASM)**
  - Provide **full SQL engines in the browser**.
  - Add ~1.53MB gzipped to your JS payload.
  - Best used when you truly need advanced, local analytical queries beyond what TanStack DB + server-side DuckDB can provide.

For this project, an architectural sweet spot is:
- Use **TanStack DB** as the main client data router for collections (assets, search index, superinvestors, mid-size aggregates), with **IndexedDB-based persistence** where needed.
- Keep massive fact tables (111M-row asset details, etc.) **server-side only**, queried on-demand via DuckDB.
- Consider adding a **WASM SQL engine** later only if you need significantly more client-side query flexibility.
