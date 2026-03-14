# Quickstart / Inicio rápido

Goal / Objetivo:
- EN: start SDD fast with the least friction.
- ES: iniciar SDD rápido con la menor fricción.

## Route A: Non-technical (recommended) / Ruta A: No técnica (recomendada)

1. Open [START_HERE_NON_TECH.md](./START_HERE_NON_TECH.md)
2. Copy the base prompt and share your project idea
3. Ask the AI to guide you step by step

## Route B: Technical / Ruta B: Técnica

### 1) Get the template / Obtén el template

```bash
npx degit juanklagos/spec-driven-development-template my-project
cd my-project
```

Alternative / Alternativa:

```bash
git clone https://github.com/juanklagos/spec-driven-development-template.git my-project
cd my-project
```

### 2) Initialize Spec Kit (recommended) / Inicializa Spec Kit (recomendado)

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
specify init . --ai codex
```

One-shot / Uso puntual:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init . --ai codex
```

### 3) Define idea / Define idea

Complete `idea/IDEA_GENERAL.md` with:
- Project name / Nombre
- Problem / Problema
- Main goal / Objetivo principal
- MVP scope / Alcance MVP

### 4) Create first spec / Crea primera spec

```bash
./scripts/new-spec.sh "my-feature" "Owner"
```

Fill:
- `specs/001-.../spec.md`
- `specs/001-.../plan.md`
- `specs/001-.../tasks.md`
- `specs/001-.../history.md`

### 5) Apply SDD gate / Aplica compuerta SDD

No code before:
- approved `spec.md`
- consistent `plan.md`

### 6) Validate + close session / Valida + cierra sesión

```bash
./scripts/validate-sdd.sh . --strict
./scripts/check-sdd-policy.sh .
./scripts/check-sdd-gate.sh .
```

Update:
- `bitacora/global/PROJECT_LOG.md`
- `bitacora/diaria/AAAA-MM-DD.md`
- `bitacora/handoffs/` (if pending work)

## Next / Siguiente

- AI detailed starter / Inicio IA detallado: [AI_START_HERE.md](./AI_START_HERE.md)
- Beginner path / Ruta principiante: [EN](./docs/en/13-quick-guide-non-programmers.md) | [ES](./docs/es/13-guia-rapida-no-programadores.md)
- Prompt bank / Banco de prompts: [EN](./docs/en/26-validated-prompt-bank.md) | [ES](./docs/es/26-banco-prompts-validados.md)
