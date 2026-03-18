# sdd-core

Core library for Spec-Driven Development operations.

Purpose:
- centralize the reusable business logic behind the template
- avoid using shell stdout as the primary contract
- provide typed functions for CLI, MCP, and future integrations

Initial responsibilities:
- workspace path validation
- spec numbering and creation
- policy loading and interpretation
- SDD validation
- implementation gate checks
- user consent recording

Target consumers:
- `scripts/` compatibility layer
- `packages/sdd-mcp/`

Current exported operations:
- `createWorkspace`
- `createSpec`
- `listSpecs`
- `validateProject`
- `checkGate`
- `recordUserConsent`
- `generateStatus`
- `generateRoadmap`
- `appendProjectLogEntry`
- `writeDailyLog`
- `writeHandoff`
- `writeDecision`
