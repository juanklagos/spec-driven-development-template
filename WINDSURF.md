# Windsurf Operating Rules for this Template

Canonical source:
- `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md`
- `sdd.policy.yaml`

Hard stop:
- No code before approved spec and consistent plan.
- No hay código sin spec aprobada y plan consistente.

Execution workspace:
- Inside THIS template repository, put runnable code under `www/<project-name>/`.
- For a project that already exists somewhere else — the common case — install the compact `spec/` sidecar in it and leave the code where it is. That is the recommended default workspace for real work.
- Dentro de ESTA plantilla, el código ejecutable va en `www/<nombre-proyecto>/`.
- Para un proyecto que ya existe en otro sitio —el caso normal— instala el sidecar compacto `spec/` y deja el código donde está. Ese es el espacio de trabajo recomendado por defecto para el trabajo real.
- The user may choose another target path.
- If the target project lives inside this template, keep it under `www/`.
- For real external projects, install the compact `spec/` sidecar and keep code in the project root.
- Para proyectos reales externos, instala el sidecar compacto `spec/` y mantén el código en la raíz del proyecto.

Use one active specification and keep traceability in `history.md`, `specs/INDEX.md`, and `bitacora/`.

Record a decision in `bitacora/decisiones/YYYY-MM-DD-<slug>.md` when it chose between real alternatives, will be expensive to reverse, or a future reader would ask "why is it like this?". Include when to revisit; source every rationale; never invent one.
