import { escapeLike, syncedQuery } from "@rocicorp/zero";
import { z } from "zod";
import { builder } from "../schema";

export const queries = {
  listUsers: syncedQuery("users.list", z.tuple([]), () =>
    builder.user.orderBy("name", "asc")
  ),
  listMediums: syncedQuery("mediums.list", z.tuple([]), () =>
    builder.medium.orderBy("name", "asc")
  ),
  messagesFeed: syncedQuery(
    "messages.feed",
    z.tuple([z.string().nullable(), z.string().max(500)]),
    (senderId, rawSearch) => {
      const search = rawSearch.trim();
      let query = builder.message
        .related("medium")
        .related("sender")
        .orderBy("timestamp", "desc");

      if (senderId) {
        query = query.where("senderID", "=", senderId);
      }

      if (search) {
        query = query.where("body", "LIKE", `%${escapeLike(search)}%`);
      }

      return query;
    }
  ),
  entitiesByCategory: syncedQuery(
    "entities.byCategory",
    z.tuple([
      z.enum(["all", "investor", "asset"]),
      z.number().int().positive().max(1000),
    ]),
    (category, limit) => {
      const base = builder.entities.orderBy("name", "asc");
      if (category === "all") {
        return base.limit(limit);
      }
      return base.where("category", "=", category).limit(limit);
    }
  ),
  entityById: syncedQuery(
    "entities.byId",
    z.tuple([z.string().min(1)]),
    (entityId) => builder.entities.where("id", "=", entityId).limit(1)
  ),
  searchEntities: syncedQuery(
    "entities.search",
    z.tuple([z.string(), z.number().int().min(0).max(50)]),
    (rawSearch, limit) => {
      const search = rawSearch.trim();
      const base = builder.entities.orderBy("created_at", "desc");
      if (!search) {
        return base.limit(limit);
      }
      return base
        .where("name", "ILIKE", `%${escapeLike(search)}%`)
        .limit(limit);
    }
  ),
  recentEntities: syncedQuery(
    "entities.recent",
    z.tuple([z.number().int().positive().max(500)]),
    (limit) => builder.entities.orderBy("created_at", "desc").limit(limit)
  ),
  counterCurrent: syncedQuery(
    "counter.current",
    z.tuple([z.string()]),
    (id) => builder.counters.where("id", "=", id).limit(1)
  ),
  quartersSeries: syncedQuery(
    "quarters.series",
    z.tuple([]),
    () => builder.value_quarters.orderBy("quarter", "asc")
  ),
  userCounter: syncedQuery(
    "user_counter.current",
    z.tuple([z.string()]),
    (userId) => builder.user_counters.where("userId", "=", userId).limit(1)
  ),
  searchesByCategory: syncedQuery(
    "searches.byCategory",
    z.tuple([
      z.enum(["all", "superinvestors", "assets", "periods"]),
      z.number().int().min(0).max(1000),
    ]),
    (category, limit) => {
      const base = builder.searches.orderBy("name", "asc");
      if (category === "all") {
        return base.limit(limit);
      }
      return base.where("category", "=", category).limit(limit);
    }
  ),
  searchesByName: syncedQuery(
    "searches.byName",
    z.tuple([z.string(), z.number().int().min(0).max(100)]),
    (rawSearch, limit) => {
      const search = rawSearch.trim();
      const base = builder.searches.orderBy("name", "asc");
      if (!search) {
        return base.limit(limit);
      }
      // Treat purely numeric input as a code (e.g. "7195"),
      // everything else is assumed to be a name fragment.
      const isCodeLike = /^[0-9]+$/.test(search);
      if (isCodeLike) {
        return base
          .where("code", "ILIKE", `%${escapeLike(search)}%`)
          .limit(limit);
      }
      return base
        .where("name", "ILIKE", `%${escapeLike(search)}%`)
        .limit(limit);
    }
  ),
  searchById: syncedQuery(
    "searches.byId",
    z.tuple([z.number().int()]),
    (id) => builder.searches.where("id", "=", id).limit(1)
  ),
  searchByCode: syncedQuery(
    "searches.byCode",
    z.tuple([z.string().min(1)]),
    (code) => builder.searches.where("code", "=", code).limit(1)
  ),
} as const;

type QueryMap = typeof queries;
export type SyncedQueryName = QueryMap[keyof QueryMap]["queryName"];
