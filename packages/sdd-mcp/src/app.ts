// MCP App registration for the SDD board (spec 006, R5).
//
// Implements the MCP Apps extension (SEP-1865, first official MCP extension,
// spec revision 2026-01-26, part of the 2026-07-28 protocol release) using
// the official SDK: @modelcontextprotocol/ext-apps.
//
//   - ui://sdd/board.html   self-contained HTML view (app-ui.ts)
//   - sdd_board_app         tool linked to the view via _meta.ui.resourceUri;
//                           returns board + gate data from the same sdd-core
//                           layer used by /builder, the REST API and the
//                           other MCP tools.
//
// The view needs the official App bridge (JSON-RPC over postMessage) to
// receive the tool result and to power the refresh button. The SDK ships it
// as a dependency-free ESM bundle (export "./app-with-deps"); since ui://
// resources must be self-contained (no CDNs), we inline that bundle at
// resource-read time, rewriting its single trailing `export{...}` statement
// into a `globalThis.__MCP_EXT_APPS__ = {...}` assignment so a second inline
// module script can use it (inline scripts cannot import bare specifiers).

import { promises as fs } from "node:fs";
import { createRequire } from "node:module";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
  registerAppTool
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { getBoardView, getGateSummary } from "@juanklagos/sdd-core";
import { BOARD_APP_RESOURCE_URI, renderBoardAppHtml } from "./app-ui.js";
import { boardViewSchema, gateSummarySchema, projectRootSchema } from "./schemas.js";

const BRIDGE_SPECIFIER = "@modelcontextprotocol/ext-apps/app-with-deps";

let bridgeScriptPromise: Promise<string> | undefined;

async function loadBridgeScript(): Promise<string> {
  bridgeScriptPromise ??= (async () => {
    const require = createRequire(import.meta.url);
    const bundlePath = require.resolve(BRIDGE_SPECIFIER);
    const source = await fs.readFile(bundlePath, "utf8");
    return inlineEsmExports(source);
  })();
  return bridgeScriptPromise;
}

/**
 * Rewrite the single trailing `export{a as B,...};` statement of the
 * ext-apps browser bundle into a `globalThis.__MCP_EXT_APPS__` assignment.
 *
 * Exported for the integration test. Fails loudly (never silently ships a
 * broken view) if a future bundle changes shape — see the note in
 * specs/006-visual-spec-builder/history.md about the 2026-07-28 release.
 */
export function inlineEsmExports(source: string): string {
  const match = /export\s*\{([^{}]*)\}\s*;?\s*$/.exec(source);
  if (!match) {
    throw new Error(
      `Could not inline ${BRIDGE_SPECIFIER}: no trailing export statement found. ` +
        "The bundle shape changed upstream; adjust inlineEsmExports in packages/sdd-mcp/src/app.ts."
    );
  }
  const entries = match[1]
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const aliased = /^(\S+)\s+as\s+(\S+)$/.exec(entry);
      return aliased ? `${aliased[2]}:${aliased[1]}` : `${entry}:${entry}`;
    });
  if (!entries.some((entry) => entry.startsWith("App:"))) {
    throw new Error(
      `Could not inline ${BRIDGE_SPECIFIER}: the bundle no longer exports "App". ` +
        "Adjust inlineEsmExports in packages/sdd-mcp/src/app.ts."
    );
  }
  return `${source.slice(0, match.index)}globalThis.__MCP_EXT_APPS__={${entries.join(",")}};`;
}

export function registerSddBoardApp(server: McpServer): void {
  registerAppResource(
    server,
    "SDD Board App",
    BOARD_APP_RESOURCE_URI,
    {
      description:
        "Read-only visual SDD board for MCP Apps hosts: spec cards with status and task progress, " +
        "connections, gate semaphore and dependency warnings. / Vista de solo lectura del board SDD."
    },
    async () => ({
      contents: [
        {
          uri: BOARD_APP_RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: renderBoardAppHtml(await loadBridgeScript())
        }
      ]
    })
  );

  registerAppTool(
    server,
    "sdd_board_app",
    {
      title: "Show SDD board",
      description:
        "Show the visual SDD board inside the client (MCP Apps): spec cards with approval status and " +
        "task progress, board connections, the gate semaphore and dependency warnings. Read-only view; " +
        "hosts without MCP Apps support get the same data as JSON text.",
      inputSchema: {
        projectRoot: projectRootSchema
      },
      outputSchema: {
        projectRoot: z.string(),
        board: boardViewSchema,
        gate: gateSummarySchema
      },
      _meta: { ui: { resourceUri: BOARD_APP_RESOURCE_URI } }
    },
    async ({ projectRoot }) => {
      const [board, gate] = await Promise.all([getBoardView(projectRoot), getGateSummary(projectRoot)]);
      // A closed gate is data for the view, not a tool failure: never isError.
      const result = { projectRoot, board, gate };
      return {
        structuredContent: JSON.parse(JSON.stringify(result)) as Record<string, unknown>,
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );
}
