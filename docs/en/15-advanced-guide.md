# 🧭 Advanced guide (high-consistency teams)

Who is this for:
- Teams standardizing SDD across multiple AI tools and contributors.

## Goal
Deliver equivalent outcomes regardless of agent/model, with governance and quality gates.

## Advanced operating model

1. Canonical AI instructions:
- `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md`

2. Spec Kit-first workflow:
- `/speckit.constitution`
- `/speckit.specify`
- `/speckit.plan`
- `/speckit.tasks`
- `/speckit.implement`

3. Hard gates:
- approved `spec.md`
- consistent `plan.md`
- passing validations

## Prompt pack (Advanced)

### Prompt A: Multi-agent standard mode
```text
Operate with strict SDD governance and Spec Kit-first flow.
Enforce gate: no code without approved spec and consistent plan.
Use one active spec only.
```

### Prompt B: Refinement protocol
```text
Detect scope/priority/requirement changes.
If detected, stop implementation and update:
- active spec
- history.md
- specs/INDEX.md (if status/priority changed)
- bitacora
Then continue.
```

### Prompt C: Governance closeout
```text
Close this session with:
objective, active spec, changes, validations, risks, exact next step.
Include release/governance impacts if any.
```

## Governance checks
- SemVer release discipline.
- Changelog updated per release.
- No merge when SDD gate fails.

## Metrics to track
- % specs with up-to-date `history.md`
- % sessions with full `bitacora`
- out-of-scope changes per sprint
- cross-agent consistency rate

## Validation
```bash
./scripts/validate-sdd.sh . --strict
./scripts/check-sdd-gate.sh .
```

## More prompts
- [Prompt matrix](./19-prompt-matrix-by-goal.md)
- [Validated prompt bank](./26-validated-prompt-bank.md)
- [Prompts by template feature](./30-prompts-by-template-feature.md)

## Next references
- [Quality checklists](./21-quality-checklists-by-stage.md)
- [Architecture decisions](./24-architecture-decisions.md)
- [Release checklist](./09-release-checklist.md)
