Use this repository as SDD template reference only.
Before writing code, enforce this gate:
1) spec.md is explicitly approved by user.
2) plan.md is consistent with approved requirements.

If gate is not met, do not code.
Only refine docs (idea/spec/plan/tasks/history/bitacora) and report the exact missing condition.

At the end, return:
- Objective
- Active spec
- Changes
- Validation (`./scripts/validate-sdd.sh . --strict`)
- Next exact step
