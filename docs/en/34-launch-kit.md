# Launch Kit

## Purpose

This page stores short launch-ready copy for diffusion of the framework.

## Launch flow

```mermaid
flowchart LR
  A["Release"] --> B["Short update"]
  B --> C["Social post"]
  C --> D["Media asset"]
  D --> E["Community feedback"]
```

## Short update

```text
Spec-Driven Development Template now includes a real MCP server.

New in v1.2.0:
- local `sdd-mcp` server
- stdio + Streamable HTTP
- copy-paste configs for Cursor, Claude Code, and Codex
- active project resources for idea, specs, logbook, and handoffs

Repository:
https://github.com/juanklagos/spec-driven-development-template
```

## LinkedIn post

```text
I just shipped v1.2.0 of my Spec-Driven Development Template.

This repository is evolving into an operational SDD framework, not just a documentation starter.

What it now includes:
- GitHub Spec Kit as the primary reference flow
- multi-agent operating rules
- runnable work defaults cleanly to ./www/<project-name> while still supporting external target paths
- local MCP server (`sdd-mcp`)
- stdio + Streamable HTTP
- typed SDD core
- MCP integration tests and CI
- copy-paste client configs for Cursor, Claude Code, and Codex

Repository:
https://github.com/juanklagos/spec-driven-development-template

The goal is to reduce friction from idea -> spec -> plan -> tasks -> validation, and make different AI assistants behave more consistently across real project work.
```

## Short release note

```text
v1.2.0 strengthens the framework as an operational SDD system: MCP CI, integration tests, package version alignment, client setup recipes, public roadmap, media assets, and adoption examples.
```
