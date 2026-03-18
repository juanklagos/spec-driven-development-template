# sdd-mcp

MCP server for the Spec-Driven Development framework.

Purpose:
- expose SDD operations as MCP tools
- expose framework and project context as MCP resources
- expose beginner-friendly SDD flows as MCP prompts

Design goals:
- prefer `./www/<project-name>/` as the recommended default workspace inside this template
- support external target project paths on project-root-based tools
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
npm run mcp:http:smoke
npm run mcp:start
npm run mcp:http:start
```

Current MVP tools:
- `sdd_create_workspace`
- `sdd_create_spec`
- `sdd_validate`
- `sdd_check_gate`
- `sdd_record_user_consent`
- `sdd_list_specs`
- `sdd_generate_status`
- `sdd_generate_roadmap`
- `sdd_append_project_log`
- `sdd_write_daily_log`
- `sdd_write_handoff`
- `sdd_write_decision`

Current resources:
- `sdd-policy`
- `sdd-ai-start`
- `sdd-easy-mcp-guide`
- `sdd-quickstart`
- `sdd-spec-template`
- `sdd-project-index`
- `sdd-project-log`
- `sdd-project-latest-handoff`
- `sdd-project-idea`
- `sdd-spec-document`

Current prompts:
- `start_new_sdd_project`
- `adapt_existing_project_to_sdd`
- `close_sdd_session`
- `easy_start_project`
- `easy_create_spec`
- `easy_show_structure`
- `easy_validate_project`
- `easy_show_next_step`
- `easy_close_session`

Implementation notes:
- tools expose `outputSchema`
- handlers return `structuredContent`
- `stdio` and `Streamable HTTP` are both supported

Config examples:
- `packages/sdd-mcp/examples/.cursor/mcp.json`
- `packages/sdd-mcp/examples/.mcp.json`
- `packages/sdd-mcp/examples/codex.config.toml`

Reference docs:
- `docs/en/43-easy-mcp-guide.md`
- `docs/es/43-guia-mcp-facil.md`
- `docs/en/44-hosted-mcp-onboarding-model.md`
- `docs/es/44-modelo-onboarding-mcp-alojado.md`
- `docs/en/45-client-visual-examples-for-easy-mcp.md`
- `docs/es/45-ejemplos-visuales-clientes-mcp-facil.md`
- `docs/en/33-mcp-server-guide.md`
- `docs/es/33-guia-servidor-mcp.md`
