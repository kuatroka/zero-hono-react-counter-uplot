import { defineConfig } from "vite";
import dotenv from "dotenv";

if (process.env.NODE_ENV === "development") {
  dotenv.config();
}

export default defineConfig({
  server: {
    port: 3003,
    proxy: { "/api": "http://localhost:4000" },
  },
  build: {
    target: "es2022",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "es2022",
    },
  },
  plugins: [
 
  ],
});
