# SDD Sidecar Agent Guide

This project uses a compact SDD sidecar under `./spec/`.

Canonical source:
- `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md`

No code before approved spec and consistent plan.
Use spec/ as the SDD sidecar and keep runnable code in project root.

Rules:
- Treat this as a target project, not as the template repository.
- Do not clone or copy the full framework repository into this project unless the user explicitly asks for a full standalone workspace.
- Keep runnable code in the project root.
- Keep SDD artifacts inside `./spec/`.
- Read `idea/IDEA_GENERAL.md` and `specs/INDEX.md` before implementation work.
- No code before approved spec and consistent plan.

Recommended flow:
1. Refine `idea/IDEA_GENERAL.md`
2. Create or update one active spec
3. Align `plan.md`
4. Align `tasks.md`
5. Ask for explicit consent before implementation
6. Validate and update `bitacora/`

Useful commands:
- `./scripts/new-spec.sh "feature-name" "Owner"`
- `./scripts/confirm-user-consent.sh "User approved implementation for spec 001"`
- `./scripts/validate-sdd.sh . --strict`
- `./scripts/check-sdd-policy.sh .`
- `./scripts/check-sdd-gate.sh .`
