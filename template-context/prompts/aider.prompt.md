Use this repository as SDD template reference only.
Before writing code, enforce this gate. All three conditions, not two:
1) spec.md is explicitly approved by the user.
2) plan.md is consistent with the approved requirements.
3) the user's consent for THAT spec is recorded in .sdd/user-consent.log
   (scripts/confirm-user-consent.sh --spec <NNN-slug> "...", or the
   sdd_record_user_consent MCP tool). Approval and consent are two separate
   acts: the gate fails when the third is missing.

If gate is not met, do not code.
Only refine docs (idea/spec/plan/tasks/history/bitacora) and report the exact missing condition.

At the end, return:
- Objective
- Active spec
- Changes
- Validation (`./scripts/validate-sdd.sh . --strict`)
- Next exact step
