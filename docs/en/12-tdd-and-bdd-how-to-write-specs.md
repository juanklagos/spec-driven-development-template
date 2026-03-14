# 🧪 TDD and BDD: how to write strong specifications

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Back_to_index-2D3139?style=for-the-badge" alt="Back to index"></a>

---

> [!TIP]
> For startup instructions and prompts, use:
> - [`AI_START_HERE.md`](../../AI_START_HERE.md)
> - [Prompt matrix](./19-prompt-matrix-by-goal.md)
> - [Validated prompt bank](./26-validated-prompt-bank.md)



This section is a repository bonus to connect specification-first development with quality practices.

## 1) Simple difference between TDD and BDD

| Approach | Meaning | Main question | Expected output |
|---|---|---|---|
| TDD | Test-Driven Development | How do we validate technical behavior? | Tests that drive implementation |
| BDD | Behavior-Driven Development | How should the system behave for users? | Clear business scenarios |

## 2) Relation with this template

- `spec.md` defines expected behavior (strong BDD alignment).
- `tasks.md` can include explicit technical test tasks (strong TDD alignment).
- `contracts/` provides verifiable rules for both.

## 3) How to write a strong spec for TDD

### Recommended structure

1. In `spec.md`, define precise, measurable rules.
2. In `plan.md`, define technical test strategy.
3. In `tasks.md`, include test tasks before implementation tasks.

### TDD checklist

- [ ] Every requirement has a technical validation.
- [ ] Test tasks are explicit and executable.
- [ ] Failure criteria are clear before implementation.
- [ ] Test results are logged in the logbook.

## 4) How to write a strong spec for BDD

### Recommended structure

1. In `spec.md`, write scenarios using:
   - Given
   - When
   - Then
2. Describe observable behavior, not internal code details.
3. Use language understandable by business and technical audiences.

### BDD checklist

- [ ] Scenarios are clear and verifiable.
- [ ] Language is unambiguous.
- [ ] Every scenario maps to a requirement.
- [ ] Behavior can be demonstrated in a functional review.

## 5) Quick scenario template

```text
Given [initial context]
When [action or event]
Then [expected result]
```

## 6) Recommended combined strategy (TDD + BDD)

1. Define behavior in `spec.md` (BDD).
2. Translate behavior into technical tasks in `tasks.md` (TDD).
3. Implement in short iterations.
4. Register findings and updates in `history.md` and `bitacora/`.

## 7) Common mistakes

- Writing vague specs without verifiable criteria.
- Mixing business scope and technical detail in one section.
- Not updating `history.md` when scenarios change.
- Implementing without confirming the spec is still current.
