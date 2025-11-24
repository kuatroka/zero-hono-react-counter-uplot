import { Zero } from "@rocicorp/zero";
import { Schema } from "./schema";
import { queries } from "./zero/queries";

/**
 * Preload strategy inspired by ztunes:
 * - Preload windowed page data for instant browsing
 * - Preload search index (`searches` table) for instant local search
 * - Use 5-minute TTL for instant re-navigation
 */
export function preload(z: Zero<Schema>, { limit = 200 } = {}) {
  const TTL = "5m"; // Same as ztunes - allows instant re-navigation

  // Preload browsing data (windowed pagination)
  z.preload(queries.assetsPage(limit, 0), { ttl: TTL });
  z.preload(queries.superinvestorsPage(limit, 0), { ttl: TTL });

  // Preload search index for instant local search
  // Sorted alphabetically so local results are a valid prefix of full results
  z.preload(queries.searchesByCategory("assets", "", 1000), { ttl: TTL });
  z.preload(queries.searchesByCategory("superinvestors", "", 1000), { ttl: TTL });

  // Preload global search index (both categories combined)
  z.preload(queries.searchesByName("", 100), { ttl: TTL });

  // Other reference data
  z.preload(queries.listUsers(), { ttl: TTL });
  z.preload(queries.listMediums(), { ttl: TTL });
}

