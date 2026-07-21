# GitHub Copilot Instructions - SDD Template

Canonical source:
- `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md`
- `sdd.policy.yaml`

Hard stop:
- No code before approved spec and consistent plan.
- No hay código sin spec aprobada y plan consistente.

Execution workspace:
- Use `www/<project-name>/` as the recommended default workspace for runnable code.
- Usa `www/<nombre-proyecto>/` como espacio de trabajo recomendado por defecto para código ejecutable.
- The user may choose another target path.
- If the target project lives inside this template, keep it under `www/`.
- For real external projects, install the compact `spec/` sidecar and keep code in the project root.
- Para proyectos reales externos, instala el sidecar compacto `spec/` y mantén el código en la raíz del proyecto.

Required behavior:
1. Treat this repository as a starter template, not a product backlog.
2. Read `AI_START_HERE.md`, `idea/IDEA_GENERAL.md`, `specs/INDEX.md` first.
3. Work from one active specification.
4. If gate is not met, refine docs (`spec`, `plan`, `tasks`, `history`, `bitacora`) only.
5. Keep traceability in `history.md`, `specs/INDEX.md`, and `bitacora/`.
6. Record a decision in `bitacora/decisiones/YYYY-MM-DD-<slug>.md` when it chose between real alternatives, will be expensive to reverse, or a future reader would ask "why is it like this?". Include a "when to revisit" section, source every rationale (commit, `file:line`, spec history, CHANGELOG, `idea/`), and never invent one.

Validation commands:
- `./scripts/validate-sdd.sh . --strict`
- `./scripts/check-sdd-policy.sh .`
- `./scripts/check-sdd-gate.sh .`
