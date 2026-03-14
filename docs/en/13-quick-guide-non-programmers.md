# 🚀 Quick guide for non-programmers

## 🌍 Language pair / Par de idioma

- English: **13-quick-guide-non-programmers.md**
- Español: [../es/13-guia-rapida-no-programadores.md](../es/13-guia-rapida-no-programadores.md)


## 🗣️ Friendly prompt (copy/paste)

```text
Using https://github.com/juanklagos/spec-driven-development-template, create everything needed to carry out my project end-to-end.
My project is: [describe your project in plain language].
Guide me step by step for my level and do not skip specification, plan, tasks, logbook, and validation.
```


Who is this for:
- You are starting with SDD and want clear steps without technical overload.

## Goal
Finish one clean cycle:
1. idea defined
2. first spec created
3. first log entry written
4. validations executed

## Steps

1. Fill `idea/IDEA_GENERAL.md` in simple language.
2. Create first spec:

```bash
./scripts/new-spec.sh "my-first-feature" "Owner"
```

3. Complete in `specs/001-.../`:
- `spec.md`
- `plan.md`
- `tasks.md`
- `history.md`

4. Validate:

```bash
./scripts/validate-sdd.sh . --strict
./scripts/check-sdd-gate.sh .
```

5. Write session log in `bitacora/global/PROJECT_LOG.md`.

## Prompt pack (Beginner)

### Prompt A: Complete idea
```text
Act as a beginner-friendly SDD coach.
Help me complete idea/IDEA_GENERAL.md with simple language.
Ask one short question at a time.
Do not assume missing information.
```

### Prompt B: Create first spec
```text
Based on idea/IDEA_GENERAL.md, create specs/001-... with:
spec.md, plan.md, tasks.md, history.md.
Use clear wording and avoid unexplained abbreviations.
Do not implement code.
```

### Prompt C: Pre-implementation check
```text
Review spec.md, plan.md and tasks.md for consistency.
List gaps and exact fixes before implementation.
```

## Rules you must keep
- No code before approved `spec.md` + consistent `plan.md`.
- If idea changes, update docs first.

## More prompts
- [Prompt matrix](./19-prompt-matrix-by-goal.md)
- [Validated prompt bank](./26-validated-prompt-bank.md)

## Next step
- [docs/en/14-intermediate-guide.md](./14-intermediate-guide.md)

## 💡 Quick tips

- Start from a simple one-paragraph project description.
- Ask the AI to confirm the active spec before coding.
- Close every session with validation and a clear next step.

## 📊 Visual flow

```mermaid
flowchart LR
  A["Project idea"] --> B["Spec approved"]
  B --> C["Plan aligned"]
  C --> D["Tasks prioritized"]
  D --> E["Implementation"]
  E --> F["Validation + Logbook"]
```
