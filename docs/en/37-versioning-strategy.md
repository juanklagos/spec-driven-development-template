# Versioning Strategy

## Purpose

This document defines how versioning should work across the framework and its internal packages.

## Version alignment map

```mermaid
flowchart LR
  A["Framework version"] --> B["@juanklagos/sdd-core"]
  A --> C["@juanklagos/sdd-mcp"]
```

## Current rule

- repository release version is the canonical public version
- `@juanklagos/sdd-core` and `@juanklagos/sdd-mcp` should stay aligned with the repository minor release

Current alignment:
- framework: `1.6.0`
- `@juanklagos/sdd-core`: `1.6.0`
- `@juanklagos/sdd-mcp`: `1.6.0`

## Practical release policy

### Patch

Use patch releases for:
- documentation fixes
- CI fixes
- non-breaking script fixes
- non-breaking MCP compatibility fixes

### Minor

Use minor releases for:
- new tools
- new resource templates
- new onboarding flows
- new examples
- new guides that materially improve adoption

### Major

Use major releases for:
- breaking workflow changes
- breaking policy/gate behavior
- breaking MCP tool contracts
- breaking package structure changes

## Package rule

- internal packages remain `private` until there is a deliberate package publishing workflow
- while private, keep versions aligned with the framework release to avoid confusion
- if packages become public later, keep semver but publish changelogs per package
