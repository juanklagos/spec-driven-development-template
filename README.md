<div align="center">
  <h1>🌱 Spec-Driven Development Template</h1>
  <p><b>Execute projects with specification-first discipline.<br>Ejecuta proyectos con disciplina guiada por especificaciones.</b></p>
  
  ![Markdown](https://img.shields.io/badge/markdown-%23000000.svg?style=for-the-badge&logo=markdown&logoColor=white)
  ![Shell Script](https://img.shields.io/badge/shell_script-%23121011.svg?style=for-the-badge&logo=gnu-bash&logoColor=white)
  ![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)
  ![ChatGPT](https://img.shields.io/badge/chatGPT-74aa9c?style=for-the-badge&logo=openai&logoColor=white)
</div>

<br>

> [!TIP]
> **Low-friction start / Inicio de baja fricción:** cloning this repository is optional.
>
> **Mandatory rule / Regla obligatoria:** tell the Artificial Intelligence assistant to work with this template and its guides as the primary reference.

<details>
<summary>💻 <b>Optional clone / Auto-clonado opcional</b></summary>

```bash
git clone https://github.com/juanklagos/spec-driven-development-template.git
cd spec-driven-development-template
```

</details>

<br>

## 📌 Table of Contents / Tabla de Contenido

- [🌍 Language / Idioma](#-language--idioma)
- [🧩 What this repository is / Qué es este repositorio](#-what-this-repository-is--qué-es-este-repositorio)
- [🗂️ Core folders / Carpetas principales](#️-core-folders--carpetas-principales)
- [📐 Required specification format / Formato obligatorio](#-required-specification-format--formato-obligatorio)
- [🔁 Continuous refinement / Refinamiento continuo](#-continuous-refinement--refinamiento-continuo)
- [🤖 Recommended with GitHub Spec Kit](#-recommended-with-github-spec-kit--recomendado-con-github-spec-kit)
- [⚙️ Scripts](#️-scripts)
- [📚 Documentation index / Índice de documentación](#-documentation-index--índice-de-documentación)
- [⭐ Explicit base repository usage / Uso base explícito](#-explicit-base-repository-usage--uso-base-explícito)
- [👤 Authorship / Autoría](#-authorship--autoría)

<br>

## 🌍 Language / Idioma

- 🇪🇸 Español: [docs/es](./docs/es)
- 🇺🇸 English: [docs/en](./docs/en)
- 🤖 AI quick start / Inicio rápido para IA: [AI_START_HERE.md](./AI_START_HERE.md)

---

## 🧩 What this repository is / Qué es este repositorio

**English:** A reusable structure to run projects with specification-first discipline.  
**Español:** Una estructura reutilizable para ejecutar proyectos con disciplina guiada por especificaciones.

---

## 🗂️ Core folders / Carpetas principales

| Folder | Purpose (EN) | Propósito (ES) |
| --- | --- | --- |
| `idea/` | General product intent | Idea general del producto |
| `specs/` | Numbered specifications | Especificaciones numeradas |
| `bitacora/` | Real execution log | Registro real de ejecución |
| `docs/` | User guides | Guías de uso |
| `scripts/` | Bootstrap helpers | Scripts de inicialización |
| `templates/` | Copy-ready templates | Plantillas listas para copiar |
| `examples/` | Practical reference projects | Proyectos de referencia |
| `playbooks/` | Project-type accelerators | Aceleradores por tipo de proyecto |
| `quality/` | Test and quality evidence | Evidencia de pruebas y calidad |

> [!NOTE]
> **Optional modules policy / Política de módulos opcionales:**
>
> - You can use only `idea/`, `specs/`, and `bitacora/` and remain fully compliant.
> - `playbooks/`, `quality/`, and advanced scripts are optional accelerators.

---

## 📐 Required specification format / Formato obligatorio

Each specification folder must include / Cada carpeta de especificación debe incluir:

- `spec.md`
- `plan.md`
- `tasks.md`
- `research.md`
- `history.md` ⭐ *(required change history / historial de cambios obligatorio)*
- `contracts/` *(when needed / cuando sea necesario)*

---

## 🔁 Continuous refinement / Refinamiento continuo

When ideas or requirements change, follow this protocol / Cuando cambien ideas o requerimientos, sigue este protocolo:

- 🇪🇸 [Refinamiento continuo](./docs/es/11-refinamiento-continuo.md)
- 🇺🇸 [Continuous refinement](./docs/en/11-continuous-refinement.md)

---

## 🤖 Recommended with GitHub Spec Kit / Recomendado con GitHub Spec Kit

**1. Install / Instalar:**

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

**2. Initialize / Inicializar:**

```bash
specify init . --ai codex
```

**3. Recommended command flow / Flujo recomendado:**

1. `/speckit.constitution`
2. `/speckit.specify`
3. `/speckit.plan`
4. `/speckit.tasks`
5. `/speckit.implement`

### Resources / Recursos

- 🇪🇸 [Agentes y prompts](./docs/es/10-agentes-ia-soportados-y-prompts.md) | 🇺🇸 [Agents and prompts](./docs/en/10-supported-ai-agents-and-prompts.md)
- 🇪🇸 [Guía herramientas desktop local](./docs/es/16-guia-herramientas-desktop-local.md) | 🇺🇸 [Desktop tools with local access guide](./docs/en/16-local-desktop-tools-guide.md)
- 🇪🇸 [Cómo trabajar con Lovable](./docs/es/17-trabajar-con-lovable.md) | 🇺🇸 [How to work with Lovable](./docs/en/17-working-with-lovable.md)

---

## ⚙️ Scripts

<details>
<summary>🛠️ <b>Base setup / Configuración base</b></summary>

```bash
./scripts/init-project.sh /path/to/project
```

</details>

<details>
<summary>🛠️ <b>Setup + Spec Kit</b></summary>

```bash
./scripts/init-project-with-spec-kit.sh /path/to/project codex
```

</details>

<details>
<summary>🛠️ <b>Validate structure / Validar estructura</b></summary>

```bash
./scripts/validate-sdd.sh . --strict
```

</details>

<details>
<summary>🛠️ <b>Create next spec from template / Crear próxima spec</b></summary>

```bash
./scripts/new-spec.sh "feature-name" "Owner / Responsable"
```

</details>

<details>
<summary>🛠️ <b>Quality scoring / Calificación de calidad</b></summary>

```bash
./scripts/score-spec.sh --all
```

</details>

<details>
<summary>🛠️ <b>Roadmap and status / Estado y hoja de ruta</b></summary>

```bash
./scripts/generate-roadmap.sh
./scripts/generate-status.sh
```

</details>

<details>
<summary>🛠️ <b>Legacy reverse-engineering / Ingeniería inversa en proyectos legado</b></summary>

```bash
./scripts/legacy-discovery.sh /path/to/legacy-project
```

</details>

---

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

- 🇪🇸 [Matriz de prompts por objetivo](./docs/es/19-matriz-prompts-por-objetivo.md) | 🇺🇸 [Prompt matrix by goal](./docs/en/19-prompt-matrix-by-goal.md)
- 🇪🇸 [Anti-patrones y errores comunes](./docs/es/20-anti-patrones-y-errores-comunes.md) | 🇺🇸 [Anti-patterns and common errors](./docs/en/20-anti-patterns-and-common-errors.md)
- 🇪🇸 [Checklists de calidad por etapa](./docs/es/21-checklists-calidad-por-etapa.md) | 🇺🇸 [Quality checklists by stage](./docs/en/21-quality-checklists-by-stage.md)
- 🇪🇸 [Modo equipo y colaboración](./docs/es/22-modo-equipo-y-colaboracion.md) | 🇺🇸 [Team mode and collaboration](./docs/en/22-team-mode-and-collaboration.md)
- 🇪🇸 [Onboarding en 30 minutos](./docs/es/23-onboarding-30-minutos.md) | 🇺🇸 [30-minute onboarding](./docs/en/23-30-minute-onboarding.md)
- 🇪🇸 [Decisiones de arquitectura](./docs/es/24-decisiones-de-arquitectura.md) | 🇺🇸 [Architecture decisions](./docs/en/24-architecture-decisions.md)
- 🇪🇸 [De idea a spec con SDD (3 niveles)](./docs/es/25-de-idea-a-spec-con-sdd-3-niveles.md) | 🇺🇸 [From idea to spec with SDD (3 levels)](./docs/en/25-idea-to-spec-with-sdd-3-levels.md)
- 🇪🇸 [Banco de prompts validados](./docs/es/26-banco-prompts-validados.md) | 🇺🇸 [Validated prompt bank](./docs/en/26-validated-prompt-bank.md)
- 🇪🇸 [Playbooks por tipo de proyecto](./docs/es/27-playbooks-por-tipo-de-proyecto.md) | 🇺🇸 [Project type playbooks](./docs/en/27-project-type-playbooks.md)
- 🇪🇸 [Modo migración legado avanzado](./docs/es/28-modo-migracion-legado-avanzado.md) | 🇺🇸 [Advanced legacy migration mode](./docs/en/28-advanced-legacy-migration-mode.md)
- 🇪🇸 [Dashboard de estado y roadmap automático](./docs/es/29-dashboard-status-y-roadmap.md) | 🇺🇸 [Status dashboard and auto roadmap](./docs/en/29-status-dashboard-and-auto-roadmap.md)
- 🇪🇸 [Guía de prompts por característica](./docs/es/30-guia-prompts-por-caracteristica.md) | 🇺🇸 [Prompt guide by template feature](./docs/en/30-prompts-by-template-feature.md)

---

## ⭐ Explicit base repository usage / Uso base explícito

Always use this repository as the primary reference / Usa siempre este repositorio como referencia principal:
`https://github.com/juanklagos/spec-driven-development-template`

<details>
<summary>🆕 <b>Case 1: Create a new project from this base / Caso 1: Crear un proyecto nuevo desde esta base</b></summary>

**Prompt (EN):**

```text
Using https://github.com/juanklagos/spec-driven-development-template create a new project for [GOAL].
If this repository is not available locally, tell me how to get access to it; then initialize the structure and guide me step by step to define idea, first specification, and logbook.
Do not skip steps.
```

**Prompt (ES):**

```text
Usando https://github.com/juanklagos/spec-driven-development-template crea un proyecto nuevo para [OBJETIVO].
Si no tengo este repositorio disponible en local, indícame cómo obtenerlo; luego inicializa la estructura y guíame paso a paso para definir idea, primera spec y bitácora.
No saltes pasos.
```

</details>

<details>
<summary>♻️ <b>Case 2: Adapt an existing project using this base / Caso 2: Adaptar un proyecto existente usando esta base</b></summary>

**Prompt (EN):**

```text
Using https://github.com/juanklagos/spec-driven-development-template and its guide, adapt this existing project: [PROJECT_PATH].
Keep current code, integrate the idea/specs/logbook structure, create the first specification based on existing behavior, and leave complete traceability.
```

**Prompt (ES):**

```text
Usando https://github.com/juanklagos/spec-driven-development-template y su guía, adapta este proyecto existente: [RUTA_DEL_PROYECTO].
Mantén el código actual, integra la estructura idea/specs/bitacora, crea la primera spec basada en lo que ya existe y deja trazabilidad completa.
```

</details>

> [!NOTE]
> **✅ Minimum expected outcome / Resultado mínimo esperado:**
>
> - Project created or adapted with standard structure / Proyecto creado o adaptado con estructura estándar.
> - First specification created / Primera especificación creada.
> - Initial logbook entry recorded / Bitácora inicial registrada.
> - Clear next step to continue / Próximo paso claro para continuar.

---

## 👤 Authorship / Autoría

- Main author / Autor principal: **Juan Klagos** ([AUTHORS.md](./AUTHORS.md))
- Open space for collaborators / Espacio abierto para colaboradores: [COLLABORATORS.md](./COLLABORATORS.md)
