import { app } from "./index";

Bun.serve({
port: Number(process.env.API_PORT ?? 4000),
fetch: app.fetch,
});