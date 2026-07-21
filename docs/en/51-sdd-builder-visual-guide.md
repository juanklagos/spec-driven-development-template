# 🎨 SDD Builder: build your specs visually

The SDD Builder is a drag-and-drop canvas where you compose your SDD flow as connected cards — and every card is a **real** `specs/NNN-slug/` bundle on disk. Your markdown stays the source of truth; the canvas only stores positions in `specs/board.canvas` (open JSON Canvas format).

## Quick start

```bash
# one-time: build the frontend
npm run builder:build

# create a playground workspace (or use any project with a spec/ sidecar)
./scripts/install-spec-sidecar.sh ~/sdd-playground --profile=recommended

# start the server pointing at your workspace
SDD_PROJECT_ROOT=~/sdd-playground npm run mcp:http:start
# open http://127.0.0.1:3334/builder
```

Note: inside this template repository itself the builder is blocked by design (no target-project work in the template root). Always point `SDD_PROJECT_ROOT` at a real workspace.

## What you can do

| On the canvas | What happens on disk |
| :--- | :--- |
| Drag a **Spec** card from the palette, give it a name | A real `specs/NNN-slug/` bundle is created (spec, plan, tasks, history) |
| Click a spec card | Drawer with its tasks as checkboxes; the spec.md excerpt read-only |
| Toggle a task checkbox | The `- [ ]` line in `tasks.md` flips to `- [x]` surgically |
| Connect two cards, double-click the line | Labeled dependency saved in `board.canvas` |
| Add 💡 Idea / 📦 Epic cards | Free note nodes (color-coded) in `board.canvas` |
| Move cards around | Positions saved (debounced) — never touches your .md files |

## From an AI agent (MCP)

Any MCP client connected to `sdd-mcp` can work with the same board through five tools — `sdd_board_read`, `sdd_board_write`, `sdd_board_connect`, `sdd_read_tasks`, `sdd_set_task_done` — backed by the exact same `sdd-core` layer as the canvas, so what your agent writes is what you see in `/builder` (and vice versa). See guide 41 (complete MCP reference).

## Live sync

The server watches your `specs/` directory. Edit any `tasks.md` in your editor and the card's progress bar updates by itself — no reload. The top bar shows **🟢 Live**; if the server restarts on a different workspace, an amber banner asks you to reload. Concurrency rule: your markdown always wins; canvas layout is last-writer-wins (a future phase adds finer merging).

## What's new in v2 (spec 007)

- **Gate semaphore**: a live chip in the top bar (🟢 open / 🔴 closed) plus a "Validate now" button running the real validation; gate errors show up as a red `⚠ N` badge with a tooltip on the affected card.
- **Approve from the drawer**: one confirmed click writes the real approval block (status, today's date, approver, evidence) into `spec.md` — with a clear error if the block is missing.
- **Welcome tour**: five anchored steps (palette → create → connect → tasks → gate), dismissable with "Don't show again" and re-launchable from the "?" button.
- **Template gallery**: Web App, API/Backend, E-commerce and SaaS playbooks create real specs plus a connected, tidy board. Only on a workspace with zero specs.
- **Guided spec editor**: the drawer's "Edit" tab writes the user story, acceptance scenarios, EARS criteria (prefix autocompleted on focus) and out-of-scope sections surgically — approval and requirements are never touched.
- **Undo/redo + PNG export**: canvas history (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z) and a "📷 PNG" button to share the board as an image.

Agents get the same three powers over MCP: `sdd_gate_summary`, `sdd_approve_spec`, `sdd_update_spec_sections`.

## What's new in v3 (spec 008) — AI without API keys

The builder never calls an LLM itself (no keys to configure). Local heuristics cover the quick wins; anything needing real intelligence is delegated to **your** agent through copyable prompts and the MCP tools.

- **✨ Assistant — "Describe your project"**: a top-bar wizard takes one sentence (e.g. *"an online plant store with payments and an admin panel"*) and proposes a draft board — one idea note, 2-4 epics and 3-6 specs grouped by detected domains (auth, payments, catalog, admin, API, notifications, profile, search; generic MVP fallback). The draft is previewed and editable (rename/remove specs, "Regenerate" for alternative names) and **nothing touches the disk** until you press "Create on the board" — then it runs the same real calls as the template gallery (one `POST /api/spec` per spec + the pre-laid-out canvas). Empty workspaces only.
- **🤖 Implement with agent**: in the drawer of an **approved** spec, a button preloads the exact implementation kickoff prompt (workspace path, spec folder, run the SDD gate, record consent, hard stop, tick tasks, close with the session contract) with one "Copy prompt" button. Copy-first by design — no fragile deep links, works with Claude Code, Codex, Cursor, anything. On a non-approved spec the button is disabled with the hard stop: *no code before approved spec and consistent plan*.
- **Live EARS lint**: while typing acceptance criteria in the guided editor, each row gets a green (EARS-shaped) or amber (suggestion) border with a short bilingual hint — the `WHEN/IF/WHILE … THE SYSTEM SHALL …` skeleton and vague words without a measurable number (*fast, easy, user-friendly…*). Advisory only: it never blocks saving. The same rule is exported for agents as `validateEarsCriterion` in `sdd-core`.

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

## What's new in v4 (spec 009) — teams

Four features so a small team can coordinate real work on the same specs:

- **Kanban view**: the "🗺️ Canvas ↔ 📋 Board" toggle in the top bar shows the same specs as three columns driven by the real state of your .md files — **Draft · Pending**, **Approved** (the `Estado / Status` line in `spec.md`), and **Done** (every task ticked). Cards keep their progress bar and open the same drawer. Honest v1: dragging a card to another column changes *nothing* on disk — approval is a real act on the spec, so the drop shows a toast ("Approval happens on the spec") with an "Open spec" button to the drawer's Approve flow.
- **Typed connections + dependency warnings**: double-click a connection and pick its type — *related* (default), *depends on* (amber), *blocks* (red), or any free-text label as before. The type travels in the `label` field of `board.canvas` (both EN and ES spellings are canonical) plus a standard JSON Canvas `color`. When a typed edge links two real specs and the **dependent spec is approved but its dependency is not**, the builder warns: an amber `⚠ N dep` chip next to the gate semaphore (with the full list in the tooltip) and an amber `⚠ dep` badge on the dependent card, in both views. Advisory only — the gate itself never closes because of it. Agents see the same list in the `dependencyWarnings` field of `sdd_gate_summary` and of `GET /api/gate`.
- **Tasks → GitHub issues**: in the drawer, "🐙 Create issues" creates one GitHub issue per **pending** task via your local `gh` CLI — title `[<specId>] <task>` for traceability, body linking the bundle's `tasks.md`. Idempotent by title: tasks whose exact title already exists are skipped, and the result is reported per task (created / skipped / failed) with links. It degrades honestly: without a git repo, a remote, or an authenticated `gh`, you get a clear bilingual error telling you exactly what to run.
- **Presence**: when more than one person (or agent) has the builder open on the same workspace, the top bar shows **👥 N** ("N people viewing this workspace") — powered by the same SSE hub as live sync, join/leave updates included.

## Limitations (honest)

- Long-form `spec.md` content beyond the guided sections is edited in your editor, not the canvas (by design: the canvas composes, your editor writes).
- Deleting a spec folder on disk does not remove its card automatically (conservative; delete the card manually).
- One workspace per server instance (`SDD_PROJECT_ROOT`).
- Kanban v1 is a read-only projection of state: moving cards between columns never approves or un-approves anything (use the drawer). Issue idempotency is title-based (renaming a task creates a new issue).

## Roadmap

MCP App view (the board inside Claude/ChatGPT/VS Code) is planned once the finalized MCP spec (2026-07-28) settles — see `specs/006-visual-spec-builder/`.
