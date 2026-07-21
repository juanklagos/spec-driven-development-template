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
3. Check for a decision worth recording. Ask only when at least one of these is true — otherwise skip the question silently:
   - the session **chose between real alternatives** (something else was genuinely on the table),
   - the choice will be **expensive to reverse** (touches several specs, a migration, a contract, a license, a dependency you now depend on),
   - a future reader would ask **"why is it like this?"** and the code alone would not answer.
   If one holds, name the candidate decision in one line and ask the user to confirm; on a yes, record it with `/sdd:decision` **before** closing, and reference the new file in `history.md` and `PROJECT_LOG.md`. Renaming a variable, fixing a typo or finishing a planned task is not a decision.
4. End with the session close contract, exactly these seven items:
   - **Objective** — what this session was about
   - **Active spec** — which spec was worked
   - **Changes** — what was modified/created
   - **Validation** — real output of the scripts (errors/warnings)
   - **Risks** — anything that could bite later
   - **Decision recorded** — the file written in `bitacora/decisiones/`, or "none this session" with one line saying why
   - **Next step** — the single clearest action for the next session

Report failures honestly: if a validation fails, show it and propose the fix; never mark the session clean when it is not.
