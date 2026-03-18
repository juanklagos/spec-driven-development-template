# MCP Server Guide

## Purpose

This guide explains how to run and connect the local `sdd-mcp` server.

The repository now follows this product path:

- framework root as canonical source
- `packages/sdd-core` for reusable SDD logic
- `packages/sdd-mcp` for MCP tools, resources, and prompts

## Current MVP

Transport:
- `stdio`
- `Streamable HTTP`

Tools:
- `sdd_create_workspace`
- `sdd_create_spec`
- `sdd_validate`
- `sdd_check_gate`
- `sdd_record_user_consent`
- `sdd_list_specs`
- `sdd_generate_status`
- `sdd_generate_roadmap`
- `sdd_append_project_log`
- `sdd_write_daily_log`
- `sdd_write_handoff`
- `sdd_write_decision`

Resources:
- policy
- quickstart
- AI start guide
- spec template
- project idea resource template

Prompts:
- `start_new_sdd_project`
- `adapt_existing_project_to_sdd`
- `close_sdd_session`

## Local setup

```bash
npm install
npm run typecheck
npm run build
npm run mcp:smoke
npm run mcp:http:smoke
```

Run the server:

```bash
npm run mcp:start
npm run mcp:http:start
```

## Client configuration pattern

Use the built server entrypoint:

```text
node /ABSOLUTE/PATH/TO/spec-driven-development-template/packages/sdd-mcp/dist/index.js
```

HTTP endpoint:

```text
http://127.0.0.1:3334/mcp
```

Recommended working root:
- open this repository as the workspace
- use `./www/<project-name>/` for runnable projects

## Example MCP config snippet

```json
{
  "mcpServers": {
    "sdd": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/spec-driven-development-template/packages/sdd-mcp/dist/index.js"
      ]
    }
  }
}
```

## Client examples

### Claude Desktop

Example MCP config entry:

```json
{
  "mcpServers": {
    "sdd": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/TO/spec-driven-development-template/packages/sdd-mcp/dist/index.js"
      ]
    }
  }
}
```

Suggested first message:

```text
Use the connected sdd MCP server.
Create the SDD base first.
If the project is runnable, keep it inside ./www/<project-name>.
Do not implement code before approved spec and consistent plan.
Use MCP tools when available instead of free-form file edits.
```

### Cursor

Use the same command/args pair to register the local MCP server.

Suggested first message:

```text
Use the sdd MCP tools and resources for this repository.
Start by reading the policy and quickstart resources.
Then create or inspect the active SDD project under ./www/.
```

### Codex Desktop

When MCP server registration is available, point it to the same built server entrypoint.

Suggested first message:

```text
Use the local sdd MCP server for SDD operations.
Prefer MCP tools for workspace, spec, validation, roadmap, and logbook actions.
```

### Streamable HTTP clients

When a client prefers remote-style MCP registration, point it to:

```text
http://127.0.0.1:3334/mcp
```

Run it with:

```bash
npm run mcp:http:start
```

## Operational rules

- The framework root remains the canonical source.
- Runnable target projects must live in `./www/`.
- No implementation without approved spec and consistent plan.
- Record explicit user consent only before implementation starts.

## Recommended next evolution

- add `generate_status` and `generate_roadmap` tools
- add direct project logbook tools
- add Streamable HTTP transport
- add integration docs for specific clients
