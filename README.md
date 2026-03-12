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
2. [🗂️ Core folders / Carpetas principales](#️-core-folders--carpetas-principales)
3. [📐 Required specification format / Formato obligatorio](#-required-specification-format--formato-obligatorio)
4. [🤖 Recommended AI Workflow / Flujo de IA Recomendado](#-recommended-ai-workflow--flujo-de-ia-recomendado)
5. [⚙️ Scripts & Tools / Scripts y Herramientas](#️-scripts--tools--scripts-y-herramientas)
6. [📚 Documentation Index / Índice de Documentación](#-documentation-index--índice-de-documentación)
7. [⭐ Base Repository Usage / Uso Base Explícito](#-base-repository-usage--uso-base-explícito)

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

If you are using **GitHub Spec Kit** alongside Codely/Cursor/Copilot, wrap your work using these steps:

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

## 📚 Documentation Index / Índice de Documentación

Choose your preferred engagement level / Elige tu nivel de profundidad preferido:

<div align="center">
  <table>
    <tr>
      <th align="center">🟢 Beginner / Principiante</th>
      <th align="center">🟡 Intermediate / Intermedio</th>
    </tr>
    <tr>
      <td align="center">
        <a href="./docs/en/13-quick-guide-non-programmers.md"><img src="https://img.shields.io/badge/-Quick_Guide_(EN)-white?style=for-the-badge" alt="EN"></a><br><br>
        <a href="./docs/es/13-guia-rapida-no-programadores.md"><img src="https://img.shields.io/badge/-Guía_Rápida_(ES)-white?style=for-the-badge" alt="ES"></a>
      </td>
      <td align="center">
         <a href="./docs/en/14-intermediate-guide.md"><img src="https://img.shields.io/badge/-Intermediate_(EN)-blue?style=for-the-badge" alt="EN"></a><br><br>
        <a href="./docs/es/14-guia-intermedia.md"><img src="https://img.shields.io/badge/-Intermedia_(ES)-blue?style=for-the-badge" alt="ES"></a>
      </td>
    </tr>
    <tr>
      <th align="center">🔴 Advanced / Avanzado</th>
      <th align="center">🧭 Full Path / Ruta Completa</th>
    </tr>
    <tr>
      <td align="center">
         <a href="./docs/en/15-advanced-guide.md"><img src="https://img.shields.io/badge/-Advanced_(EN)-red?style=for-the-badge" alt="EN"></a><br><br>
        <a href="./docs/es/15-guia-avanzada.md"><img src="https://img.shields.io/badge/-Avanzada_(ES)-red?style=for-the-badge" alt="ES"></a>
      </td>
      <td align="center">
         <a href="./docs/en/18-complete-3-level-path.md"><img src="https://img.shields.io/badge/-3_Levels_(EN)-orange?style=for-the-badge" alt="EN"></a><br><br>
        <a href="./docs/es/18-ruta-completa-3-niveles.md"><img src="https://img.shields.io/badge/-3_Niveles_(ES)-orange?style=for-the-badge" alt="ES"></a>
      </td>
    </tr>
  </table>
</div>

<br>

<details>
<summary>📂 <b>View all internal reference documents / Ver todos los documentos internos</b></summary>
<br>

- [10 Agents & Prompts](./docs/en/10-supported-ai-agents-and-prompts.md) | [10 Agentes y Prompts](./docs/es/10-agentes-ia-soportados-y-prompts.md)
- [11 Continuous Refinement](./docs/en/11-continuous-refinement.md) | [11 Refinamiento Continuo](./docs/es/11-refinamiento-continuo.md)
- [16 Desktop Tools Guide](./docs/en/16-local-desktop-tools-guide.md) | [16 Guía Herramientas Locales](./docs/es/16-guia-herramientas-desktop-local.md)
- [17 Working with Lovable](./docs/en/17-working-with-lovable.md) | [17 Trabajando con Lovable](./docs/es/17-trabajar-con-lovable.md)
- [19 Prompt Matrix](./docs/en/19-prompt-matrix-by-goal.md) | [19 Matriz de Prompts](./docs/es/19-matriz-prompts-por-objetivo.md)
- [20 Anti-patterns](./docs/en/20-anti-patterns-and-common-errors.md) | [20 Antipatrones](./docs/es/20-anti-patrones-y-errores-comunes.md)
- [... Expand all docs ...](./docs/README.md)

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

## 👤 Authorship / Autoría

Developed with ☕ and disciplined engineering.

- **Main author / Autor principal:** Juan Klagos ([AUTHORS.md](./AUTHORS.md))
- **Open space for collaborators / Colaboradores:** [COLLABORATORS.md](./COLLABORATORS.md)
