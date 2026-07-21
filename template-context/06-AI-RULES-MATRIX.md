# AI Rules Matrix / Matriz de reglas para IA

The same SDD guardrails, one rule file per tool. All of them are in place.

## Canonical source

- `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md` (single source of truth)

## Agent mapping

| Agent / Tool | Rule file |
|---|---|
| Generic baseline | `INSTRUCTIONS.md` + `sdd.policy.yaml` |
| Cursor | `.cursorrules` |
| Claude (Desktop/Code) | `.clauderules` + `CLAUDE.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Gemini | `GEMINI.md` |
| Aider | `AIDER.md` + `template-context/prompts/aider.prompt.md` |
| Windsurf | `WINDSURF.md` + `template-context/prompts/windsurf.prompt.md` |
| Roo Code | `ROO.md` + `template-context/prompts/roo.prompt.md` |
| Generic / Other agents | `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md` |

## Operational note

If a tool does not support local rule files, paste `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md` as system prompt manually.

Execution workspace note:
- EN: For runnable target projects in this repository, use `www/<project-name>/`.
- ES: Para proyectos ejecutables en este repositorio, usa `www/<nombre-proyecto>/`.
- EN: For real external projects, install the compact `spec/` sidecar (`./scripts/install-spec-sidecar.sh`) and keep code in the project root.
- ES: Para proyectos reales externos, instala el sidecar compacto `spec/` (`./scripts/install-spec-sidecar.sh`) y mantén el código en la raíz del proyecto.
