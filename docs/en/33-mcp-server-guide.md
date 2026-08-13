# MCP Server Guide

<!-- sdd:doc-type:start -->

> **How-to** · Steps for one specific job. Assumes you already know the basics.

<!-- sdd:doc-type:end -->

## Purpose

This guide is only for MCP setup and connectivity.

If you want the non-technical route first, start here:
- [Easy MCP Guide](./43-easy-mcp-guide.md)

If you want the full functional reference, start here:
- [Complete MCP Reference](./41-complete-mcp-reference.md)

## Setup flow

```mermaid
flowchart LR
  A["Install dependencies"] --> B["Build MCP"]
  B --> C["Register client config"]
  C --> D["Start transport"]
  D --> E["Validate connection"]
```

Product split:
- repository root: canonical SDD framework
- `packages/sdd-core`: reusable SDD logic
- `packages/sdd-mcp`: MCP tools, resources, prompts, and transports

## What is already implemented

High-level summary only:

Transports:
- `stdio`
- `Streamable HTTP`

Tools — **39 in total**. This guide does not list them one by one on purpose: that list drifted out of date twice. The complete, always-current reference is [guide 41](./41-complete-mcp-reference.md). What they cover:

- **Create and validate**: workspaces, numbered specs, validation, the gate, consent, spec scoring, EARS linting.
- **Read and write specs**: whole documents, guided sections, the INDEX row, and the full task list (add, rename, remove, move, tick).
- **The board**: read it, write it, connect two cards, and the board view for MCP-Apps clients.
- **Logbook**: decisions, handoffs, daily logs, the project log — read and write.
- **Reports**: STATUS.md and the roadmap.
- **Existing projects**: install the `spec/` folder, discover legacy structure, check the policy, check drift.
- **Stay current**: compare your installed version against the server, and upgrade.
- **The builder's AI queue**: claim a request, answer it with a proposal.

Structured tool output:
- each tool exposes `outputSchema`
- handlers return `structuredContent` plus text output

Static resources:
- `sdd-policy`
- `sdd-ai-start`
- `sdd-easy-mcp-guide`
- `sdd-quickstart`
- `sdd-spec-template`

Project resource templates:
- `sdd-project-index`
- `sdd-project-log`
- `sdd-project-latest-handoff`
- `sdd-project-idea`
- `sdd-spec-document`

Prompts:
- `start_new_sdd_project`
- `adapt_existing_project_to_sdd`
- `close_sdd_session`
- `easy_start_project`
- `easy_create_spec`
- `easy_show_structure`
- `easy_validate_project`
- `easy_show_next_step`
- `easy_close_session`
- `sdd_serve_requests` — the queue-serving loop for the builder's AI requests (no install needed in clients that show MCP prompts as slash commands)

## Local setup

```bash
npm install
npm run typecheck
npm run build
npm run mcp:smoke
npm run mcp:http:smoke
```

Run the servers:

```bash
npm run mcp:start
npm run mcp:http:start
```

Entrypoints:
- stdio: `packages/sdd-mcp/dist/index.js`
- HTTP: `http://127.0.0.1:3334/mcp`

## Operational contract

- open this repository as the workspace root
- prefer `./www/<project-name>/` as the recommended default workspace
- external target paths are also supported for project-root-based tools
- create the SDD base first
- do not implement code before approved spec and consistent plan
- request explicit user consent only when implementation is about to start

Related references:
- [Complete MCP Reference](./41-complete-mcp-reference.md)
- [Command Results Reference](./40-command-results-reference.md)

## Copy-paste config examples

> **Shortcut (spec 032):** `npx @juanklagos/sdd-mcp@latest connect` writes these files for you, for seven clients, merging into whatever you already have. See guide 51. The examples below stay as the manual reference.

Reference examples:
- `packages/sdd-mcp/examples/.cursor/mcp.json`
- `packages/sdd-mcp/examples/.mcp.json`
- `packages/sdd-mcp/examples/codex.config.toml`

### Cursor

Official config path on macOS/Linux:
- `~/.cursor/mcp.json`

Project-scoped alternative:
- `mcp.json` in the workspace, if you prefer project-local registration

Example:

```json
{
  "mcpServers": {
    "sdd": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/spec-driven-development-template/packages/sdd-mcp/dist/index.js"
      ]
    }
  }
}
```

### Codex

Official shared config path:
- `~/.codex/config.toml`

Example:

```toml
[mcp_servers.sdd]
command = "node"
args = ["/ABSOLUTE/PATH/TO/spec-driven-development-template/packages/sdd-mcp/dist/index.js"]
```

### Claude Code

Official project-scoped config:
- `.mcp.json` at the repository root

Official user-scoped config:
- `~/.claude.json`

Project-scoped example:

```json
{
  "mcpServers": {
    "sdd": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/spec-driven-development-template/packages/sdd-mcp/dist/index.js"
      ],
      "env": {}
    }
  }
}
```

### HTTP-capable clients

If the client supports remote MCP over Streamable HTTP:

```text
http://127.0.0.1:3334/mcp
```

Use:

```bash
npm run mcp:http:start
```

## Recommended first message to the agent

```text
Use the connected sdd MCP server for this repository.
Create the SDD base first.
If the project is runnable inside this template, keep it inside ./www/<project-name>; external target paths are also supported.
Read the policy and quickstart resources first.
Do not implement code before approved spec and consistent plan.
Ask for explicit user consent only when implementation is about to start.
```

## Verification checklist

- `npm run typecheck`
- `npm run build`
- `npm run mcp:smoke`
- `npm run mcp:http:smoke`
- `./scripts/validate-sdd.sh . --strict`
- `./scripts/check-sdd-policy.sh .`
- `./scripts/check-sdd-gate.sh .`
