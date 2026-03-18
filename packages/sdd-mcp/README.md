# sdd-mcp

MCP server for the Spec-Driven Development framework.

Purpose:
- expose SDD operations as MCP tools
- expose framework and project context as MCP resources
- expose beginner-friendly SDD flows as MCP prompts

Design goals:
- keep all runnable project work inside the current workspace root
- enforce `./www/<project-name>/` for runnable target projects
- block implementation without approved spec and consistent plan
- require user consent only before implementation starts

Target MCP surface:
- Tools: create workspace, create spec, validate, check gate, record consent, generate status
- Resources: policy, templates, quickstart, active project context
- Prompts: new project, adapt existing project, first spec, session close

Local development:

```bash
npm install
npm run typecheck
npm run build
npm run mcp:smoke
npm run mcp:start
```

Current MVP tools:
- `sdd_create_workspace`
- `sdd_create_spec`
- `sdd_validate`
- `sdd_check_gate`
- `sdd_record_user_consent`
- `sdd_list_specs`

Reference docs:
- `docs/en/33-mcp-server-guide.md`
- `docs/es/33-guia-servidor-mcp.md`
