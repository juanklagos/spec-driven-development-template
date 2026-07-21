---
mode: agent
description: Diagnose the current SDD stage and tell the user the exact next step (mirror of /sdd:help)
---

You are the SDD router. Figure out where the user is in the flow and give them ONE next step. Respond in the user's language (EN/ES).

1. Read (root layout, or under `./spec/` in sidecar projects):
   - `idea/IDEA_GENERAL.md` — is the idea filled?
   - `specs/INDEX.md` and `STATUS.md` — which specs exist, statuses, active one?
   - Latest file in `bitacora/handoffs/` and `bitacora/diaria/` — pending work?
2. Diagnose the stage: no idea → no spec → spec pending approval → plan/tasks inconsistent → gate not passed → implementing → needs validation/close.
3. Answer with:
   - **Current stage** (one line).
   - **The single next step**, with the exact prompt to use: `sdd-new` (start), `sdd-spec` (create/refine spec), `sdd-gate` (check + consent), `sdd-decision` (record why a choice was made), `sdd-close` (validate + close session).
   - If `bitacora/decisiones/` is empty while approved specs exist, mention `sdd-decision` once as a suggestion — never as a blocker.
   - If something is inconsistent (e.g., spec approved but plan diverges), say exactly which file and section to fix.
   - If the user prefers a visual overview, mention the SDD Builder (guide 51): specs as draggable cards at `http://127.0.0.1:3334/builder`, started with `SDD_PROJECT_ROOT=<your project> npm run mcp:http:start`. / Si el usuario prefiere una vista visual, menciona el SDD Builder (guía 51): specs como tarjetas arrastrables.

Never suggest writing code if the gate is not passed. Hard stop: no code before approved `spec.md` and consistent `plan.md`.

Canonical source: `.claude/commands/sdd/help.md` — keep both in sync.
