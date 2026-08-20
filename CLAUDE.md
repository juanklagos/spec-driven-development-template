# Claude Operating Rules for this Template

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

Behavior requirements:
1. Treat this repo as SDD starter template by default.
2. Ask concise clarification when required data is missing.
3. Keep changes traceable in `specs/` and `bitacora/`.
4. Run validation scripts before closing.

Decision log:
- Record a decision in `bitacora/decisiones/YYYY-MM-DD-<slug>.md` (use `/sdd:decision`) when it chose between real alternatives, when it will be expensive to reverse, or when a future reader would ask "why is it like this?".
- Registra una decisión cuando eligió entre alternativas reales, cuando revertirla será caro, o cuando alguien preguntaría después "¿por qué es así?".
- Every record includes a "when to revisit" section, and every rationale points at a source (commit, `file:line`, spec history, CHANGELOG, `idea/`). Never invent rationale or dates.

Approval and record rule:
- Approval evidence records WHAT was approved, its scope, the document or proposal it was approved against, and the date. Never a transcription of the chat.
- La evidencia de aprobación registra QUÉ se aprobó, con qué alcance y contra qué documento, con la fecha. Nunca la transcripción del chat.
- "hazlo", "dale", "arranca" and the like are not evidence: they say nothing about what was approved.
- The same rule governs `bitacora/` and the summary of each `.sdd/user-consent.log` line.
- Correcting the wording of an existing record is legitimate; changing what was approved, by whom, or when is not.

Session close contract:
- objective
- active_spec
- changes
- validation
- risks
- decision_recorded
- next_step
