# SDD Sidecar Agent Operating System

This project is using the compact `spec/` sidecar layout.

Identity:
- This is a real target project.
- The SDD operating system lives in `./spec/`.
- The framework repository is the canonical reference, but it should not be copied into this project unless explicitly requested.

Hard stop:
- No code before approved spec and consistent plan.
- No hay código sin spec aprobada y plan consistente.

Working rule:
- Use `spec/` as the SDD sidecar and keep runnable code in project root.
- Usa `spec/` como sidecar SDD y mantén el código ejecutable en la raíz del proyecto.

Minimum workflow:
1. Read `idea/IDEA_GENERAL.md`
2. Read `specs/INDEX.md`
3. Work from one active spec
4. Update `history.md` and `bitacora/` when scope changes
5. Record explicit user consent before implementation
6. Record decisions in `bitacora/decisiones/YYYY-MM-DD-<slug>.md` (template: `bitacora/templates/DECISION_TEMPLATE.md`)
7. Run validation before closing the session

Decision log rule:
- Record a decision when it chose between real alternatives, when it will be expensive to reverse, or when a future reader would ask "why is it like this?".
- Registra una decisión cuando eligió entre alternativas reales, cuando revertirla será cara, o cuando alguien preguntará después "¿por qué es así?".
- Every record includes a "when to revisit" section, and every rationale points at a source (commit, `file:line`, spec history, CHANGELOG, `idea/`). Never invent rationale or dates.
- Cada registro incluye "cuándo revisar", y cada justificación apunta a una fuente. Nunca inventes justificación ni fechas.
