import { readFile } from "fs/promises";
import { join } from "path";
import dotenv from "dotenv";

// Load local .env so we can see APP_DATA_PATH / SEARCH_INDEX_PATH
dotenv.config();

function resolveSearchIndexPath(): string {
  const raw = process.env.SEARCH_INDEX_PATH;
  if (raw && raw.length > 0) {
    return raw.replace(/\$\{([^}]+)\}/g, (_, name) => process.env[name] ?? "");
  }
  const appData = process.env.APP_DATA_PATH;
  if (!appData) {
    throw new Error("APP_DATA_PATH or SEARCH_INDEX_PATH must be set");
  }
  return join(appData, "TR_05_DB", "TR_05_WEB_SEARCH_INDEX", "search_index.json");
}

interface SearchResult {
  id: number;
  cusip: string | null;
  code: string;
  name: string | null;
  category: string;
}

interface SearchIndexJson {
  codeExact: Record<string, number[]>;
  codePrefixes: Record<string, number[]>;
  namePrefixes: Record<string, number[]>;
  items: Record<string, SearchResult>;
  metadata?: {
    totalItems: number;
    generatedAt?: string;
  };
}

async function benchmarkPrecomputedIndex(path: string) {
  const start = performance.now();

  const readStart = performance.now();
  const buf = await readFile(path, "utf-8");
  const readEnd = performance.now();

  const parseStart = performance.now();
  const data: SearchIndexJson = JSON.parse(buf);
  const parseEnd = performance.now();

  const total = parseEnd - start;
  const readMs = readEnd - readStart;
  const parseMs = parseEnd - parseStart;
  const sizeMb = Buffer.byteLength(buf, "utf-8") / (1024 * 1024);

  console.log("=== Precomputed index load ===");
  console.log(`file: ${path}`);
  console.log(`size: ${sizeMb.toFixed(2)} MB`);
  console.log(
    `total: ${total.toFixed(1)} ms (read: ${readMs.toFixed(1)} ms, parse: ${parseMs.toFixed(1)} ms)`
  );
  console.log(`items: ${data.metadata?.totalItems ?? Object.keys(data.items).length}`);

  return data;
}

function runtimeBuildIndex(items: SearchResult[]) {
  const start = performance.now();

  const codeExact: Record<string, number[]> = {};
  const codePrefixes: Record<string, number[]> = {};
  const namePrefixes: Record<string, number[]> = {};

  for (const item of items) {
    if (!item || !item.code) continue;

    const id = item.id;
    const lowerCode = item.code.toLowerCase();
    const lowerName = (item.name || "").toLowerCase();

    if (!codeExact[lowerCode]) codeExact[lowerCode] = [];
    codeExact[lowerCode].push(id);

    for (let i = 1; i <= Math.min(lowerCode.length, 10); i++) {
      const prefix = lowerCode.slice(0, i);
      if (!codePrefixes[prefix]) codePrefixes[prefix] = [];
      codePrefixes[prefix].push(id);
    }

    if (lowerName) {
      for (let i = 1; i <= Math.min(lowerName.length, 10); i++) {
        const prefix = lowerName.slice(0, i);
        if (!namePrefixes[prefix]) namePrefixes[prefix] = [];
        namePrefixes[prefix].push(id);
      }
    }
  }

  const elapsed = performance.now() - start;

  return {
    elapsed,
    codeExactCount: Object.keys(codeExact).length,
    codePrefixesCount: Object.keys(codePrefixes).length,
    namePrefixesCount: Object.keys(namePrefixes).length,
  };
}

async function main() {
  const indexPath = resolveSearchIndexPath();
  console.log("Resolved SEARCH_INDEX_PATH:", indexPath);

  const index = await benchmarkPrecomputedIndex(indexPath);
  const items: SearchResult[] = Object.values(index.items);

  const { elapsed, codeExactCount, codePrefixesCount, namePrefixesCount } = runtimeBuildIndex(items);

  console.log("\n=== Runtime index build (simulated) ===");
  console.log(`items: ${items.length}`);
  console.log(`total build time: ${elapsed.toFixed(1)} ms`);
  console.log(
    `map sizes: codeExact=${codeExactCount}, codePrefixes=${codePrefixesCount}, namePrefixes=${namePrefixesCount}`
  );
}

main().catch((err) => {
  console.error("Benchmark failed", err);
  process.exit(1);
});
