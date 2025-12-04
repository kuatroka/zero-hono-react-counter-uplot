import { defineConfig } from "vite";
import dotenv from "dotenv";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";

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
    tsConfigPaths(),
    tanstackStart({
      srcDirectory: "app",
      spa: {
        enabled: true,
      },
    }),
    // React's vite plugin must come after TanStack Start's plugin
    viteReact(),
  ],
});
