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

Required behavior:
1. Treat this repository as a starter template, not a product backlog.
2. Read `AI_START_HERE.md`, `idea/IDEA_GENERAL.md`, `specs/INDEX.md` first.
3. Work from one active specification.
4. If gate is not met, refine docs (`spec`, `plan`, `tasks`, `history`, `bitacora`) only.
5. Keep traceability in `history.md`, `specs/INDEX.md`, and `bitacora/`.

Validation commands:
- `./scripts/validate-sdd.sh . --strict`
- `./scripts/check-sdd-policy.sh .`
- `./scripts/check-sdd-gate.sh .`
