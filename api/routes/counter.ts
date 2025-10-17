import { Hono } from "hono";
import { sql } from "../db";

const counter = new Hono();

counter.get("/", async (c) => {
  try {
    const result = await sql`SELECT value FROM counters WHERE id = 'main'`;
    
    if (result.length === 0) {
      return c.json({ error: "Counter not found" }, 404);
    }
    
    return c.json({ value: result[0].value });
  } catch (error) {
    return c.json({ error: "Failed to fetch counter" }, 500);
  }
});

counter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { op } = body;
    
    if (op !== "inc" && op !== "dec") {
      return c.json({ error: "Invalid operation. Must be 'inc' or 'dec'" }, 400);
    }
    
    const delta = op === "inc" ? 1 : -1;
    
    const result = await sql`
      UPDATE counters 
      SET value = value + ${delta}
      WHERE id = 'main'
      RETURNING value
    `;
    
    if (result.length === 0) {
      return c.json({ error: "Counter not found" }, 404);
    }
    
    return c.json({ value: result[0].value });
  } catch (error) {
    return c.json({ error: "Failed to update counter" }, 500);
  }
});

export default counter;
