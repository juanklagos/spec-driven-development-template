import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The build is served by packages/sdd-mcp/src/http.ts under /builder,
// so every asset URL must resolve below that prefix.
export default defineConfig({
  base: "/builder/",
  plugins: [react()],
  server: {
    // In dev, forward API calls to the sdd-mcp HTTP server.
    proxy: {
      "/api": "http://127.0.0.1:3334"
    }
  }
});
