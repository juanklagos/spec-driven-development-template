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
  sidecar: `./spec/scripts/confirm-user-consent.sh "User approved scope X"`
  standalone: `./scripts/confirm-user-consent.sh "User approved scope X"`

Execution workspace (recommended default):
- Use `spec/` as the recommended compact sidecar inside real projects.
- Usa `spec/` como sidecar compacto recomendado dentro de proyectos reales.
- Keep runnable code in the project root.
- Mantén el código ejecutable en la raíz del proyecto.
- This is the recommended default workspace inside a real project.
- Este es el espacio de trabajo recomendado por defecto dentro de un proyecto real.
- Use `www/<project-name>/` only when the project itself should live inside this template repository.
- Usa `www/<nombre-proyecto>/` solo cuando el proyecto deba vivir dentro de este repositorio template.
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
   - recommended clean workspace inside this repo: `./scripts/create-www-project.sh <project-name> <assistant>`
   - recommended external target path: `./scripts/install-spec-sidecar.sh /absolute/path/to/project`
   - full standalone workspace only when explicitly requested: `./scripts/init-project.sh /absolute/path/to/project --profile=full`
5. Work with one active spec
6. Validate and update logbook

Copy/paste base prompt:

```text
Using https://github.com/juanklagos/spec-driven-development-template, guide me step by step with SDD for my project.
My project is: [describe project in plain language].
Do not clone the full repository into my project unless I explicitly ask for that mode.
Install only the compact `spec/` sidecar by default.
No code before approved spec and consistent plan.

Usando https://github.com/juanklagos/spec-driven-development-template, guíame paso a paso con SDD para mi proyecto.
Mi proyecto es: [explica el proyecto en lenguaje simple].
No clones el repositorio completo dentro de mi proyecto salvo que yo pida ese modo.
Instala solo el sidecar compacto `spec/` por defecto.
No hay código sin spec aprobada y plan consistente.
```
