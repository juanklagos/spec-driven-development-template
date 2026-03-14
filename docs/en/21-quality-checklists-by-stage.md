# Quality checklists by stage

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Back_to_index-2D3139?style=for-the-badge" alt="Back to index"></a>

---

## 🗣️ Friendly prompt (copy/paste)

Use this when you are not technical and want the AI to do setup + guidance end-to-end:

```text
Using https://github.com/juanklagos/spec-driven-development-template, create everything needed to carry out my project end-to-end.
My project is: [describe your project in plain language].

If my project is new, initialize it with this template and GitHub Spec Kit.
If my project already exists, adapt it to idea/specs/bitacora without breaking current behavior.
Guide me step by step for my level (beginner/intermediate/advanced), using simple language.
Do not skip specification, plan, tasks, refinement trace, logbook, and validation.
```


> Use these checklists at each stage gate. Copy them into your PR description or session log.

## ✅ Stage 1: Before implementation / Pre-coding gate

**Specification readiness:**
- [ ] `idea/IDEA_GENERAL.md` is filled with real content (not just placeholders)
- [ ] Active spec exists in `specs/` and is registered in `specs/INDEX.md`
- [ ] `spec.md` has clear requirements and acceptance criteria
- [ ] `plan.md` describes the technical approach and is consistent with `spec.md`
- [ ] `tasks.md` has a prioritized checklist of concrete actions
- [ ] `research.md` documents any technical investigation or alternatives considered

**Risk assessment:**
- [ ] Out-of-scope items are explicitly listed in `spec.md`
- [ ] Known risks are documented (technical debt, dependencies, unknowns)
- [ ] If splitting from a larger idea: each new spec has clear boundaries

**AI readiness (if applicable):**
- [ ] AI has been fed `IDEA_GENERAL.md` + active `spec.md` as context
- [ ] AI mode is clarified: `template maintenance` or `project execution`

## ✅ Stage 2: Before opening a Pull Request

**Code alignment:**
- [ ] All changes are within the scope defined in `spec.md`
- [ ] No undocumented features or "while I was at it" additions
- [ ] Relevant TDD/BDD tests are written or updated

**Documentation alignment:**
- [ ] `history.md` records what changed and why
- [ ] `tasks.md` reflects current progress (completed items checked)
- [ ] `specs/INDEX.md` status is accurate (Draft → In Progress → Ready)

**Session continuity:**
- [ ] Daily log entry exists in `bitacora/diaria/` (if applicable)
- [ ] Handoff entry prepared in `bitacora/handoffs/`
- [ ] Decisions documented in `bitacora/decisiones/` (if any were made)

## ✅ Stage 3: Before release / deployment

**Completeness:**
- [ ] All acceptance criteria in `spec.md` are met
- [ ] `./scripts/validate-sdd.sh . --strict` passes with 0 errors
- [ ] `./scripts/score-spec.sh --all` shows acceptable quality scores

**Evidence & traceability:**
- [ ] Test evidence recorded in `quality/evidence/`
- [ ] Release checklist completed (see [09-release-checklist](./09-release-checklist.md))
- [ ] Residual risks communicated to stakeholders
- [ ] `specs/INDEX.md` updated with final status

**Communication:**
- [ ] Final handoff entry summarizes the release
- [ ] `PROJECT_LOG.md` has a session entry for the release
- [ ] Next steps are clearly defined (even if "none — spec is complete")

## 🔄 Quick daily checklist (< 2 minutes)

Use this at the start of every working session:

- [ ] Read the latest `bitacora/handoffs/` entry
- [ ] Check `specs/INDEX.md` for the active spec
- [ ] Open `tasks.md` and identify the next unchecked item
- [ ] Begin work
