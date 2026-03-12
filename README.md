# 🌱 Spec Driven Development Template

> ✅ **Low-friction start / Inicio de baja fricción:** cloning this repository is optional.
>
> 📌 **Mandatory rule / Regla obligatoria:** tell the Artificial Intelligence assistant to work with this template and its guides as the primary reference.
>
> If needed, optional clone:
> ```bash
> git clone https://github.com/juanklagos/spec-driven-development-template.git
> cd spec-driven-development-template
> ```

## 🌍 Language / Idioma

- 🇪🇸 Español: [docs/es](./docs/es)
- 🇺🇸 English: [docs/en](./docs/en)
- 🤖 AI quick start / Inicio rápido para IA: [AI_START_HERE.md](./AI_START_HERE.md)

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
| `templates/` | Copy-ready templates | Plantillas listas para copiar |
| `examples/` | Practical reference projects | Proyectos de referencia |

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
- 🇪🇸 [Guía de herramientas desktop con acceso local](./docs/es/16-guia-herramientas-desktop-local.md)
- 🇺🇸 [Desktop tools with local access guide](./docs/en/16-local-desktop-tools-guide.md)
- 🇪🇸 [Cómo trabajar con Lovable (ejecución con calidad)](./docs/es/17-trabajar-con-lovable.md)
- 🇺🇸 [How to work with Lovable (quality execution)](./docs/en/17-working-with-lovable.md)

## ⚙️ Scripts

Base setup:

```bash
./scripts/init-project.sh /path/to/project
```

Setup + Spec Kit:

```bash
./scripts/init-project-with-spec-kit.sh /path/to/project codex
```

Validate structure:

```bash
./scripts/validate-sdd.sh . --strict
```

## 📚 Documentation index / Índice de documentación

- [docs/README.md](./docs/README.md)

### Learning paths / Rutas de aprendizaje

- 🧭 Ruta completa:
  - 🇪🇸 [Ruta completa de aprendizaje en 3 niveles](./docs/es/18-ruta-completa-3-niveles.md)
  - 🇺🇸 [Complete 3-level learning path](./docs/en/18-complete-3-level-path.md)
- 🟢 Beginner / Principiante:
  - 🇪🇸 [Guía rápida para no programadores](./docs/es/13-guia-rapida-no-programadores.md)
  - 🇺🇸 [Quick guide for non-programmers](./docs/en/13-quick-guide-non-programmers.md)
- 🟡 Intermediate / Intermedio:
  - 🇪🇸 [Guía intermedia](./docs/es/14-guia-intermedia.md)
  - 🇺🇸 [Intermediate guide](./docs/en/14-intermediate-guide.md)
- 🔴 Advanced / Avanzado:
  - 🇪🇸 [Guía avanzada](./docs/es/15-guia-avanzada.md)
  - 🇺🇸 [Advanced guide](./docs/en/15-advanced-guide.md)

### Advanced operations / Operación avanzada

- 🇪🇸 [Matriz de prompts por objetivo](./docs/es/19-matriz-prompts-por-objetivo.md)
- 🇺🇸 [Prompt matrix by goal](./docs/en/19-prompt-matrix-by-goal.md)
- 🇪🇸 [Anti-patrones y errores comunes](./docs/es/20-anti-patrones-y-errores-comunes.md)
- 🇺🇸 [Anti-patterns and common errors](./docs/en/20-anti-patterns-and-common-errors.md)
- 🇪🇸 [Checklists de calidad por etapa](./docs/es/21-checklists-calidad-por-etapa.md)
- 🇺🇸 [Quality checklists by stage](./docs/en/21-quality-checklists-by-stage.md)
- 🇪🇸 [Modo equipo y colaboración](./docs/es/22-modo-equipo-y-colaboracion.md)
- 🇺🇸 [Team mode and collaboration](./docs/en/22-team-mode-and-collaboration.md)
- 🇪🇸 [Onboarding en 30 minutos](./docs/es/23-onboarding-30-minutos.md)
- 🇺🇸 [30-minute onboarding](./docs/en/23-30-minute-onboarding.md)
- 🇪🇸 [Decisiones de arquitectura](./docs/es/24-decisiones-de-arquitectura.md)
- 🇺🇸 [Architecture decisions](./docs/en/24-architecture-decisions.md)
- 🇪🇸 [De idea a spec con SDD (3 niveles)](./docs/es/25-de-idea-a-spec-con-sdd-3-niveles.md)
- 🇺🇸 [From idea to spec with SDD (3 levels)](./docs/en/25-idea-to-spec-with-sdd-3-levels.md)

## 👤 Authorship / Autoría

- Main author / Autor principal: **Juan Klagos** ([AUTHORS.md](./AUTHORS.md))
- Open space for collaborators / Espacio abierto para colaboradores: [COLLABORATORS.md](./COLLABORATORS.md)



## ⭐ Uso explícito del repositorio base

Usa siempre este repositorio como referencia principal:

- `https://github.com/juanklagos/spec-driven-development-template`

### 🆕 Caso 1: crear un proyecto nuevo desde esta base

Prompt sugerido para la IA:

```text
Usando https://github.com/juanklagos/spec-driven-development-template crea un proyecto nuevo para [OBJETIVO].
Si no tengo este repositorio disponible en local, indícame cómo obtenerlo; luego inicializa la estructura y guíame paso a paso para definir idea, primera spec y bitácora.
No saltes pasos.
```

### ♻️ Caso 2: adaptar un proyecto existente usando esta base

Prompt sugerido para la IA:

```text
Usando https://github.com/juanklagos/spec-driven-development-template y su guía, adapta este proyecto existente: [RUTA_DEL_PROYECTO].
Mantén el código actual, integra la estructura idea/specs/bitacora, crea la primera spec basada en lo que ya existe y deja trazabilidad completa.
```

### ✅ Resultado mínimo esperado

- Proyecto creado o adaptado con estructura estándar.
- Primera especificación creada.
- Bitácora inicial registrada.
- Próximo paso claro para continuar.



## ⭐ Explicit base repository usage

Always use this repository as the primary reference:

- `https://github.com/juanklagos/spec-driven-development-template`

### 🆕 Case 1: create a new project from this base

Suggested prompt for the Artificial Intelligence assistant:

```text
Using https://github.com/juanklagos/spec-driven-development-template create a new project for [GOAL].
If this repository is not available locally, tell me how to get access to it; then initialize the structure and guide me step by step to define idea, first specification, and logbook.
Do not skip steps.
```

### ♻️ Case 2: adapt an existing project using this base

Suggested prompt for the Artificial Intelligence assistant:

```text
Using https://github.com/juanklagos/spec-driven-development-template and its guide, adapt this existing project: [PROJECT_PATH].
Keep current code, integrate the idea/specs/logbook structure, create the first specification based on existing behavior, and leave complete traceability.
```

### ✅ Minimum expected outcome

- Project created or adapted with standard structure.
- First specification created.
- Initial logbook entry recorded.
- Clear next step to continue.
