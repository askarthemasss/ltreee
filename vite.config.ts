import { resolve } from "node:path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  css: { transformer: "lightningcss" },
  resolve: {
    alias: { "@": resolve(process.cwd(), "src") },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ],
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
      // Use src/server.ts as the SSR entry (the error-handling wrapper).
      server: { entry: "server" },
    }),
    ...(command === "build" ? [nitro({ defaultPreset: "cloudflare-module" })] : []),
    viteReact(),
  ],
  server: {
    host: "::",
    port: 8080,
  },
}));
