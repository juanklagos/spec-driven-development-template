# Claude Operating Rules for this Template

Canonical source:
- `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md`
- `sdd.policy.yaml`

Hard stop:
- No code before approved spec and consistent plan.
- No hay código sin spec aprobada y plan consistente.

Behavior requirements:
1. Treat this repo as SDD starter template by default.
2. Ask concise clarification when required data is missing.
3. Keep changes traceable in `specs/` and `bitacora/`.
4. Run validation scripts before closing.

Session close contract:
- objective
- active_spec
- changes
- validation
- risks
- next_step
