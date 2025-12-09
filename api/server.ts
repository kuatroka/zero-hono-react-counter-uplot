import { app } from "./index";

const port = Number(process.env.API_PORT ?? 4000);
console.log(`API server starting on port ${port}`);

Bun.serve({
    port,
    fetch: app.fetch,
});