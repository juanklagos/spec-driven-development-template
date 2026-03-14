# AI Start Here / Inicio IA aquí

Use this repository as the primary SDD reference:
- `https://github.com/juanklagos/spec-driven-development-template`

## Mandatory context / Contexto obligatorio

Read in this order before implementation:
1. `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md`
2. `idea/IDEA_GENERAL.md`
3. `specs/INDEX.md`
4. Latest handoff in `bitacora/handoffs/` (if exists)

## Hard stop (SDD gate)

No code until both are true:
1. `spec.md` approved by user.
2. `plan.md` consistent with `spec.md`.

If missing:
- refine docs first (`spec/plan/tasks/history`), then continue.

## Recommended startup flow

### New project
```bash
./scripts/init-project-with-spec-kit.sh /path/project codex
```

### Existing project
```bash
specify init . --ai codex
```

Then run:
1. `/speckit.constitution`
2. `/speckit.specify`
3. `/speckit.plan`
4. `/speckit.tasks`
5. `/speckit.implement`

## Session close checks

```bash
./scripts/validate-sdd.sh . --strict
./scripts/check-sdd-gate.sh .
```

Update:
- `specs/INDEX.md` (if status/priority changed)
- active spec `history.md`
- `bitacora/global/PROJECT_LOG.md`

## Prompts (short links)
- Prompt matrix: [EN](./docs/en/19-prompt-matrix-by-goal.md) | [ES](./docs/es/19-matriz-prompts-por-objetivo.md)
- Validated prompts: [EN](./docs/en/26-validated-prompt-bank.md) | [ES](./docs/es/26-banco-prompts-validados.md)
