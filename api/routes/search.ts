import { Hono } from "hono";
import { sql } from "../db";

const search = new Hono();

search.get("/", async (c) => {
  const query = c.req.query("q");

  if (!query || query.length < 2) {
    return c.json([]);
  }

  try {
    const result = await sql`
      SELECT 
        id, 
        name, 
        category, 
        description, 
        value, 
        created_at,
        similarity_score
      FROM search_entities(${query}, 5)
    `;

    return c.json(result);
  } catch (error) {
    console.error("Search error:", error);
    return c.json({ error: "Search failed" }, 500);
  }
});

export default search;
