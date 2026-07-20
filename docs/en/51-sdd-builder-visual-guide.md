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

## Limitations (honest)

- Long-form `spec.md` content is edited in your editor, not the canvas (by design: the canvas composes, your editor writes).
- Deleting a spec folder on disk does not remove its card automatically (conservative; delete the card manually).
- One workspace per server instance (`SDD_PROJECT_ROOT`).

## Roadmap

MCP App view (the board inside Claude/ChatGPT/VS Code) is planned once the finalized MCP spec (2026-07-28) settles — see `specs/006-visual-spec-builder/`.
