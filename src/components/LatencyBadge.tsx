import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Data flow types showing the full path: [Framework] → [Storage/Source]
 * 
 * TanStack DB flows:
 * - "tsdb-indexeddb": TanStack DB collection loaded from IndexedDB (persisted)
 * - "tsdb-memory": TanStack DB collection in-memory only (not persisted)
 * - "tsdb-api": TanStack DB collection fetched from API (DuckDB)
 * 
 * React Query flows:
 * - "rq-memory": React Query cache hit (in-memory)
 * - "rq-api": React Query fetched from API (DuckDB)
 * 
 * Legacy (for backwards compatibility):
 * - "memory", "indexeddb", "api", "unknown"
 */
export type DataFlow = 
  | "tsdb-indexeddb"  // TanStack DB ↔ IndexedDB
  | "tsdb-memory"     // TanStack DB ↔ in-memory
  | "tsdb-api"        // TanStack DB ↔ DuckDB API
  | "rq-memory"       // React Query ↔ in-memory cache
  | "rq-api"          // React Query ↔ DuckDB API
  | "memory"          // Legacy: generic memory
  | "indexeddb"       // Legacy: generic IndexedDB
  | "api"             // Legacy: generic API
  | "unknown";

// Keep old type for backwards compatibility
export type LatencySource = DataFlow;

export interface LatencyBadgeProps {
  latencyMs?: number | null;
  source?: DataFlow;
  className?: string;
}

function formatLatency(latencyMs: number) {
  if (latencyMs < 1) return `${latencyMs.toFixed(2)}ms`;
  if (latencyMs < 10) return `${latencyMs.toFixed(1)}ms`;
  return `${Math.round(latencyMs)}ms`;
}

function getLatencyTone(latencyMs: number): "good" | "warn" | "bad" {
  if (latencyMs <= 25) return "good";
  if (latencyMs <= 150) return "warn";
  return "bad";
}

function labelForSource(source: DataFlow): string {
  switch (source) {
    case "tsdb-indexeddb":
      return "TanStack DB → IndexedDB";
    case "tsdb-memory":
      return "TanStack DB → memory";
    case "tsdb-api":
      return "TanStack DB → API";
    case "rq-memory":
      return "React Query → cache";
    case "rq-api":
      return "React Query → API";
    case "memory":
      return "memory";
    case "indexeddb":
      return "IndexedDB";
    case "api":
      return "API";
    default:
      return "unknown";
  }
}

function getSourceCategory(source: DataFlow): "local" | "cache" | "api" | "unknown" {
  switch (source) {
    case "tsdb-indexeddb":
    case "indexeddb":
      return "local";
    case "tsdb-memory":
    case "rq-memory":
    case "memory":
      return "cache";
    case "tsdb-api":
    case "rq-api":
    case "api":
      return "api";
    default:
      return "unknown";
  }
}

export function LatencyBadge({ latencyMs, source = "unknown", className }: LatencyBadgeProps) {
  if (latencyMs == null || Number.isNaN(latencyMs)) return null;

  const tone = getLatencyTone(latencyMs);
  const category = getSourceCategory(source);

  const toneClasses =
    tone === "good"
      ? "ring-emerald-500/30"
      : tone === "warn"
        ? "ring-amber-500/30"
        : "ring-rose-500/30";

  // Color by category: local (violet), cache (emerald), api (sky)
  const sourceClasses =
    category === "local"
      ? "bg-violet-50 text-violet-700 border-violet-200"
      : category === "cache"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : category === "api"
          ? "bg-sky-50 text-sky-700 border-sky-200"
          : "bg-muted text-muted-foreground border-border";

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-1.5 py-0.5 font-medium border inline-flex items-center gap-1",
        "ring-1",
        toneClasses,
        sourceClasses,
        className
      )}
    >
      <span>{formatLatency(latencyMs)}</span>
      <span className="opacity-70">({labelForSource(source)})</span>
    </Badge>
  );
}
