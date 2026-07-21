# 🎯 General Project Idea / Idea general del proyecto

> [!IMPORTANT]
> **EN:** This file is the foundation of your project. Before writing any code or detailed specs, define the "What" and "Why" here.
> **ES:** Este archivo es la base de tu proyecto. Antes de escribir código o especificaciones detalladas, define el "¿Qué?" y el "¿Por qué?" aquí.

---

## 💎 Project Name / Nombre del proyecto
<!-- EN: Name of the application or service. -->
<!-- ES: Nombre de la aplicación o servicio. -->

Spec-Driven Development Template (SDD Template)

## 🧩 Problem to solve / Problema que se quiere resolver
<!-- EN: Describe the current pain point or gap you are addressing. -->
<!-- ES: Describe el problema actual o la brecha que intentas resolver. -->

Decisions get made in a chat thread and then vanish. Coding starts before anyone wrote down what the thing is supposed to do, so the requirements live in one person's head and whoever joins next spends their first week reconstructing them. Nothing connects the original idea to the code that came out of it. Add an AI assistant on top and it gets worse: with no structured context it invents details and widens the scope without being asked.

Las decisiones se toman en un hilo de chat y ahí se pierden. Se empieza a programar antes de que nadie haya escrito qué debe hacer la cosa, así que los requisitos viven en la cabeza de una sola persona y quien llega después se pasa la primera semana reconstruyéndolos. Nada conecta la idea original con el código que salió de ella. Súmale un asistente de IA y empeora: sin contexto estructurado inventa detalles y agranda el alcance sin que nadie se lo pida.

## 🚀 Main Goal / Objetivo principal
<!-- EN: What is the single most important outcome of this project? -->
<!-- ES: ¿Cuál es el resultado más importante que busca este proyecto? -->

A template you clone and use as it comes, with nothing to configure, that gets any developer — beginner or veteran — writing the spec before the code in under 30 minutes. It works the same with or without an AI assistant.

Un template que se clona y se usa tal cual, sin nada que configurar, y que en menos de 30 minutos deja a cualquier desarrollador, principiante o veterano, escribiendo la spec antes que el código. Funciona igual con o sin asistente de IA.

## 📏 Initial Scope / Alcance inicial (MVP)
<!-- EN: List the core features for the first version. -->
<!-- ES: Lista las características principales para la primera versión. -->
- Standardized folder structure: `idea/`, `specs/`, `bitacora/`
- Blank templates for specs, plans, tasks, history, research, and contracts
- Validation script (`validate-sdd.sh`) to enforce structural compliance
- Spec generation script (`new-spec.sh`) for fast bootstrapping
- Init script (`init-project.sh`) to set up new projects from the template
- Bilingual documentation (EN/ES) covering all aspects of SDD
- At least one Golden Example demonstrating the full SDD lifecycle
- Multi-agent AI support files (Cursor, Claude, Gemini, Copilot)
- GitHub Actions CI to validate template integrity on every push

## 🚫 Out of Scope / Fuera de alcance
<!-- EN: What will NOT be built in this phase? (Crucial for avoiding scope creep). -->
<!-- ES: ¿Qué NO se construirá en esta fase? (Crucial para evitar que el alcance crezca sin control). -->
- Code generation or scaffolding for specific tech stacks
- GUI or web interface for managing specs
- SaaS version or hosted platform
- Automated AI-driven spec writing (beyond prompts)
- Integration with project management tools (Jira, Linear, etc.)

## 👤 Target Users / Usuarios objetivo
<!-- EN: Who are you building this for? -->
<!-- ES: ¿Para quién estás construyendo esto? -->

1. **Solo developers** using AI tools (ChatGPT, Claude, Copilot, Cursor) who want the project to run on something sturdier than the chat history
2. **Small teams** (2–5 people) looking for lightweight process without heavy tooling
3. **Non-programmers** who want to define ideas clearly before handing off to developers or AI
4. **Legacy project owners** who need to retrofit structure and traceability into existing codebases

## ⚠️ Main Risks & Assumptions / Riesgos y Supuestos principales
<!-- EN: Technical or business hurdles you expect to face. -->
<!-- ES: Obstáculos técnicos o de negocio que esperas encontrar. -->
- Risk: Users may perceive 30+ docs as overwhelming → Mitigated by QUICKSTART.md and progressive disclosure
- Risk: Users may not understand the value without seeing it in practice → Mitigated by Golden Example
- Assumption: Markdown-only approach is sufficient for most users
- Assumption: Bilingual (EN/ES) covers the primary target audience

## 📈 Success Metrics / Métricas de éxito
<!-- EN: How will you know the project is successful? (e.g., users, performance, specific behavior). -->
<!-- ES: ¿Cómo sabrás si el proyecto es exitoso? (ej. usuarios, rendimiento, comportamiento específico). -->

- A new user can complete QUICKSTART.md and have a validated SDD structure in < 30 minutes
- `validate-sdd.sh --strict` passes with 0 errors on a fresh clone
- At least 1 complete Golden Example demonstrates the full idea → spec → implementation cycle
- All documentation is available in both EN and ES

## ✅ Global Completion Criteria / Criterio de terminado global
<!-- EN: What needs to happen to call this project "finished"? -->
<!-- ES: ¿Qué debe suceder para considerar este proyecto como "terminado"? -->

- All core folders and templates are present and validated
- QUICKSTART.md guides a user from zero to first spec in 5 steps
- All documentation files have substantive content (no stubs < 500 bytes)
- At least 1 narrated Golden Example exists
- CI passes on main branch
- Template itself follows SDD (dogfooding): this IDEA_GENERAL.md is filled, PROJECT_LOG.md has entries

---
*Created using the [Spec-Driven Development Template](https://github.com/juanklagos/spec-driven-development-template)*
