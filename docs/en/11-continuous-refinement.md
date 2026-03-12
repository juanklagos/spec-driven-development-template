# 🔁 Continuous refinement (Idea and Specifications)

This guide explains how to update project documentation when ideas, priorities, or requirements change.

## 🎯 Goal

Keep consistency between:

- `idea/IDEA_GENERAL.md`
- `specs/` (all specifications)
- `bitacora/` (real execution records)

## 📌 Main rule

Every relevant change must be reflected in 3 places:

1. Affected idea or specification.
2. Specification history file.
3. Session logbook.

## 🧭 Change type and required action

| Change type | Required action | Where to register |
|---|---|---|
| Product vision change | Update general idea | `idea/IDEA_GENERAL.md` + `bitacora/global/PROJECT_LOG.md` |
| New requirement | Create/update specification | `specs/NNN-.../spec.md` + `specs/NNN-.../history.md` |
| Technical implementation change | Update plan and tasks | `plan.md`, `tasks.md`, `history.md` |
| Findings-based adjustment | Update research | `research.md`, `history.md`, daily log |
| Scope change | Mark impact and priority | `specs/INDEX.md` + `history.md` |

## 📈 Refinement visual flow

```mermaid
flowchart LR
  A["Change detected"] --> B["Classify change type"]
  B --> C["Update Idea or Spec"]
  C --> D["Register in history.md"]
  D --> E["Update logbook"]
  E --> F["Revalidate plan and tasks"]
```

## ✅ Quick refinement checklist

- [ ] Does this change affect project idea?
- [ ] Was active specification updated?
- [ ] Was a `history.md` entry added?
- [ ] Was logbook updated?
- [ ] Were tasks reviewed for consistency?

## 📝 Suggested `history.md` format

| Date | Change type | Summary | Impacted files | Owner |
|---|---|---|---|---|
| 2026-03-12 | Scope change | Split spec into two phases | `spec.md`, `tasks.md` | AI |

## 🤖 Rule for Artificial Intelligence tools

If you detect contradiction between idea and specification:

1. Do not implement immediately.
2. Propose refinement.
3. Update documentation.
4. Continue implementation only after alignment.
