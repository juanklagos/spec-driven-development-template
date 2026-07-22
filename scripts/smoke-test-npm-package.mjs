// Packaging smoke test: exercise the PUBLISHED artifact, not the checkout.
//
// The repo scripts always run `node packages/sdd-mcp/dist/index.js` from the
// monorepo, which hides two whole classes of bug that only exist in a tarball:
//   1. a bin without a `#!/usr/bin/env node` shebang (the shell tries to run
//      JavaScript as sh -> "import: command not found");
//   2. framework assets resolved by walking up from the package directory,
//      which lands on <project>/node_modules once installed.
//
// So: npm pack both packages, install the tarballs into a throwaway project,
// and drive the bin exactly as a user would (node_modules/.bin/sdd-mcp, no
// `node` prefix), asserting a real MCP handshake, readable framework resources
// and a workspace created outside node_modules.

import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import packageJson from "../package.json" with { type: "json" };

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";

let sandbox;

async function run(command, args, options = {}) {
  return execFileAsync(command, args, { maxBuffer: 32 * 1024 * 1024, ...options });
}

async function pack(workspace, destination) {
  const { stdout } = await run("npm", ["pack", "--workspace", workspace, "--pack-destination", destination], {
    cwd: repoRoot
  });
  const tarball = stdout.trim().split("\n").pop().trim();
  return path.join(destination, tarball);
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

/**
 * Execute the installed bin file directly, with no interpreter, the way `npx`
 * and the shell do. Without a shebang the kernel refuses it (ENOEXEC) and a
 * shell then reinterprets the JavaScript as sh ("import: command not found").
 */
function runBinRaw(binPath, cwd, stdin) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(binPath, [], { cwd, stdio: ["pipe", "pipe", "pipe"] });
    } catch (error) {
      resolve({ code: null, stdout: "", stderr: "", spawnError: error });
      return;
    }

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", (error) => resolve({ code: null, stdout, stderr, spawnError: error }));
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    child.stdin.end(stdin);
    setTimeout(() => child.kill(), 15000).unref();
  });
}

async function assertShebang(filePath, label) {
  const head = (await fs.readFile(filePath, "utf8")).slice(0, 32);
  assert.ok(
    head.startsWith("#!/usr/bin/env node"),
    `${label} must start with a "#!/usr/bin/env node" shebang, got: ${JSON.stringify(head.slice(0, 24))}`
  );
}

async function main() {
  // realpath: on macOS os.tmpdir() is a symlink (/var -> /private/var) and the
  // server reports the resolved cwd, so compare like with like.
  sandbox = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "sdd-npm-smoke-")));
  const tarballsDir = path.join(sandbox, "tarballs");
  const projectDir = path.join(sandbox, "consumer");
  await fs.mkdir(tarballsDir, { recursive: true });
  await fs.mkdir(projectDir, { recursive: true });

  console.log(`Packing into ${tarballsDir}`);
  const coreTarball = await pack("@juanklagos/sdd-core", tarballsDir);
  const mcpTarball = await pack("@juanklagos/sdd-mcp", tarballsDir);

  await fs.writeFile(
    path.join(projectDir, "package.json"),
    `${JSON.stringify({ name: "sdd-npm-smoke-consumer", version: "1.0.0", private: true, type: "module" }, null, 2)}\n`
  );

  console.log("Installing tarballs into a clean project...");
  await run("npm", ["install", "--no-audit", "--no-fund", "--loglevel", "error", coreTarball, mcpTarball], {
    cwd: projectDir
  });

  // --- the tarball must contain the framework payload (C2) -----------------
  const installedCore = path.join(projectDir, "node_modules", "@juanklagos", "sdd-core");
  for (const asset of ["framework/sdd.policy.yaml", "framework/scripts/create-www-project.sh", "framework/specs/_template/spec.md"]) {
    assert.ok(await exists(path.join(installedCore, asset)), `Published @juanklagos/sdd-core is missing ${asset}`);
  }

  // --- both bins must be linked and executable (C1, m6) --------------------
  const stdioBinTarget = path.join(projectDir, "node_modules", "@juanklagos", "sdd-mcp", "dist", "index.js");
  const httpBinTarget = path.join(projectDir, "node_modules", "@juanklagos", "sdd-mcp", "dist", "http.js");
  await assertShebang(stdioBinTarget, "sdd-mcp bin (dist/index.js)");
  await assertShebang(httpBinTarget, "sdd-mcp-http bin (dist/http.js)");

  const binDir = path.join(projectDir, "node_modules", ".bin");
  const stdioBin = path.join(binDir, isWindows ? "sdd-mcp.cmd" : "sdd-mcp");
  const httpBin = path.join(binDir, isWindows ? "sdd-mcp-http.cmd" : "sdd-mcp-http");
  assert.ok(await exists(stdioBin), "npm did not link a `sdd-mcp` bin");
  assert.ok(await exists(httpBin), "npm did not link a `sdd-mcp-http` bin (declare it in package.json#bin)");

  if (!isWindows) {
    const mode = (await fs.stat(stdioBinTarget)).mode;
    assert.ok((mode & 0o111) !== 0, "sdd-mcp bin file is not executable in the installed tree");

    // Executing the bin with no interpreter is what `npx @juanklagos/sdd-mcp` does.
    const raw = await runBinRaw(stdioBin, projectDir, "");
    assert.notEqual(
      raw.spawnError?.code,
      "ENOEXEC",
      "The installed `sdd-mcp` bin is not directly executable (ENOEXEC): it has no interpreter line, so npx hands it to the shell"
    );
    assert.equal(raw.spawnError, undefined, `Could not execute the installed bin: ${raw.spawnError?.message}`);
    assert.ok(
      !/import: command not found|syntax error near unexpected token/.test(raw.stderr),
      `Running the installed bin fell through to the shell (missing shebang):\n${raw.stderr.slice(0, 500)}`
    );
  }

  // --- a real MCP handshake over the installed bin -------------------------
  const workspacesRoot = path.join(sandbox, "workspaces");
  await fs.mkdir(workspacesRoot, { recursive: true });

  const transport = new StdioClientTransport({
    command: isWindows ? process.execPath : stdioBin,
    args: isWindows ? [stdioBinTarget] : [],
    cwd: workspacesRoot,
    stderr: "inherit"
  });
  const client = new Client({ name: "sdd-npm-smoke-test", version: packageJson.version }, { capabilities: {} });

  try {
    await client.connect(transport);

    const tools = await client.listTools();
    const toolNames = tools.tools.map((item) => item.name);
    assert.ok(toolNames.includes("sdd_create_workspace"), `Installed server exposes no sdd_create_workspace: ${toolNames}`);

    // Framework resources must resolve to the bundled payload, not node_modules.
    for (const uri of [
      "sdd://policy/current",
      "sdd://docs/quickstart",
      "sdd://docs/ai-start",
      "sdd://docs/easy-mcp",
      "sdd://templates/spec"
    ]) {
      let contents;
      try {
        ({ contents } = await client.readResource({ uri }));
      } catch (error) {
        throw new Error(`Installed server cannot read ${uri}: ${error.message}`);
      }
      assert.ok(contents[0]?.text?.length > 0, `Installed server returned empty content for ${uri}`);
    }

    // Scaffolding must shell out to the bundled scripts and land outside node_modules.
    const created = await client.callTool({
      name: "sdd_create_workspace",
      arguments: { projectName: "packaged-demo", assistant: "codex", profile: "recommended", useSpecKit: false }
    });
    assert.ok(!created.isError, `sdd_create_workspace failed on an npm install:\n${created.content?.[0]?.text}`);

    const projectRoot = created.structuredContent?.projectRoot;
    assert.equal(projectRoot, path.join(workspacesRoot, "www", "packaged-demo"));
    assert.ok(!projectRoot.includes("node_modules"), `Workspace was created inside node_modules: ${projectRoot}`);
    assert.ok(await exists(path.join(projectRoot, "spec", "sdd.policy.yaml")), "Scaffolded sidecar is missing sdd.policy.yaml");

    // And the created workspace must be usable through the same installed server.
    const validation = await client.callTool({ name: "sdd_validate", arguments: { projectRoot } });
    assert.ok(
      typeof validation.structuredContent?.ok === "boolean",
      `sdd_validate returned no structured result: ${validation.content?.[0]?.text}`
    );

    // The builder UI must be IN the tarball (spec 011 R1).
    //
    // This assertion, not the config change, is the deliverable. Both mechanisms
    // that could stage the UI fail silently: `files: ["dist"]` simply omits what
    // is not there, and copying through the framework payload hits an
    // EXCLUDED_NAMES entry for "dist" that matches on basename and copies
    // nothing without throwing. Either would publish a green release with no
    // frontend — which is what shipped for two releases.
    const builderRoot = path.join(projectDir, "node_modules/@juanklagos/sdd-mcp/dist/builder-ui");
    assert.ok(
      await exists(path.join(builderRoot, "index.html")),
      `The SDD Builder UI is missing from the installed package (${builderRoot}). Using the builder would require cloning the repository.`
    );
    const builderAssets = await fs.readdir(path.join(builderRoot, "assets")).catch(() => []);
    const builderBundles = builderAssets.filter((f) => f.endsWith(".js"));
    assert.ok(
      builderBundles.length > 0,
      `The builder shipped an index.html with no JavaScript bundle under ${builderRoot}/assets — a shell with no app.`
    );
    // And the shell must actually reference the bundle it shipped: a stale
    // index.html pointing at a hash that no longer exists serves a blank page.
    const builderHtml = await fs.readFile(path.join(builderRoot, "index.html"), "utf8");
    const referenced = builderHtml.match(/\/assets\/([^"']+\.js)/)?.[1];
    assert.ok(
      referenced && builderBundles.includes(referenced),
      `index.html references "${referenced}", which is not among the shipped bundles (${builderBundles.join(", ")}).`
    );

    console.log("npm package smoke test passed");
    console.log(`Tarballs: ${path.basename(coreTarball)}, ${path.basename(mcpTarball)}`);
    console.log(`Bins: sdd-mcp, sdd-mcp-http`);
    console.log(`Builder UI: index.html + ${builderBundles.length} bundle(s)`);
    console.log(`Workspace created at: ${projectRoot}`);
  } finally {
    await transport.close().catch(() => {});
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (sandbox) {
      await fs.rm(sandbox, { recursive: true, force: true }).catch(() => {});
    }
  });
