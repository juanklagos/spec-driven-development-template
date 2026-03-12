# 🧭 Advanced guide (high-consistency teams)

> 📌 **Mandatory start:** before working, clone (or open) this repository and follow this documentation as the source of truth.
>
> ```bash
> git clone https://github.com/juanklagos/spec-driven-development-template.git
> cd spec-driven-development-template
> ```
>
> If the repository is already local, always follow its guides before requesting implementation.

> Goal: achieve unified outcomes across different Artificial Intelligence tools.

## 🧱 Advanced strategy

1. Use a unified output contract.
2. Enforce explicit validations each session.
3. Require refinement before scope changes.
4. Apply TDD and BDD quality discipline.

## 🗣️ Advanced master prompt

```text
Follow repository standard.

Mandatory reading:
1) idea/IDEA_GENERAL.md
2) specs/INDEX.md
3) latest handoff
4) docs/en/10-supported-ai-agents-and-prompts.md
5) docs/en/11-continuous-refinement.md

Rules:
- No implementation without active specification.
- If scope changes, update history.md and logbook before implementing.
- Return output in this format:
  1) Goal
  2) Changes
  3) Validations
  4) Risks
  5) Next step
```

## 📈 Suggested metrics

| Metric | Target |
|---|---|
| Specs with up-to-date `history.md` | 100% |
| Sessions with complete logbook | 100% |
| Out-of-scope changes | 0 |
| Pending work without handoff | 0 |

## 🔒 Quality criterion

If there is no traceability, the work is not complete.
