# sdd-core

Core library for Spec-Driven Development operations.

Purpose:
- centralize the reusable business logic behind the template
- avoid using shell stdout as the primary contract
- provide typed functions for CLI, MCP, and future integrations

Initial responsibilities:
- workspace path validation
- spec numbering and creation
- policy loading and interpretation
- SDD validation
- implementation gate checks
- user consent recording

Target consumers:
- `scripts/` compatibility layer
- `packages/sdd-mcp/`

## Framework payload

The tools read framework documents and shell out to the scaffolding scripts. In
a checkout of the template those live at the repo root; there is no repo root in
an npm install, so the tarball ships a mirror of them under `framework/`, built
at pack time by `scripts/build-framework-payload.mjs`.

`resolveFrameworkRoot()` reports which one is in use:

| Layout | Root | When |
|---|---|---|
| `repo` | the template checkout | `packages/sdd-core` inside the monorepo |
| `package` | `<package>/framework` | installed from npm |
| `missing` | the package directory | broken install; every asset read fails with an actionable message |

The checkout always wins, so monorepo development operates on the live files.
`getWorkspacesRoot()` follows the same split: the repo root in a checkout, the
current working directory when installed from npm, and `SDD_WORKSPACES_ROOT`
overrides both.

Current exported operations:
- `createWorkspace`
- `createSpec`
- `listSpecs`
- `validateProject`
- `checkGate`
- `recordUserConsent`
- `generateStatus`
- `generateRoadmap`
- `appendProjectLogEntry`
- `writeDailyLog`
- `writeHandoff`
- `writeDecision`
