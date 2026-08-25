# Builder reference

<!-- sdd:doc-type:start -->

<p class="sdd-doc-type"><strong>Reference</strong> Facts to consult while you work. Not meant to be read end to end.</p>

<!-- sdd:doc-type:end -->

Facts to consult while you use the board: every ⌘K action, the keyboard shortcuts and what each filter does. If what you want is to learn how to use it, start with the [builder guide](./51-sdd-builder-visual-guide.md).

The top bar does not carry a button for everything: almost everything lives in the **⌘K search** (Ctrl+K on Windows and Linux) and in the **⋯** menu. You type what you want and press Enter.

**In ⌘K you can:**

| You type | What happens |
| :--- | :--- |
| a spec number or name | jumps to that card and opens it |
| "validate" | runs the real project validation |
| "approve" | opens the approval tab of the spec you have open |
| "decision" | opens the logbook to record a decision |
| "reports" | regenerates `STATUS.md` and the roadmap |
| "PNG" | exports the graph as an image |
| "templates" | opens the template gallery |
| "assistant" | opens the assistant that proposes a whole board |
| "connect" | tells you how to connect your agent |
| "tour" | replays the guided walkthrough |
| "language" | switches between Spanish and English |
| "save" | forces a save right now |
| "dashboard" | opens the status page |

Inside ⌘K you move with ↑ and ↓, run with Enter and close with Esc.

**Keyboard shortcuts**, for when you know your way around:

| Key | What it does |
| :--- | :--- |
| **I** | drops an Idea note in the middle |
| **E** | drops an Epic note |
| **G** | drops a group: a titled frame that owns whatever lands inside it |
| **S** | opens the new-spec form |
| **⌘K** / Ctrl+K | opens the search |
| **⌘Z** / Ctrl+Z | undo |
| **⇧⌘Z** / Ctrl+Shift+Z | redo |
| **Delete** or **Backspace** | deletes the selected note or connection (spec cards are not deleted this way, and it tells you why) |
| **⌘Enter** / Ctrl+Enter | confirms in the long text fields (note, assistant, AI request) |
| **Esc** | cancels the edit |
| **←** **→** | previous and next step in the tour |

I, E, G and S only work when you are not typing in a field.

**Groups** are JSON Canvas titled frames, the same ones Obsidian uses. A group does not store a list of what it holds: it **holds whatever falls inside its rectangle**, recomputed every time you drag something. So:

- Drag the frame by its title and everything inside travels with it.
- Drag a card in and it belongs to the frame; drag it out and it stops belonging. Nothing to confirm.
- When two frames overlap, the card belongs to the smallest one that fully contains it.
- **Deleting a frame does not delete its cards**: they stay exactly where they were.
- Select the frame to get resize handles; double-click the title to rename it.

The file that gets saved is plain JSON Canvas: the group keeps its label, colour and background, and **no card records which group it belongs to**, because the format has no such field. That is what keeps the same `board.canvas` opening in Obsidian.

**The filters** in the second strip hide nothing: they **dim** what does not match, so the board does not change shape while you look at it. There are three: `pending` (specs not approved yet), `with warnings` (specs with gate errors) and `with drift` (specs whose code changed after they were approved). To the right of that strip you get the counts: how many specs, how many connections, and the zoom level.


## The seven client configurations

Which file `connect` writes for each client, and what you type to make it serve the queue. Command details in the [builder guide](./51-sdd-builder-visual-guide.md).

| Client | File | Key | Serve the queue |
| :--- | :--- | :--- | :--- |
| Claude Code | `.mcp.json` | `mcpServers.sdd` | `/sdd-serve` |
| Codex | `.codex/config.toml` | `[mcp_servers.sdd]` | `/sdd-serve` |
| Cursor | `.cursor/mcp.json` | `mcpServers.sdd` | `/sdd-serve` |
| VS Code | `.vscode/mcp.json` | `servers.sdd` | MCP prompt `sdd_serve_requests` |
| Windsurf | `.windsurf/mcp_config.json` | `mcpServers.sdd` | MCP prompt `sdd_serve_requests` |
| Gemini CLI | `.gemini/settings.json` | `mcpServers.sdd` | `/sdd:serve` |
| opencode | `opencode.json` | `mcp.sdd` | `/sdd-serve` |
