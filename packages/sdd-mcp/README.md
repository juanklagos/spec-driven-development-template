# sdd-mcp

MCP server for the Spec-Driven Development framework.

Purpose:
- expose SDD operations as MCP tools
- expose framework and project context as MCP resources
- expose beginner-friendly SDD flows as MCP prompts

Design goals:
- prefer `./www/<project-name>/` as the recommended default workspace inside this template
- support external target project paths on project-root-based tools
- block implementation without approved spec and consistent plan
- require user consent only before implementation starts

Target MCP surface:
- Tools: create workspace, create spec, validate, check gate, record consent, generate status
- Resources: policy, templates, quickstart, active project context
- Prompts: new project, adapt existing project, first spec, session close

## Run it (installed from npm)

The package ships two executables. Both read stdin/stdout or listen locally; no
build step is required.

```bash
# 1. stdio transport - what MCP clients (Claude, Cursor, Codex...) launch
npx -y @juanklagos/sdd-mcp@latest

# 2. Streamable HTTP transport - the visual board, the dashboard, and MCP at /mcp
npx -y @juanklagos/sdd-mcp@latest --http
# -> http://127.0.0.1:3334/builder    the SDD Builder canvas
#    http://127.0.0.1:3334/dashboard  read-only status
#    http://127.0.0.1:3334/mcp        the MCP endpoint itself
```

The `sdd-mcp-http` bin still exists and does the same thing — `--http` on the main bin
is there so reaching the board never depends on npx resolving a second executable.

```bash
sdd-mcp --help      # usage, including --http, and the env vars below (exit 0)
sdd-mcp --version   # the running version (exit 0)
```

**The binary fails loud, never silent.** An argument it does not recognise — a
typo, or a flag from a newer version reaching an older cached one — is written to
stderr, names the argument and the running version, and exits non-zero **without
starting any transport**. `--http` whose port range is fully taken exits non-zero
too, naming `SDD_MCP_HTTP_PORT`, instead of claiming a server that never listened
is "still running". With no arguments it starts the stdio transport exactly as
before, and stdout stays clean because it is the MCP protocol channel. This is
spec 021: `npx @juanklagos/sdd-mcp --http` once returned zero bytes and exit 0
against a cached version that predated `--http`, and that silence is the bug the
guarantee closes.

Environment variables:

| Variable | Default | Meaning |
|---|---|---|
| `SDD_MCP_HTTP_PORT` | `3334` | Port for `sdd-mcp-http`. |
| `SDD_MCP_HTTP_HOST` | `127.0.0.1` | Bind address. Loopback by default; see the security notes below. |
| `SDD_MCP_HTTP_ALLOWED_ORIGINS` | *(empty)* | Extra `Origin` values allowed on mutating requests, comma-separated. `*` disables the check. |
| `SDD_MCP_MAX_BODY_BYTES` | `2097152` | Maximum request body the transport will buffer. |
| `SDD_MCP_SESSION_TTL_MS` | `600000` | Idle time after which an MCP Streamable HTTP session is reclaimed. |
| `SDD_MCP_MAX_SESSIONS` | `64` | Concurrent MCP session cap; the least-recently-used session is evicted. |
| `SDD_PROJECT_ROOT` | autodetected from the cwd | Project the HTTP dashboard, REST API and live events operate on. |
| `SDD_WORKSPACES_ROOT` | repo root in a checkout, cwd when installed from npm | Where `sdd_create_workspace` creates `./www/<project-name>`. |

### Security model of `sdd-mcp-http` / Modelo de seguridad

The HTTP server is **local-first and unauthenticated on purpose**: it reads,
creates and approves specs in your working copy, and `/api/spec/:id/issues`
runs your authenticated `gh`. It is therefore locked down as follows.

- **Loopback only.** It binds `127.0.0.1`. `SDD_MCP_HTTP_HOST` can widen that
  (`0.0.0.0`, `::`), and doing so prints a warning at startup, because anyone
  who can reach the port gets full control. The startup banner always shows the
  address actually bound.
- **Origin allowlist.** Mutating requests (`POST`/`PUT`/`PATCH`/`DELETE`) from a
  non-loopback `Origin` get `403` before any route runs, so a page you merely
  visit cannot drive the server. Requests with no `Origin` (CLI, MCP clients)
  are allowed; loopback origins on any port are allowed, so the builder's Vite
  dev server keeps working.
- **JSON only.** A mutating request that declares a non-JSON content type gets
  `415`, which forces browsers into a preflight that never succeeds.
- **Bounded bodies.** Request bodies over `SDD_MCP_MAX_BODY_BYTES` get `413`
  (or the socket is dropped for chunked uploads that never declare a length).
- **Bounded sessions.** MCP Streamable HTTP sessions are reclaimed on `DELETE`,
  on transport close, after an idle TTL, and by a concurrent-session cap.

ES: el servidor HTTP es local-first y sin autenticación a propósito. Escucha
solo en loopback, bloquea peticiones cross-origin que modifican estado, exige
`content-type: application/json`, limita el tamaño del cuerpo y recicla las
sesiones MCP. Exponerlo fuera de loopback con `SDD_MCP_HTTP_HOST` da control
total a cualquiera que alcance el puerto.

Note: binding `127.0.0.1` means the IPv6 loopback `[::1]` is not served. Browsers
and `curl` fall back to IPv4 for `localhost`; set `SDD_MCP_HTTP_HOST=::` if you
need dual-stack.

Framework assets (policy, quickstart, guides, spec template, scaffolding
scripts) are bundled inside `@juanklagos/sdd-core` under `framework/`, so the
tools and `sdd://` resources work from a plain `npm install`. Running from a
checkout of the template repository always uses the live files instead.

The **SDD Builder UI** (`/builder`) is checkout-only by design: `builder/dist`
is not bundled in the tarball. An npm-installed server answers `/builder` with a
503 explaining how to get it. Everything else - tools, resources, prompts and
`/dashboard` - works from npm.

Local development (inside the template repository):

```bash
npm install
npm run typecheck
npm run build
npm run mcp:smoke        # stdio, from the checkout
npm run mcp:http:smoke   # streamable HTTP, from the checkout
npm run mcp:pack:smoke   # npm pack + install + run the bins as a user would
npm run mcp:start
npm run mcp:http:start
```

Current MVP tools:
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

Current resources:
- `sdd-policy`
- `sdd-ai-start`
- `sdd-easy-mcp-guide`
- `sdd-quickstart`
- `sdd-spec-template`
- `sdd-project-index`
- `sdd-project-log`
- `sdd-project-latest-handoff`
- `sdd-project-idea`
- `sdd-spec-document`

Current prompts:
- `start_new_sdd_project`
- `adapt_existing_project_to_sdd`
- `close_sdd_session`
- `easy_start_project`
- `easy_create_spec`
- `easy_show_structure`
- `easy_validate_project`
- `easy_show_next_step`
- `easy_close_session`

Implementation notes:
- tools expose `outputSchema`
- handlers return `structuredContent`
- `stdio` and `Streamable HTTP` are both supported

Config examples:
- `packages/sdd-mcp/examples/.cursor/mcp.json`
- `packages/sdd-mcp/examples/.mcp.json`
- `packages/sdd-mcp/examples/codex.config.toml`

Reference docs:
- `docs/en/43-easy-mcp-guide.md`
- `docs/es/43-guia-mcp-facil.md`
- `docs/en/44-hosted-mcp-onboarding-model.md`
- `docs/es/44-modelo-onboarding-mcp-alojado.md`
- `docs/en/45-client-visual-examples-for-easy-mcp.md`
- `docs/es/45-ejemplos-visuales-clientes-mcp-facil.md`
- `docs/en/33-mcp-server-guide.md`
- `docs/es/33-guia-servidor-mcp.md`
