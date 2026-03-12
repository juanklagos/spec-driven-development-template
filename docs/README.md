# 📚 Documentation / Documentación

> ✅ **Low-friction start / Inicio de baja fricción:** cloning this repository is optional.
>
> 📌 **Mandatory rule / Regla obligatoria:** tell the Artificial Intelligence assistant to work with this template and these guides as the primary reference.

Start here / Empieza aquí: [`AI_START_HERE.md`](../AI_START_HERE.md)

## 🌍 Choose language / Elige idioma

- 🇪🇸 Spanish (Español): [`docs/es/`](./es)
- 🇺🇸 English: [`docs/en/`](./en)

## 🚀 Quick links / Enlaces rápidos

| Topic | Español | English |
|---|---|---|
| Ruta completa 3 niveles / Complete 3-level path | [ES](./es/18-ruta-completa-3-niveles.md) | [EN](./en/18-complete-3-level-path.md) |
| Introducción / Introduction | [ES](./es/00-introduccion.md) | [EN](./en/00-introduction.md) |
| Guía rápida (no programadores) / Quick guide (non-programmers) | [ES](./es/13-guia-rapida-no-programadores.md) | [EN](./en/13-quick-guide-non-programmers.md) |
| Guía intermedia / Intermediate guide | [ES](./es/14-guia-intermedia.md) | [EN](./en/14-intermediate-guide.md) |
| Guía avanzada / Advanced guide | [ES](./es/15-guia-avanzada.md) | [EN](./en/15-advanced-guide.md) |
| Estructura / Structure | [ES](./es/01-estructura.md) | [EN](./en/01-structure.md) |
| Flujo / Workflow | [ES](./es/02-flujo-de-trabajo.md) | [EN](./en/02-workflow.md) |
| Integración Spec Kit / Spec Kit Integration | [ES](./es/08-integracion-github-spec-kit.md) | [EN](./en/08-github-spec-kit-integration.md) |
| Herramientas desktop locales / Local desktop tools | [ES](./es/16-guia-herramientas-desktop-local.md) | [EN](./en/16-local-desktop-tools-guide.md) |
| Lovable: ejecución con calidad / Lovable: quality execution | [ES](./es/17-trabajar-con-lovable.md) | [EN](./en/17-working-with-lovable.md) |
| Agentes y prompts / Agents and prompts | [ES](./es/10-agentes-ia-soportados-y-prompts.md) | [EN](./en/10-supported-ai-agents-and-prompts.md) |
| Matriz de prompts / Prompt matrix | [ES](./es/19-matriz-prompts-por-objetivo.md) | [EN](./en/19-prompt-matrix-by-goal.md) |
| Anti-patrones / Anti-patterns | [ES](./es/20-anti-patrones-y-errores-comunes.md) | [EN](./en/20-anti-patterns-and-common-errors.md) |
| Checklists de calidad / Quality checklists | [ES](./es/21-checklists-calidad-por-etapa.md) | [EN](./en/21-quality-checklists-by-stage.md) |
| Modo equipo / Team mode | [ES](./es/22-modo-equipo-y-colaboracion.md) | [EN](./en/22-team-mode-and-collaboration.md) |
| Onboarding 30 minutos / 30-minute onboarding | [ES](./es/23-onboarding-30-minutos.md) | [EN](./en/23-30-minute-onboarding.md) |
| Decisiones de arquitectura / Architecture decisions | [ES](./es/24-decisiones-de-arquitectura.md) | [EN](./en/24-architecture-decisions.md) |
| De idea a spec (3 niveles) / Idea to spec (3 levels) | [ES](./es/25-de-idea-a-spec-con-sdd-3-niveles.md) | [EN](./en/25-idea-to-spec-with-sdd-3-levels.md) |
| Banco de prompts / Prompt bank | [ES](./es/26-banco-prompts-validados.md) | [EN](./en/26-validated-prompt-bank.md) |
| Playbooks por proyecto / Project playbooks | [ES](./es/27-playbooks-por-tipo-de-proyecto.md) | [EN](./en/27-project-type-playbooks.md) |
| Migración legado avanzada / Advanced legacy migration | [ES](./es/28-modo-migracion-legado-avanzado.md) | [EN](./en/28-advanced-legacy-migration-mode.md) |
| Dashboard status + roadmap | [ES](./es/29-dashboard-status-y-roadmap.md) | [EN](./en/29-status-dashboard-and-auto-roadmap.md) |
| Prompts por característica / Prompts by feature | [ES](./es/30-guia-prompts-por-caracteristica.md) | [EN](./en/30-prompts-by-template-feature.md) |
| Refinamiento / Refinement | [ES](./es/11-refinamiento-continuo.md) | [EN](./en/11-continuous-refinement.md) |
| TDD y BDD / TDD and BDD | [ES](./es/12-tdd-y-bdd-como-escribir-specs.md) | [EN](./en/12-tdd-and-bdd-how-to-write-specs.md) |
| Checklist de release / Release checklist | [ES](./es/09-release-checklist.md) | [EN](./en/09-release-checklist.md) |



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
