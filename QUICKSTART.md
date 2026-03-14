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

### 2) Create execution workspace / Crea espacio de ejecución

```bash
./scripts/create-www-project.sh my-project codex
cd www/my-project
```

Important / Importante:
- EN: Keep runnable project work inside this current chat/workspace folder (`./www/...`).
- ES: Mantén el trabajo ejecutable dentro de esta carpeta actual del chat/workspace (`./www/...`).

Default:
- EN: recommended scaffold (best default for project quality).
- ES: scaffold recomendado (mejor valor por defecto para calidad del proyecto).

Minimal only:

```bash
./scripts/create-www-project.sh my-project codex --minimal-template
cd www/my-project
```

Optional full packs:

```bash
./scripts/create-www-project.sh my-project codex --full-template
cd www/my-project
```

### 3) Initialize Spec Kit (recommended) / Inicializa Spec Kit (recomendado)

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
specify init . --ai codex
```

One-shot / Uso puntual:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init . --ai codex
```

### 4) Define idea / Define idea

Complete `idea/IDEA_GENERAL.md` with:
- Project name / Nombre
- Problem / Problema
- Main goal / Objetivo principal
- MVP scope / Alcance MVP

### 5) Create first spec / Crea primera spec

```bash
./scripts/new-spec.sh "my-feature" "Owner"
```

Fill:
- `specs/001-.../spec.md`
- `specs/001-.../plan.md`
- `specs/001-.../tasks.md`
- `specs/001-.../history.md`

### 6) Apply SDD gate / Aplica compuerta SDD

No code before:
- approved `spec.md`
- consistent `plan.md`
- explicit user consent recorded right before execution/implementation:

```bash
./scripts/confirm-user-consent.sh "User approved implementation for spec 001"
```

### 7) Validate + close session / Valida + cierra sesión

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
