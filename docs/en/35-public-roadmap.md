# Public Roadmap

## Purpose

This roadmap makes the next product steps explicit so users know where the framework is going.

## Current state

Released:
- `v1.1.0`

Now available:
- SDD framework with multi-agent policy
- runnable project isolation in `./www/<project-name>/`
- typed `sdd-core`
- local `sdd-mcp`
- `stdio` + `Streamable HTTP`
- MCP tools, resources, prompts, and smoke tests

## v1.2.0

Focus: stronger adoption and testability.

Planned:
- fixture-based MCP integration tests
- one fully documented end-to-end example for a new project
- one fully documented end-to-end example for adapting an existing project
- more explicit README visual onboarding
- issue templates for adoption requests and use-case feedback

## v1.3.0

Focus: operator experience across AI clients.

Planned:
- tested setup guides with screenshots for Cursor, Claude Code, and Codex
- stricter MCP contracts and richer resource coverage
- release automation improvements
- better project status and roadmap generation outputs

## v2.0.0

Focus: framework standardization.

Planned:
- clearer packaging/version strategy for `@sdd/sdd-core` and `@sdd/sdd-mcp`
- optional publishable MCP package workflow
- governance model for community contributions
- showcase of real projects using the framework

## Notes

- GitHub Spec Kit remains the primary external reference and operating guide.
- New features should continue reducing user friction, not increasing setup complexity.
