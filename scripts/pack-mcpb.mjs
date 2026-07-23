#!/usr/bin/env node
// Packages the stdio MCP server as a .mcpb desktop extension.
//
// Spec 011 R7. A .mcpb is the only install path that removes the last
// prerequisite the npx launcher cannot remove: Claude Desktop ships its own
// Node, so the user needs nothing installed. Double click, and it is there.
//
// The bundle is built from the PUBLISHED npm package, not from this checkout.
// That is deliberate: it is exactly what a user gets, so a packaging bug that
// only exists in the tarball (the class of bug spec 011 R1 was born from)
// cannot hide behind local files that would never ship.
//
// Empaqueta el servidor MCP stdio como extensión de escritorio .mcpb.
// Se construye desde el paquete npm publicado, no desde este checkout: es
// exactamente lo que recibe una persona usuaria.
//
// Usage / Uso:
//   node scripts/pack-mcpb.mjs [version] [--out <dir>]
//
// The result is NOT verified by packing alone — run scripts/probe-mcpb-stdio.mjs
// against it, then install it in the host to check the ui:// view renders.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");

const args = process.argv.slice(2);
const outIndex = args.indexOf("--out");
const outDir = outIndex >= 0 ? path.resolve(args[outIndex + 1]) : path.join(REPO_ROOT, "build", "mcpb");
const versionArg = args.find((value) => !value.startsWith("--") && value !== args[outIndex + 1]);

const ENTRY_REL = "server/node_modules/@juanklagos/sdd-mcp/dist/index.js";

function run(command, cmdArgs, cwd) {
  return execFileSync(command, cmdArgs, { cwd, encoding: "utf8" });
}

async function resolveVersion() {
  if (versionArg) return versionArg;
  const pkg = JSON.parse(await readFile(path.join(REPO_ROOT, "packages/sdd-mcp/package.json"), "utf8"));
  return pkg.version;
}

function buildManifest(version) {
  return {
    manifest_version: "0.2",
    name: "sdd-mcp",
    display_name: "SDD - Spec-Driven Development",
    version,
    description: "Specs, plans, gates, consent and a visual SDD board. Bilingual EN/ES.",
    long_description:
      "Spec-Driven Development MCP server: create and approve numbered specs, run the policy gate, " +
      "record consent, write the logbook, and open a read-only visual board of the whole project.",
    author: { name: "Juan Carlos Alvarez Lagos", url: "https://github.com/juanklagos" },
    homepage: "https://github.com/juanklagos/spec-driven-development-template",
    documentation: "https://github.com/juanklagos/spec-driven-development-template#readme",
    license: "MIT",
    repository: {
      type: "git",
      url: "https://github.com/juanklagos/spec-driven-development-template"
    },
    keywords: ["sdd", "spec-driven-development", "specs", "planning"],
    server: {
      type: "node",
      entry_point: ENTRY_REL,
      mcp_config: {
        command: "node",
        args: [`\${__dirname}/${ENTRY_REL}`],
        // The tools take projectRoot as an argument; this only supplies the
        // default, so the host does not have to guess which folder is meant.
        env: { SDD_PROJECT_ROOT: "${user_config.project_root}" }
      }
    },
    user_config: {
      project_root: {
        type: "directory",
        title: "Project folder / Carpeta del proyecto",
        description: "The SDD workspace to operate on (the folder that contains specs/ or spec/).",
        required: false,
        multiple: false
      }
    },
    tools: [
      { name: "sdd_board_app", description: "Show the visual SDD board inside the client (MCP Apps)." }
    ],
    compatibility: { runtimes: { node: ">=18" } }
  };
}

async function main() {
  const version = await resolveVersion();
  const stage = path.join(outDir, "stage");
  const serverDir = path.join(stage, "server");

  await rm(stage, { recursive: true, force: true });
  await mkdir(serverDir, { recursive: true });

  console.log(`Staging @juanklagos/sdd-mcp@${version} from npm...`);
  await writeFile(path.join(serverDir, "package.json"), JSON.stringify({ private: true }, null, 2));
  run("npm", ["install", `@juanklagos/sdd-mcp@${version}`, "--omit=dev", "--no-audit", "--no-fund"], serverDir);

  // The entry the manifest names must exist before packing, not after a user
  // double-clicks a bundle that cannot start.
  const entry = path.join(stage, ENTRY_REL);
  if (!existsSync(entry)) {
    throw new Error(`Entry point missing after install: ${entry}`);
  }

  // package.json / lock are install scaffolding; the manifest is the contract.
  await rm(path.join(serverDir, "package.json"), { force: true });
  await rm(path.join(serverDir, "package-lock.json"), { force: true });

  await writeFile(path.join(stage, "manifest.json"), `${JSON.stringify(buildManifest(version), null, 2)}\n`);

  const output = path.join(outDir, `sdd-mcp-${version}.mcpb`);
  run("npx", ["--yes", "@anthropic-ai/mcpb", "validate", "manifest.json"], stage);
  console.log(run("npx", ["--yes", "@anthropic-ai/mcpb", "pack", ".", output], stage).split("\n").slice(-12).join("\n"));

  console.log(`\n.mcpb ready: ${output}`);
  console.log(`Probe it:    node scripts/probe-mcpb-stdio.mjs ${path.join(stage, ENTRY_REL)} <projectRoot>`);
  console.log("Then install it in the host and confirm the board VIEW renders — packing proves nothing about that.");
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
