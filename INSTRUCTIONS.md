# AI Instructions / Instrucciones IA

Canonical source:
- `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md`
- `sdd.policy.yaml`

Hard stop (mandatory):
- No code before approved spec and consistent plan.
- No hay código sin spec aprobada y plan consistente.

Execution root (mandatory for runnable projects):
- Use `www/<project-name>/` as execution root for runnable code.
- Usa `www/<nombre-proyecto>/` como raíz de ejecución para código ejecutable.

This repository is a starter template, not a product backlog.
Este repositorio es un template de arranque, no un backlog de producto.

Minimum execution flow:
1. Read `AI_START_HERE.md`
2. Read `idea/IDEA_GENERAL.md`
3. Read `specs/INDEX.md`
4. Confirm execution root (`www/<project-name>/`) for target execution
   - create it with: `./scripts/create-www-project.sh <project-name> <assistant>`
5. Work with one active spec
6. Validate and update logbook

Copy/paste base prompt:

```text
Using https://github.com/juanklagos/spec-driven-development-template, guide me step by step with SDD for my project.
My project is: [describe project in plain language].
No code before approved spec and consistent plan.

Usando https://github.com/juanklagos/spec-driven-development-template, guíame paso a paso con SDD para mi proyecto.
Mi proyecto es: [explica el proyecto en lenguaje simple].
No hay código sin spec aprobada y plan consistente.
```
