# 🌱 Spec Driven Development Template

## 🌍 Language / Idioma

- 🇪🇸 Español: [docs/es](./docs/es)
- 🇺🇸 English: [docs/en](./docs/en)

## 🧩 What this repository is / Qué es este repositorio

**English:** A reusable structure to run projects with specification-first discipline.

**Español:** Una estructura reutilizable para ejecutar proyectos con disciplina guiada por especificaciones.

## 🗂️ Core folders / Carpetas principales

| Folder | Purpose (EN) | Propósito (ES) |
|---|---|---|
| `idea/` | General product intent | Idea general del producto |
| `specs/` | Numbered specifications | Especificaciones numeradas |
| `bitacora/` | Real execution log | Registro real de ejecución |
| `docs/` | User guides | Guías de uso |
| `scripts/` | Bootstrap helpers | Scripts de inicialización |

## 📐 Required specification format / Formato obligatorio

Each specification folder must include / Cada carpeta de especificación debe incluir:

- `spec.md`
- `plan.md`
- `tasks.md`
- `research.md`
- `history.md` ⭐ (required change history / historial de cambios obligatorio)
- `contracts/` when needed / cuando sea necesario

## 🔁 Continuous refinement / Refinamiento continuo

When ideas or requirements change, follow this protocol:

- 🇪🇸 [Refinamiento continuo](./docs/es/11-refinamiento-continuo.md)
- 🇺🇸 [Continuous refinement](./docs/en/11-continuous-refinement.md)

## 🤖 Recommended with GitHub Spec Kit / Recomendado con GitHub Spec Kit

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

Supported agents + unified prompts:

- 🇪🇸 [Agentes y prompts](./docs/es/10-agentes-ia-soportados-y-prompts.md)
- 🇺🇸 [Agents and prompts](./docs/en/10-supported-ai-agents-and-prompts.md)

## ⚙️ Scripts

Base setup:

```bash
./scripts/init-project.sh /path/to/project
```

Setup + Spec Kit:

```bash
./scripts/init-project-with-spec-kit.sh /path/to/project codex
```

## 📚 Documentation index / Índice de documentación

- [docs/README.md](./docs/README.md)

### Learning paths / Rutas de aprendizaje

- 🟢 Beginner / Principiante:
  - 🇪🇸 [Guía rápida para no programadores](./docs/es/13-guia-rapida-no-programadores.md)
  - 🇺🇸 [Quick guide for non-programmers](./docs/en/13-quick-guide-non-programmers.md)
- 🟡 Intermediate / Intermedio:
  - 🇪🇸 [Guía intermedia](./docs/es/14-guia-intermedia.md)
  - 🇺🇸 [Intermediate guide](./docs/en/14-intermediate-guide.md)
- 🔴 Advanced / Avanzado:
  - 🇪🇸 [Guía avanzada](./docs/es/15-guia-avanzada.md)
  - 🇺🇸 [Advanced guide](./docs/en/15-advanced-guide.md)

## 👤 Authorship / Autoría

- Main author / Autor principal: **Juan Klagos** ([AUTHORS.md](./AUTHORS.md))
- Open space for collaborators / Espacio abierto para colaboradores: [COLLABORATORS.md](./COLLABORATORS.md)
