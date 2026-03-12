# 🤖 GitHub Spec Kit integration

This template recommends GitHub Spec Kit as the main workflow engine.

## Quick map

| Phase | Command | Purpose |
|---|---|---|
| 1 | `/speckit.constitution` | Define project principles |
| 2 | `/speckit.specify` | Define what to build |
| 3 | `/speckit.plan` | Define how to build |
| 4 | `/speckit.tasks` | Generate executable tasks |
| 5 | `/speckit.implement` | Execute implementation |

## Visual flow

```mermaid
flowchart LR
  A["Constitution"] --> B["Specification"]
  B --> C["Plan"]
  C --> D["Tasks"]
  D --> E["Implementation"]
  E --> F["Logbook + Refinement"]
```

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

## How it fits this template

- `idea/` defines global project intent.
- `specs/` stores numbered specifications.
- `bitacora/` stores real execution trace.

## Practical recommendation

After Spec Kit commands, always update:

- `specs/INDEX.md`
- active spec `history.md`
- `bitacora/global/PROJECT_LOG.md`
- `bitacora/diaria/`
- `bitacora/handoffs/` when pending work exists
