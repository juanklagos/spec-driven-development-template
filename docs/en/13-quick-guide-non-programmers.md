# Quick guide for non-programmers

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
- `spec.md` (requirements + acceptance)
- `plan.md` (how to build)
- `tasks.md` (checklist)
- `history.md` (initial entry)

4. Validate:

```bash
./scripts/validate-sdd.sh . --strict
./scripts/check-sdd-gate.sh .
```

5. Write session log in `bitacora/global/PROJECT_LOG.md`.

## Rules you must keep
- Do not implement code before approved `spec.md` + consistent `plan.md`.
- If idea changes, update docs first, then implementation.

## Use these prompts
- [Prompt matrix](./19-prompt-matrix-by-goal.md)
- [Validated prompt bank](./26-validated-prompt-bank.md)

## Next step
Move to the intermediate guide:
- [docs/en/14-intermediate-guide.md](./14-intermediate-guide.md)
