import { Hono } from "hono";
import { withValidation } from "@rocicorp/zero";
import { handleGetQueriesRequest } from "@rocicorp/zero/server";
import { queries } from "../../../src/zero/queries.ts";
import { schema } from "../../../src/schema.ts";

type ValidatedQuery = ReturnType<typeof withValidation>;

const validatedQueries = new Map<string, ValidatedQuery>(
  Object.values(queries).map((query) => [query.queryName, withValidation(query)])
);

const zeroRoutes = new Hono();

zeroRoutes.post("/get-queries", async (c) => {
  try {
    const response = await handleGetQueriesRequest(
      (name, args) => {
        const query = validatedQueries.get(name);
        if (!query) {
          throw new Error(`Query not found: ${name}`);
        }
        return { query: query(undefined, ...args) };
      },
      schema,
      c.req.raw
    );

    return c.json(response);
  } catch (error) {
    console.error("/api/zero/get-queries error", error);
    return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 400);
  }
});

export default zeroRoutes;
