// Static serving of the built SDD Builder frontend under /builder.
// SPA fallback: unknown paths serve index.html; missing build gets a hint.
//
// The UI now ships in the tarball (spec 011 R1). It used to be checkout-only,
// which meant using the builder required cloning the repository — the single
// biggest barrier this project had.
//
// Two homes, in priority order:
//   checkout : <repo>/builder/dist         — live, so development sees its edits
//   package  : <this file>/../builder-ui   — staged at prepack by
//              scripts/build-builder-ui.mjs, inside the existing files: ["dist"]

import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { getFrameworkLayout, getFrameworkRoot } from "@juanklagos/sdd-core";

const IS_CHECKOUT = getFrameworkLayout() === "repo";

function resolveBuilderDist(): string {
  const checkoutDist = path.join(getFrameworkRoot(), "builder", "dist");
  if (existsSync(path.join(checkoutDist, "index.html"))) {
    return checkoutDist;
  }
  // dist/static.js -> dist/builder-ui
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "builder-ui");
}

const BUILDER_DIST = resolveBuilderDist();
const BUILDER_UNAVAILABLE = IS_CHECKOUT
  ? "SDD Builder not built yet. Run: cd builder && npm install && npm run build"
  : [
      "The SDD Builder UI is missing from this install, which should not happen.",
      "Reinstall @juanklagos/sdd-mcp, or run it from a checkout:",
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
