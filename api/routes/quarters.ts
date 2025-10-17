import { Hono } from "hono";
import { sql } from "../db";

const quarters = new Hono();

quarters.get("/", async (c) => {
  try {
    const result = await sql`
      SELECT quarter, value 
      FROM value_quarters 
      ORDER BY quarter ASC
    `;
    
    const labels = result.map((row) => row.quarter);
    const values = result.map((row) => row.value);
    
    return c.json({ labels, values });
  } catch (error) {
    return c.json({ error: "Failed to fetch quarterly data" }, 500);
  }
});

export default quarters;
