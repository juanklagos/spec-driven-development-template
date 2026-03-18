# MCP End-to-End Example

This example shows a realistic path for a new project using the framework plus the local MCP server.

## Goal

Project:
- simple studio landing page with contact capture

Outcome:
- idea documented
- first spec created
- plan and tasks aligned
- project log updated
- runnable work kept inside `./www/<project-name>/`

## Example operator prompt

```text
Using https://github.com/juanklagos/spec-driven-development-template, create everything needed to execute my project end-to-end.
My project is: a studio landing page with sections for services, testimonials, and a contact form.
Create the SDD base first.
Keep runnable work inside ./www/<project-name>.
Use the MCP server when available.
Do not implement code before approved spec and consistent plan.
Ask for explicit consent only when implementation is about to start.
```

## Example MCP flow

1. Read:
   - `sdd://policy/current`
   - `sdd://docs/quickstart`
2. Run `sdd_create_workspace`
3. Run `sdd_create_spec`
4. Review and approve the generated `spec.md`
5. Align `plan.md` and `tasks.md`
6. Run `sdd_validate`
7. Run `sdd_check_gate`
8. Record consent only before implementation with `sdd_record_user_consent`
9. Generate `STATUS.md` and roadmap with MCP tools

## Snapshot

- [idea/IDEA_GENERAL.md](./idea/IDEA_GENERAL.md)
- [specs/INDEX.md](./specs/INDEX.md)
- [specs/001-studio-landing-mvp/spec.md](./specs/001-studio-landing-mvp/spec.md)
- [specs/001-studio-landing-mvp/plan.md](./specs/001-studio-landing-mvp/plan.md)
- [specs/001-studio-landing-mvp/tasks.md](./specs/001-studio-landing-mvp/tasks.md)
- [bitacora/global/PROJECT_LOG.md](./bitacora/global/PROJECT_LOG.md)
