<div align="center">
  <h1>🌱 Spec-Driven Development Template</h1>
  <p><b>Execute projects with specification-first discipline.<br>Ejecuta proyectos con disciplina guiada por especificaciones.</b></p>
  
  <p>
    <a href="https://github.com/juanklagos/spec-driven-development-template"><img src="https://img.shields.io/badge/markdown-%23000000.svg?style=for-the-badge&logo=markdown&logoColor=white" alt="Markdown"></a>
    <a href="https://github.com/juanklagos/spec-driven-development-template"><img src="https://img.shields.io/badge/shell_script-%23121011.svg?style=for-the-badge&logo=gnu-bash&logoColor=white" alt="Shell Script"></a>
    <a href="https://github.com/juanklagos/spec-driven-development-template"><img src="https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions"></a>
    <a href="https://github.com/juanklagos/spec-driven-development-template"><img src="https://img.shields.io/badge/chatGPT-74aa9c?style=for-the-badge&logo=openai&logoColor=white" alt="ChatGPT"></a>
  </p>
  <p>
    <em>A structured, reproducible, and AI-friendly environment for software development.</em>
  </p>
</div>

---

<div align="center">
  <b>🌍 Choose your language / Elige tu idioma:</b><br><br>
  <a href="./docs/en"><img src="https://img.shields.io/badge/🇺🇸_English-Read_Docs-blue?style=for-the-badge" alt="English Docs"></a>
  &nbsp;&nbsp;&nbsp;
  <a href="./docs/es"><img src="https://img.shields.io/badge/🇪🇸_Español-Leer_Docs-green?style=for-the-badge" alt="Spanish Docs"></a>
  &nbsp;&nbsp;&nbsp;
  <a href="./AI_START_HERE.md"><img src="https://img.shields.io/badge/🤖_AI_Assistant-Start_Here-purple?style=for-the-badge" alt="AI Quickstart"></a>
</div>

---

## 📌 Table of Contents / Tabla de Contenido

<details open>
<summary><b>Click to expand / Haz clic para expandir</b></summary>
<br>

1. [🧩 What this repository is / Qué es este repositorio](#-what-this-repository-is--qué-es-este-repositorio)
2. [🧭 Template Context for AI / Contexto template para IA](#-template-context-for-ai--contexto-template-para-ia)
3. [🗂️ Core folders / Carpetas principales](#️-core-folders--carpetas-principales)
4. [📐 Required specification format / Formato obligatorio](#-required-specification-format--formato-obligatorio)
5. [🤖 Recommended AI Workflow / Flujo de IA Recomendado](#-recommended-ai-workflow--flujo-de-ia-recomendado)
6. [⚙️ Scripts & Tools / Scripts y Herramientas](#️-scripts--tools--scripts-y-herramientas)
7. [📚 Documentation Index / Índice de Documentación](#-documentation-index--índice-de-documentación)
8. [⭐ Base Repository Usage / Uso Base Explícito](#-base-repository-usage--uso-base-explícito)
9. [⚖️ Licensing & Legal / Licenciamiento y Legal](#️-licensing--legal--licenciamiento-y-legal)

</details>

---

## 🧩 What this repository is / Qué es este repositorio

> [!TIP]
> **Low-friction start / Inicio de baja fricción:** cloning this repository is optional. Use the structure and conventions straight away.

**🇺🇸 English:** 
A reusable structure to run projects with specification-first discipline. It solves the problem of decisions lost in chats, code changes without context, and difficult onboarding.

**🇪🇸 Español:** 
Una estructura reutilizable para ejecutar proyectos con disciplina guiada por especificaciones. Resuelve la pérdida de contexto en chats, cambios de código indocumentados y el difícil onboarding.

---

## 🧭 Template Context for AI / Contexto template para IA

> [!IMPORTANT]
> **EN:** This repository is a reusable starter template, not an in-progress product backlog.
> **ES:** Este repositorio es una plantilla reutilizable de arranque, no un backlog activo de producto.

Canonical context for AI tools:

- [`INSTRUCTIONS.md`](./INSTRUCTIONS.md)
- [`template-context/README.md`](./template-context/README.md)
- [`template-context/01-PURPOSE.md`](./template-context/01-PURPOSE.md)
- [`template-context/02-AI-OPERATING-RULES.md`](./template-context/02-AI-OPERATING-RULES.md)
- [`template-context/03-FAST-ENTRY-FLOWS.md`](./template-context/03-FAST-ENTRY-FLOWS.md)
- [`template-context/04-ANTI-MISUSE.md`](./template-context/04-ANTI-MISUSE.md)
- [`template-context/05-SDD-EXECUTION-GATE.md`](./template-context/05-SDD-EXECUTION-GATE.md)
- [`template-context/06-AI-RULES-MATRIX.md`](./template-context/06-AI-RULES-MATRIX.md)
- [`template-context/07-AI-HANDOFF-CHECKLIST.md`](./template-context/07-AI-HANDOFF-CHECKLIST.md)

---

## 🗂️ Core folders / Carpetas principales

We organize the project into distinct execution layers so both humans and AIs know exactly where to look.

| Layer / Capa | Folder | 🇺🇸 Purpose | 🇪🇸 Propósito |
| :--- | :--- | :--- | :--- |
| **Foundation** | 📁 `idea/` | General product intent and scope | Visión e intención general del producto |
| **Definition** | 📁 `specs/` | Numbered sequential specifications | Documentos de especificación numerados |
| **Execution** | 📁 `bitacora/`| Real execution log and daily traits | Registro de ejecución y handoffs diarios |
| **Support** | 📁 `docs/` | User guides and conventions | Guías de usuario y convenciones |
| **Support** | 📁 `scripts/` | Bootstrap helpers and automation | Utilidades de inicialización y automatización |
| **Optional** | 📁 `templates/`| Copy-ready markdown templates | Plantillas markdown en blanco |
| **Optional** | 📁 `examples/` | Practical reference projects | Ejemplos de proyectos de referencia |
| **Optional** | 📁 `playbooks/`| Project-type accelerators | Guías aceleradoras por tipo de proyecto |
| **Optional** | 📁 `quality/` | Test and quality evidence | Evidencia de reportes y TDD/BDD |

> [!NOTE]
> **Optional modules policy / Política de módulos opcionales:**
> You only STRICTLY need `idea/`, `specs/`, and `bitacora/` to remain fully compliant with the Spec-Driven Development framework.

---

## 📐 Required specification format / Formato obligatorio

Inside each `specs/00X-feature/` folder, the following files orchestrate the work:

| Document | Purpose | Required / Opcional |
| :--- | :--- | :---: |
| 📄 `spec.md` | The actual business requirement | 🟢 Yes |
| 📄 `plan.md` | The technical approach to build it | 🟢 Yes |
| 📄 `tasks.md` | The sequential checklist of actions | 🟢 Yes |
| 📄 `history.md`| The changelog of modifications | ⭐ **Highly Required** |
| 📄 `research.md`| Findings before implementation | 🟡 Optional |
| 📁 `contracts/`| Interface and API structures | 🟡 Optional |

---

## 🤖 Recommended AI Workflow / Flujo de IA Recomendado

This repository is optimized for two main AI workflows: **Lovable** (for rapid visual generation) and **GitHub Spec Kit** (for CLI-driven terminal workflows).

### 💜 Working with Lovable / Trabajando con Lovable 

The ultimate combination: *Lovable's code generation + Spec-Driven Development rigor*.
We have designed a progressive 3-level guide (from Beginner to Advanced) to avoid AI hallucinations and ensure maintainable code.

👉 **[Read the full Lovable Guide (EN)](./docs/en/17-working-with-lovable.md)** | **[Lee la guía completa de Lovable (ES)](./docs/es/17-trabajar-con-lovable.md)**

### ⚙️ Working with GitHub Spec Kit

If you are using **GitHub Spec Kit** alongside Cursor/Copilot, wrap your work using these steps:

1. **Install CLI tool:**
   <kbd>uv tool install specify-cli --from git+https://github.com/github/spec-kit.git</kbd>
2. **Initialize:**
   <kbd>specify init . --ai codex</kbd>
3. **Command Iteration:**
   `/speckit.constitution` → `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`

> [!TIP]
> Did you know? This template works out-of-the-box with any standard ChatGPT / Claude session without installing Spec Kit. Just paste the prompts!

---

## ⚙️ Scripts & Tools / Scripts y Herramientas

To make administration easier, use the provided bash scripts:

| Script Command | Description / Descripción |
| :--- | :--- |
| <kbd>./scripts/init-project.sh /path/</kbd> | Bootstrap a brand new project |
| <kbd>./scripts/init-project-with-spec-kit.sh /path/ codex</kbd> | Bootstrap heavily integrated with Spec Kit |
| <kbd>./scripts/validate-sdd.sh . --strict</kbd> | Validate the structure integrity of your repo |
| <kbd>./scripts/new-spec.sh "feature" "Owner"</kbd> | Generates the folder and markdown files automatically |
| <kbd>./scripts/score-spec.sh --all</kbd> | Rates the quality and coverage of your specs |
| <kbd>./scripts/generate-roadmap.sh</kbd> | Creates an overview of the project's features |

---

## 📚 Documentation Discovery / Descubrimiento de Documentos

Find the guide that fits your current need / Encuentra la guía que mejor se adapte a tu necesidad:

<div align="center">
  <table>
    <tr>
      <th align="center">🏗️ Foundation / Base</th>
      <th align="center">🤖 AI & Prompts</th>
    </tr>
    <tr>
      <td align="left">
        • <a href="./docs/en/18-complete-3-level-path.md">Complete Path / Ruta Completa</a><br>
        • <a href="./docs/es/01-estructura.md">Structure / Estructura</a><br>
        • <a href="./docs/es/02-flujo-de-trabajo.md">Workflow / Flujo</a><br>
        • <a href="./docs/es/11-refinamiento-continuo.md">Refinement / Refinamiento</a>
      </td>
      <td align="left">
        • <a href="./docs/es/10-agentes-ia-soportados-y-prompts.md">Supported Agents / Agentes</a><br>
        • <a href="./docs/es/19-matriz-prompts-por-objetivo.md">Prompt Matrix / Matriz</a><br>
        • <a href="./docs/en/17-working-with-lovable.md"><b>Working with Lovable</b></a><br>
        • <a href="./docs/es/08-integracion-github-spec-kit.md">Spec Kit Integration</a>
      </td>
    </tr>
    <tr>
      <th align="center">🛠️ Tools & Quality / Calidad</th>
      <th align="center">👥 Management / Gestión</th>
    </tr>
    <tr>
      <td align="left">
        • <a href="./docs/es/16-guia-herramientas-desktop-local.md">Local Tools / Herramientas</a><br>
        • <a href="./docs/es/12-tdd-y-bdd-como-escribir-specs.md">TDD & BDD</a><br>
        • <a href="./docs/es/21-checklists-calidad-por-etapa.md">Checklists</a><br>
        • <a href="./docs/es/20-anti-patrones-y-errores-comunes.md">Anti-patterns</a>
      </td>
      <td align="left">
        • <a href="./docs/es/22-modo-equipo-y-colaboracion.md">Team Mode / Colaboración</a><br>
        • <a href="./docs/es/24-decisiones-de-arquitectura.md">Arch Decisions</a><br>
        • <a href="./docs/es/23-onboarding-30-minutos.md">30-min Onboarding</a><br>
        • <a href="./docs/es/31-marco-legal-y-uso-comercial.md">Legal Framework</a>
      </td>
    </tr>
  </table>
</div>

### 🌍 Read by Level / Leer por Nivel
| Beginner / Principiante | Intermediate / Intermedio | Advanced / Avanzado |
| :---: | :---: | :---: |
| [Quick Guide](./docs/es/13-guia-rapida-no-programadores.md) | [Intermediate Guide](./docs/es/14-guia-intermedia.md) | [Advanced Guide](./docs/es/15-advanced-guide.md) |

<br>

<details>
<summary>📂 <b>View all internal documents (60+) / Ver todos los documentos (60+)</b></summary>
<br>

- [Full Documentation README](./docs/README.md)
- [AI Start Here](../AI_START_HERE.md)

</details>

---

## ⭐ Base Repository Usage / Uso Base Explícito

Always use this repository as the primary reference / Usa siempre este repositorio como referencia principal:
`https://github.com/juanklagos/spec-driven-development-template`

### 🆕 Case 1: Create a new project / Crear proyecto nuevo

If starting from zero, feed this prompt to the AI:

> **EN:** "Using https://github.com/juanklagos/spec-driven-development-template create a new project for `[GOAL]`. If this repository is not available locally, tell me how to get access to it; then initialize the structure and guide me step by step to define idea, first specification, and logbook. Do not skip steps."
> 
> **ES:** "Usando https://github.com/juanklagos/spec-driven-development-template crea un proyecto nuevo para `[OBJETIVO]`. Si no tengo este repositorio disponible en local, indícame cómo obtenerlo; luego inicializa la estructura y guíame paso a paso para definir idea, primera spec y bitácora. No saltes pasos."

### ♻️ Case 2: Adapt an existing project / Adaptar proyecto existente

If applying this to a legacy codebase, feed this prompt to the AI:

> **EN:** "Using https://github.com/juanklagos/spec-driven-development-template and its guide, adapt this existing project: `[PROJECT_PATH]`. Keep current code, integrate the idea/specs/logbook structure, create the first specification based on existing behavior, and leave complete traceability."
> 
> **ES:** "Usando https://github.com/juanklagos/spec-driven-development-template y su guía, adapta este proyecto existente: `[RUTA_DEL_PROYECTO]`. Mantén el código actual, integra la estructura idea/specs/bitacora, crea la primera spec basada en lo que ya existe y deja trazabilidad completa."

---

## ⚖️ Licensing & Legal / Licenciamiento y Legal

This repository is licensed under `PolyForm Noncommercial 1.0.0`.
Commercial use requires explicit written authorization from the author.

Este repositorio está licenciado bajo `PolyForm Noncommercial 1.0.0`.
El uso comercial requiere autorización escrita explícita del autor.

Legal documents:

- [LICENSE](./LICENSE)
- [NOTICE](./NOTICE)
- [COMMERCIAL_LICENSE.md](./COMMERCIAL_LICENSE.md)
- [DISCLAIMER.md](./DISCLAIMER.md)
- [TRADEMARK_POLICY.md](./TRADEMARK_POLICY.md)
- [ENFORCEMENT.md](./ENFORCEMENT.md)
- [CLA.md](./CLA.md)
- [LEGAL_OVERVIEW.md](./LEGAL_OVERVIEW.md)
- 🇪🇸 [Marco legal y uso comercial](./docs/es/31-marco-legal-y-uso-comercial.md)
- 🇺🇸 [Legal framework and commercial use](./docs/en/31-legal-framework-and-commercial-use.md)

---

## 👤 Authorship / Autoría

Developed with ☕ and disciplined engineering.

- **Main author / Autor principal:** Juan Klagos ([AUTHORS.md](./AUTHORS.md))
- **Open space for collaborators / Colaboradores:** [COLLABORATORS.md](./COLLABORATORS.md)
