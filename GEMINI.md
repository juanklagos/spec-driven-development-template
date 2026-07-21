# Gemini Operating Rules for this Template

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

Decision log:
- Record a decision in `bitacora/decisiones/YYYY-MM-DD-<slug>.md` (use `/sdd:decision`) when it chose between real alternatives, when it will be expensive to reverse, or when a future reader would ask "why is it like this?".
- Registra una decisión cuando eligió entre alternativas reales, cuando revertirla será caro, o cuando alguien preguntaría después "¿por qué es así?".
- Every record includes a "when to revisit" section, and every rationale points at a source. Never invent rationale or dates.

Session contract:
- objective
- active_spec
- changes
- validation
- risks
- decision_recorded
- next_step
