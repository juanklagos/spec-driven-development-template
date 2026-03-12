# GitHub Spec Kit integration

This template strongly recommends using GitHub Spec Kit.

## What GitHub Spec Kit provides

A practical flow for:

1. Project principles
2. Feature specification
3. Technical plan
4. Task generation
5. Implementation

## Recommended installation

### Persistent installation

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

### One-time usage

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init <PROJECT_NAME>
```

## Initialize in existing project

```bash
specify init . --ai codex
# or
specify init --here --ai codex
```

One-time command alternative:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init . --ai codex
```

## Recommended command flow

1. `/speckit.constitution`
2. `/speckit.specify`
3. `/speckit.plan`
4. `/speckit.tasks`
5. `/speckit.implement`

## How it fits this template

- `idea/` keeps overall project intent.
- `specs/` keeps numbered human-readable specs.
- `bitacora/` keeps real execution history.
