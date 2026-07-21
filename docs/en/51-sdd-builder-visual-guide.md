# 🎨 SDD Builder: build your specs visually

The SDD Builder is a drag-and-drop canvas where you compose your SDD flow as connected cards — and every card is a **real** `specs/NNN-slug/` bundle on disk. Your markdown stays the source of truth: approving, editing and ticking tasks happen surgically inside your `.md` files, while the canvas only stores positions and connections in `specs/board.canvas` (the open JSON Canvas format). This guide walks the whole product from the first `npm` command to running it from an AI agent, with real screenshots of a small demo project — an online plant store.

![The SDD Builder canvas: idea and epic notes on the left, spec cards with status badges and progress bars, a red "bloquea" edge and an amber "depende de" edge, and the gate semaphore with a dependency warning in the top bar](../assets/builder/canvas.png)

*One board, all the truth: gate open (🟢), an amber `⚠ 1 dep` warning, typed connections between real specs, and per-card progress read live from `tasks.md`.*

## Quick start

```bash
# one-time: build the frontend
npm run builder:build

# create a playground workspace (or use any project with a spec/ sidecar)
./scripts/install-spec-sidecar.sh ~/sdd-playground --profile=recommended

# start the server pointing at your workspace
SDD_PROJECT_ROOT=~/sdd-playground npm run mcp:http:start
# open http://127.0.0.1:3334/builder   (set SDD_MCP_HTTP_PORT to change the port)
```

Two notes before you start:

- Inside this template repository itself the builder is blocked by design (no target-project work in the template root). Always point `SDD_PROJECT_ROOT` at a real workspace.
- The first time you open `/builder`, a **welcome tour** offers five anchored steps (palette → create → connect → tasks → gate). Dismiss it with "Don't show again" and re-launch it anytime from the "?" button in the top bar.

## Your first project with the ✨ assistant

The fastest way to go from nothing to a connected board is the **✨ Assistant** button in the top bar. Describe your project in one sentence — *"an online plant store with catalog, payments and an admin panel"* — and the builder proposes a draft board: one idea note, 2-4 epics and 3-6 specs grouped by the domains it detects (auth, payments, catalog, admin, API, notifications, profile, search; with a generic MVP fallback when nothing matches).

![The ✨ assistant with a generated draft: three specs grouped under Experience, Business and Operations epics, each editable before anything is created](../assets/builder/assistant.png)

*The draft is a preview: rename or remove specs, press "↺ Regenerate" for alternative names — nothing touches the disk until you confirm.*

The important part is what the assistant does **not** do: it never calls an LLM (no API keys to configure — local heuristics only), and nothing is written until you press **"Create on the board"**. At that moment it runs the same real calls as the template gallery — one `POST /api/spec` per spec plus the pre-laid-out canvas — so you end up with genuine `specs/NNN-slug/` bundles, not mockups. The assistant only applies to an empty workspace.

If you *do* have an AI agent, the collapsible "🤖 Have an AI agent?" section preloads a copyable orchestrator prompt that delegates the same job to real intelligence over MCP — see [From an AI agent](#from-an-ai-agent-mcp) below.

## The canvas, day to day

Everything on the canvas maps to something real:

- **Spec cards** show the bundle number and name, an approval badge (Pending / Approved / Done), and a progress bar computed from the real checkboxes in `tasks.md`. Drag a **Spec** card from the palette and name it: a real `specs/NNN-slug/` bundle (spec, plan, tasks, history) is created on the spot.
- **💡 Idea and 📦 Epic notes** are free, color-coded text nodes for shaping the story around your specs. They live only in `board.canvas`.
- **Connections** are drawn by dragging between cards — and the moment you create one, a purpose picker opens right on the edge (spec 010): **contains** (gray, epic → spec), **depends on** (amber), **blocks** (red), **related** (blue, the default) or any free-text label. Double-click a connection to change its purpose later. The purpose travels in the `label` field of `board.canvas` (EN and ES spellings are both canonical) plus a standard JSON Canvas `color`.
- **Moving cards** saves positions (debounced) to `board.canvas` — it never touches your `.md` files. The canvas has undo/redo (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z) and a "📷 PNG" button to export the board as an image.

Typed connections earn their keep through **dependency warnings**: when a typed edge links two real specs and the dependent spec is approved while its dependency is not, the builder warns you — an amber `⚠ N dep` chip next to the gate semaphore (full list in the tooltip) and an amber `⚠ dep` badge on the dependent card, in both views. Advisory only: the gate itself never closes because of it. In the screenshot above, `002-checkout-y-pagos` is approved but depends on the unapproved `001-catalogo-de-plantas` — hence the warning.

The **gate semaphore** in the top bar is the SDD hard stop made visible: a live chip (🟢 open / 🔴 closed) plus a "Validate now" button that runs the real project validation. Gate errors show up as a red `⚠ N` badge with a tooltip on the affected card.

Clicking any spec card opens the **drawer** — the bridge between canvas and markdown:

![The spec sheet for an approved spec: green "Implement with agent" button, tasks as checkboxes, GitHub issues button, and the Summary / Edit spec / Approval / Relations tabs](../assets/builder/drawer.png)

*The sheet of an approved spec: tasks are the real `tasks.md` checkboxes, the "Implement with agent" button is enabled because the spec is approved, and the four tabs (Summary, Edit spec, Approval, Relations) cover the whole loop.*

In the drawer, tasks are live checkboxes: toggling one flips the `- [ ]` line in `tasks.md` to `- [x]` surgically, and the card's progress bar follows. Below the tasks you get a read-only excerpt of `spec.md` — long-form content is edited in your editor, by design: the canvas composes, your editor writes.

**Live sync** keeps all of this honest. The server watches your `specs/` directory: edit any `tasks.md` in your editor and the card updates by itself — no reload. The top bar shows **🟢 Live**; if the server restarts on a different workspace, an amber banner asks you to reload. Concurrency rule: your markdown always wins; canvas layout is last-writer-wins.

## Editing and approving specs

The sheet's **"✏️ Edit spec" tab** is a full guided editor (spec 010): one form per template section — user story, acceptance scenarios, EARS criteria, requirements, spec properties, success criteria and out-of-scope — in an ordered accordion with add/remove/reorder on every list. Each save is surgical: only the edited headings of `spec.md` are rewritten, and the approval block is never touched. The EARS field autocompletes the `WHEN … THE SYSTEM SHALL …` prefix on focus, and a **live EARS lint** marks each criterion with a green (EARS-shaped) or amber (suggestion) border plus a short hint — the skeleton to follow and vague words without a measurable number (*fast, easy, user-friendly…*). Advisory only: it never blocks saving. The same rule is exported for agents as `validateEarsCriterion` in `sdd-core`.

When the spec is ready, the **"Approval" tab** shows the real block as a form — status and date read-only (approving stamps `Aprobado` + today), approver and evidence editable — and writes it surgically into `spec.md`. If the spec has no approval block, you get a clear error instead of a silent fix. The **"Relations" tab** lists every purposeful connection touching the spec (incoming/outgoing) with its icon and color, and lets you change the purpose or delete the connection.

Approval unlocks **"🤖 Implement with agent"**: a modal preloads the exact implementation kickoff prompt — workspace path, spec folder, run the SDD gate, record consent, hard stop, tick tasks, close with the session contract — with one "Copy prompt" button. Copy-first by design: no fragile deep links, works with Claude Code, Codex, Cursor, anything. On a non-approved spec the button is disabled with the hard stop spelled out: *no code before approved spec and consistent plan*.

## The team view

The **"🗺️ Canvas ↔ 📋 Board" toggle** in the top bar shows the same specs as a kanban — three columns driven by the real state of your `.md` files: **Draft · Pending**, **Approved** (the `Estado / Status` line in `spec.md`), and **Done** (every task ticked). Cards keep their progress bar and open the same drawer.

![The kanban view: Draft column with two specs, Approved with the checkout spec carrying its dependency warning, Done with the finished admin panel](../assets/builder/kanban.png)

*Same data, another projection: the columns come from `spec.md` and `tasks.md`, not from a separate board state.*

Honest v1: dragging a card to another column changes *nothing* on disk — approval is a real act on the spec, so the drop shows a toast ("Approval happens on the spec") with an "Open spec" button straight to the drawer's Approve flow.

Two more team features live here:

- **Tasks → GitHub issues**: in the drawer, "🐙 Create issues" creates one GitHub issue per **pending** task via your local `gh` CLI — title `[<specId>] <task>` for traceability, body linking the bundle's `tasks.md`. Idempotent by title: tasks whose exact title already exists are skipped, and the result is reported per task (created / skipped / failed) with links. It degrades honestly: without a git repo, a remote, or an authenticated `gh`, you get a clear bilingual error telling you exactly what to run.
- **Presence**: when more than one person (or agent) has the builder open on the same workspace, the top bar shows **👥 N** ("N people viewing this workspace") — powered by the same SSE hub as live sync, join/leave updates included.

## Templates

If you would rather start from a proven shape than from a sentence, the **🧩 Templates** button opens a gallery of four playbooks — Web App, API/Backend, E-commerce and SaaS. Each one creates real specs plus a connected, tidy board. Like the assistant, templates only apply to a workspace with zero specs.

![The template gallery: Web App, API/Backend, E-commerce and SaaS cards, each stating how many specs and epics it creates](../assets/builder/templates.png)

*Each template card tells you exactly what it will create: real `specs/NNN-…` bundles and a connected board — no placeholders.*

## From an AI agent (MCP)

Any MCP client connected to `sdd-mcp` can work with the same board. The board tools — `sdd_board_read`, `sdd_board_write`, `sdd_board_connect`, `sdd_read_tasks`, `sdd_set_task_done` — are backed by the exact same `sdd-core` layer as the canvas, so what your agent writes is what you see in `/builder` (and vice versa). Agents also get the drawer's powers (`sdd_gate_summary`, `sdd_approve_spec`, `sdd_update_spec_sections`, `sdd_create_spec`), and the dependency warnings appear in the `dependencyWarnings` field of `sdd_gate_summary` and of `GET /api/gate`. See guide 41 (complete MCP reference).

### Connect your agent

The exact command per client — run each one from (or pointing at) the project you want the agent to work on. Everything the agent writes shows up **live** in `/builder` (the SSE watcher picks up every disk change), and everything you do in the builder is instantly visible to the agent.

**Claude Code** (one command, from your project directory):

```bash
claude mcp add sdd --env SDD_PROJECT_ROOT=$(pwd) -- npx -y @juanklagos/sdd-mcp
```

**Codex** (add to `~/.codex/config.toml`):

```toml
[mcp_servers.sdd]
command = "npx"
args = ["-y", "@juanklagos/sdd-mcp"]
env = { SDD_PROJECT_ROOT = "/absolute/path/to/your/project" }
```

**Gemini CLI** (add to `~/.gemini/settings.json`, or the project's `.gemini/settings.json`):

```json
{
  "mcpServers": {
    "sdd": {
      "command": "npx",
      "args": ["-y", "@juanklagos/sdd-mcp"],
      "env": { "SDD_PROJECT_ROOT": "/absolute/path/to/your/project" }
    }
  }
}
```

**Claude Desktop / ChatGPT (HTTP connector)**: start the HTTP server and point a custom connector at the Streamable HTTP endpoint:

```bash
SDD_PROJECT_ROOT=/absolute/path/to/your/project npm run mcp:http:start
# connector URL: http://127.0.0.1:3334/mcp   (SDD_MCP_HTTP_PORT changes the port)
```

In clients that support MCP Apps, asking for the board renders the embedded board view right inside the chat (the `sdd_board_app` tool — see the MCP App section below).

### The orchestrator prompt (real AI via MCP)

The assistant's "Have an AI agent?" section offers this prompt (also copy it from here). Paste it into any agent connected to `sdd-mcp` and it will build the board with real intelligence — including drafted sections inside each spec:

```text
You are my SDD agent connected to the `sdd-mcp` MCP. My project: "<describe your project>".
Goal: populate the SDD Builder board like the ✨ assistant, but with real intelligence.
1. Read the current state with `sdd_board_read` (projectRoot: <workspace path>).
2. Propose 2-4 epics and 3-6 specs with clear lowercase accent-free names; show me the proposal and wait for my OK before writing anything.
3. On my OK: create each real spec with `sdd_create_spec`; fill its draft with `sdd_update_spec_sections` (user story, scenarios, EARS criteria "WHEN … THE SYSTEM SHALL …", out of scope); draw the board with `sdd_board_write` + `sdd_board_connect` (idea note → epics → specs, labeled edges).
4. Do not implement code: the SDD gate stays closed until I approve the specs.
```

### The board inside your AI client (MCP App)

The server also ships the board as an **MCP App** (SEP-1865, the first official MCP extension — part of the 2026-07-28 protocol release, built with the official `@modelcontextprotocol/ext-apps` SDK). In a client that supports MCP Apps, ask your agent to show the board — it calls the `sdd_board_app` tool and the view renders **inside the chat**: spec cards with approval status and task progress, the canvas with its typed connections, the gate semaphore and dependency warnings, plus a "↻ Actualizar / Refresh" button that re-reads the workspace. Read-only in v1, bilingual, dark/light aware.

Standard status (honest): the MCP 2026-07-28 spec is a release candidate frozen since 2026-05-21 with final publication on 2026-07-28; the Apps extension itself has a stable revision (2026-01-26) and a published SDK, so this view is built on the stable surface. In practice:

- It works in hosts that implement MCP Apps; support is rolling out across clients during the finalization window.
- Hosts **without** MCP Apps degrade gracefully: `sdd_board_app` returns the same board + gate data as JSON text.
- The view is fully self-contained (no CDNs): the official ext-apps bridge is inlined into the `ui://sdd/board.html` resource.
- To re-check after 2026-07-28: confirm the final spec text kept `_meta.ui.resourceUri` + `text/html;profile=mcp-app` as-is and bump `@modelcontextprotocol/ext-apps` if a final-release version lands.

## Limitations (honest)

- Long-form `spec.md` content beyond the guided sections is edited in your editor, not the canvas (by design: the canvas composes, your editor writes).
- Deleting a spec folder on disk does not remove its card automatically (conservative; delete the card manually).
- One workspace per server instance (`SDD_PROJECT_ROOT`).
- The kanban is a read-only projection of state: moving cards between columns never approves or un-approves anything (use the drawer). Issue idempotency is title-based (renaming a task creates a new issue).
- An interactive demo on the website is still pending (it needs the Chrome-only FS Access API); see `specs/006-visual-spec-builder/`.

## Quick reference: canvas → disk

| On the canvas | What happens on disk |
| :--- | :--- |
| Drag a **Spec** card from the palette, give it a name | A real `specs/NNN-slug/` bundle is created (spec, plan, tasks, history) |
| Click a spec card | Drawer with its tasks as checkboxes; the spec.md excerpt read-only |
| Toggle a task checkbox | The `- [ ]` line in `tasks.md` flips to `- [x]` surgically |
| Connect two cards, double-click the line | Labeled (optionally typed) dependency saved in `board.canvas` |
| Add 💡 Idea / 📦 Epic cards | Free note nodes (color-coded) in `board.canvas` |
| Move cards around | Positions saved (debounced) — never touches your .md files |
| Approve in the drawer | The real approval block (status, date, approver, evidence) written into `spec.md` |
| Save in the drawer's Edit tab | Only the guided sections of `spec.md` are rewritten — approval and requirements untouched |
