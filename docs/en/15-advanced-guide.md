# Advanced guide (high-consistency teams)

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

4. Mandatory session output contract:
- objective
- active spec
- changes
- validation
- risks
- exact next step

## Governance checks
- SemVer release discipline.
- Changelog updated per release.
- No merge when SDD gate fails.

## Metrics to track
- % specs with up-to-date `history.md`
- % sessions with full `bitacora`
- out-of-scope changes per sprint
- cross-agent consistency rate

## Next references
- [Quality checklists](./21-quality-checklists-by-stage.md)
- [Architecture decisions](./24-architecture-decisions.md)
- [Release checklist](./09-release-checklist.md)
