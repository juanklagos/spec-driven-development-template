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
6. Run validation before closing the session
