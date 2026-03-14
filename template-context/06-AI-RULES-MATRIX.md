# AI Rules Matrix / Matriz de reglas para IA

This matrix helps apply the same SDD guardrails across multiple AI tools.

## Canonical source

- `INSTRUCTIONS.md` (single source of truth)

## Agent mapping

| Agent / Tool | Rule file | Status |
|---|---|---|
| Cursor | `.cursorrules` | Ready |
| Claude (Desktop/Code) | `.clauderules` + `CLAUDE.md` | Ready |
| GitHub Copilot | `.github/copilot-instructions.md` | Ready |
| Gemini | `GEMINI.md` | Ready |
| Generic / Other agents | `AGENT_SYSTEM_PROMPT.md` | Ready |

## Operational note

If a tool does not support local rule files, paste `AGENT_SYSTEM_PROMPT.md` as system prompt manually.
