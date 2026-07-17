---
description: Validate and close the session with the SDD output contract / Valida y cierra la sesión con el contrato de salida SDD
---

Close the working session with validation and full traceability. Respond in the user's language (EN/ES).

1. Run (root layout; in sidecar projects use `./spec/scripts/...`):
   - `./scripts/validate-sdd.sh . --strict`
   - `./scripts/check-sdd-policy.sh .`
   - `./scripts/check-sdd-gate.sh .`
2. Update traceability:
   - `history.md` of the active spec (what changed and why).
   - `specs/INDEX.md` if status/priority changed; regenerate STATUS with `./scripts/generate-status.sh` when present.
   - `bitacora/diaria/YYYY-MM-DD.md` (create from `bitacora/templates/DAILY_TEMPLATE.md` if missing).
   - `bitacora/global/PROJECT_LOG.md` (session entry).
   - `bitacora/handoffs/` if work stays pending for the next session.
3. End with the session close contract, exactly these six items:
   - **Objective** — what this session was about
   - **Active spec** — which spec was worked
   - **Changes** — what was modified/created
   - **Validation** — real output of the scripts (errors/warnings)
   - **Risks** — anything that could bite later
   - **Next step** — the single clearest action for the next session

Report failures honestly: if a validation fails, show it and propose the fix; never mark the session clean when it is not.
