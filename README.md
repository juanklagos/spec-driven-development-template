# Spec Driven Development Template

Language / Idioma:

- Español: [docs/es](./docs/es)
- English: [docs/en](./docs/en)

## What this repository is / Qué es este repositorio

This is a reusable project structure to work with specification-first development.

Este es un sistema reutilizable para trabajar con desarrollo guiado por especificaciones.

## Core folders / Carpetas principales

- `idea/`: general project idea / idea general del proyecto.
- `specs/`: numbered specifications / especificaciones numeradas.
- `bitacora/`: real work history / historial real de trabajo.

## Required specification format / Formato obligatorio de especificación

Each specification folder must include / Cada carpeta de especificación debe incluir:

- `spec.md`
- `plan.md`
- `tasks.md`
- `research.md`
- `contracts/` when needed / cuando sea necesario

## Recommended with GitHub Spec Kit / Recomendado con GitHub Spec Kit

Install / instalar:

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

Initialize / inicializar:

```bash
specify init . --ai codex
```

Recommended command flow / flujo recomendado:

1. `/speckit.constitution`
2. `/speckit.specify`
3. `/speckit.plan`
4. `/speckit.tasks`
5. `/speckit.implement`

Supported agents table + unified prompts / Tabla de agentes soportados + prompts unificados:

- [ES](./docs/es/10-agentes-ia-soportados-y-prompts.md)
- [EN](./docs/en/10-supported-ai-agents-and-prompts.md)

## Scripts / Scripts

- Base template setup / Inicialización base:

```bash
./scripts/init-project.sh /path/to/project
```

- Template + GitHub Spec Kit setup / Inicialización con plantilla + GitHub Spec Kit:

```bash
./scripts/init-project-with-spec-kit.sh /path/to/project codex
```

## Documentation index / Índice de documentación

- [docs/README.md](./docs/README.md)
