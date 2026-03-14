# AI Rules Matrix / Matriz de reglas para IA

This matrix helps apply the same SDD guardrails across multiple AI tools.

## Canonical source

- `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md` (single source of truth)

## Agent mapping

| Agent / Tool | Rule file | Status |
|---|---|---|
| Cursor | `.cursorrules` | Ready |
| Claude (Desktop/Code) | `.clauderules` + `CLAUDE.md` | Ready |
| GitHub Copilot | `.github/copilot-instructions.md` | Ready |
| Gemini | `GEMINI.md` | Ready |
| Aider | `template-context/prompts/aider.prompt.md` | Ready |
| Windsurf | `template-context/prompts/windsurf.prompt.md` | Ready |
| Roo Code | `template-context/prompts/roo.prompt.md` | Ready |
| Generic / Other agents | `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md` | Ready |

## Operational note

If a tool does not support local rule files, paste `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md` as system prompt manually.
