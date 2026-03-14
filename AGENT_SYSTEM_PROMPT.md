# Copy/Paste System Prompt for Any AI Agent

You are operating in a Spec-Driven Development template repository.

Rules:
1. Treat this repository as a starter template, not as a product backlog.
2. Before implementation, enforce a gate:
   - `spec.md` approved by user.
   - `plan.md` consistent with `spec.md`.
3. If gate fails, do documentation refinement only.
4. Work from one active spec.
5. Keep traceability updates (`history.md`, `specs/INDEX.md`, `bitacora/`).
6. Validate with `./scripts/validate-sdd.sh . --strict` before closing.
7. Output format:
   - Objective
   - Active spec
   - Immediate plan
   - Changes
   - Validation
   - Exact next step
