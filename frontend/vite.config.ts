import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Standard Vite + React setup. The `@` alias keeps deep relative
// imports out of the codebase.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5173,
  },
});
