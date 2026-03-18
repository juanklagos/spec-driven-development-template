# AI Instructions / Instrucciones IA

Canonical source:
- `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md`
- `sdd.policy.yaml`

Hard stop (mandatory):
- No code before approved spec and consistent plan.
- No hay código sin spec aprobada y plan consistente.

User consent (mandatory):
- Record explicit user consent before starting execution/implementation for an approved spec.
- Registra consentimiento explícito del usuario antes de iniciar ejecución/implementación sobre una spec aprobada.
- Command / Comando:
  `./scripts/confirm-user-consent.sh "User approved scope X"`

Execution workspace (recommended default):
- Use `www/<project-name>/` as the recommended default workspace for runnable code.
- Usa `www/<nombre-proyecto>/` como espacio de trabajo recomendado por defecto para código ejecutable.
- The user may choose another target path.
- El usuario puede elegir otra ruta destino.
- If the target project lives inside this template, keep it under `www/`.
- Si el proyecto destino vive dentro de este template, mantenlo dentro de `www/`.

This repository is a starter template, not a product backlog.
Este repositorio es un template de arranque, no un backlog de producto.

Minimum execution flow:
1. Read `AI_START_HERE.md`
2. Read `idea/IDEA_GENERAL.md`
3. Read `specs/INDEX.md`
4. Confirm the target project path
   - recommended default: `./scripts/create-www-project.sh <project-name> <assistant>`
   - external target path: `./scripts/init-project.sh /absolute/path/to/project`
5. Work with one active spec
6. Validate and update logbook

Copy/paste base prompt:

```text
Using https://github.com/juanklagos/spec-driven-development-template, guide me step by step with SDD for my project.
My project is: [describe project in plain language].
Prefer ./www/<project-name> as the default workspace unless I choose another path.
No code before approved spec and consistent plan.

Usando https://github.com/juanklagos/spec-driven-development-template, guíame paso a paso con SDD para mi proyecto.
Mi proyecto es: [explica el proyecto en lenguaje simple].
Prefiere ./www/<nombre-proyecto> como espacio por defecto salvo que yo elija otra ruta.
No hay código sin spec aprobada y plan consistente.
```
