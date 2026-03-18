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

