// Static serving of the built SDD Builder frontend under /builder.
// SPA fallback: unknown paths serve index.html; missing build gets a hint.
//
// The builder frontend is checkout-only by design: it is not bundled in the
// npm tarball, so an npm-installed server says so instead of 404-ing silently.

import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { getFrameworkLayout, getFrameworkRoot } from "@juanklagos/sdd-core";

const IS_CHECKOUT = getFrameworkLayout() === "repo";
const BUILDER_DIST = path.join(getFrameworkRoot(), "builder", "dist");
const BUILDER_UNAVAILABLE = IS_CHECKOUT
  ? "SDD Builder not built yet. Run: cd builder && npm install && npm run build"
  : [
      "The SDD Builder UI is not part of the npm package (checkout-only by design).",
      "Clone https://github.com/juanklagos/spec-driven-development-template, then run:",
      "  cd builder && npm install && npm run build && npm run mcp:http:start",
      "The MCP tools, resources and /dashboard work normally without it."
    ].join("\n");
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
  ".woff2": "font/woff2"
};

export async function serveBuilder(res: http.ServerResponse, pathname: string): Promise<void> {
  const rel = pathname.replace(/^\/builder\/?/, "") || "index.html";
  const filePath = path.normalize(path.join(BUILDER_DIST, rel));
  if (!filePath.startsWith(BUILDER_DIST)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, { "content-type": MIME[path.extname(filePath)] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    try {
      const index = await fs.readFile(path.join(BUILDER_DIST, "index.html"));
      res.writeHead(200, { "content-type": MIME[".html"] });
      res.end(index);
    } catch {
      res.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
      res.end(BUILDER_UNAVAILABLE);
    }
  }
}
