# Prompt matrix by goal

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Back_to_index-2D3139?style=for-the-badge" alt="Back to index"></a>

---

> Use this matrix to get consistent outputs from any AI assistant.

## Main table

| Goal | Base prompt | Expected output |
|---|---|---|
| Discover legacy system | "Analyze this existing project, document current behavior, and create `idea/IDEA_GENERAL.md` + `specs/001-...` without changing code" | Idea + reverse-engineered baseline spec |
| Create new spec | "Work from `specs/INDEX.md`, define the next numbered spec and complete `spec.md`, `plan.md`, `tasks.md`, `research.md`, `history.md`" | Complete new specification |
| Refine existing spec | "Refine the active spec for scope changes, update `history.md`, and log impact in bitacora" | Updated spec + traceability |
| Prepare implementation | "From active spec, list risks, testing plan, and prioritized tasks before touching code" | Clear technical plan |
| Close session | "Generate handoff with status, pending items, and next step in `bitacora/handoffs/`" | Ready handoff |

## Recommended universal prompt

```text
Use https://github.com/juanklagos/spec-driven-development-template as the main guide.
Work with the idea/specs/bitacora structure.
Before implementation, validate active spec and traceability.
At the end, leave logbook and handoff updates.
```

## Consistency rules

- One major change = one active spec.
- No implementation without `tasks.md`.
- If the idea changes, update `history.md` and logbook.
