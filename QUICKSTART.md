# Quickstart / Inicio rápido

Goal / Objetivo:
- EN: create your first valid SDD workflow quickly.
- ES: crear tu primer flujo SDD válido rápidamente.

## 1) Get the template / Obtén el template

```bash
npx degit juanklagos/spec-driven-development-template my-project
cd my-project
```

Alternative / Alternativa:

```bash
git clone https://github.com/juanklagos/spec-driven-development-template.git my-project
cd my-project
```

## 2) Initialize GitHub Spec Kit (recommended)

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
specify init . --ai codex
```

One-shot / Uso puntual:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init . --ai codex
```

## 3) Define the idea / Define la idea

Complete:
- `idea/IDEA_GENERAL.md`

Minimum fields / Campos mínimos:
- Project name / Nombre
- Problem / Problema
- Main goal / Objetivo principal
- MVP scope / Alcance inicial

## 4) Create first spec / Crea la primera spec

```bash
./scripts/new-spec.sh "my-feature" "Owner"
```

Then fill:
- `specs/001-.../spec.md`
- `specs/001-.../plan.md`
- `specs/001-.../tasks.md`
- `specs/001-.../history.md`

## 5) Follow Spec Kit flow / Sigue el flujo Spec Kit

1. `/speckit.constitution`
2. `/speckit.specify`
3. `/speckit.plan`
4. `/speckit.tasks`
5. `/speckit.implement`

## 6) Log session / Registra sesión

Update:
- `bitacora/global/PROJECT_LOG.md`
- `bitacora/diaria/AAAA-MM-DD.md`
- `bitacora/handoffs/` (if pending work / si hay pendientes)

## 7) Validate / Valida

```bash
./scripts/validate-sdd.sh . --strict
./scripts/check-sdd-gate.sh .
```

## Next / Siguiente

- Beginner path: [EN](./docs/en/13-quick-guide-non-programmers.md) | [ES](./docs/es/13-guia-rapida-no-programadores.md)
- Prompt bank: [EN](./docs/en/26-validated-prompt-bank.md) | [ES](./docs/es/26-banco-prompts-validados.md)
