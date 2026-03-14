# 🤖 Instructions for any Artificial Intelligence tool / Instrucciones para cualquier herramienta de Inteligencia Artificial

## 📌 Mandatory repository rule / Regla obligatoria del repositorio

Cloning is optional. The mandatory requirement is to work with this repository template and guides as the primary reference.

Clonar es opcional. Lo obligatorio es trabajar con este template y sus guías como referencia principal.

Quick start for AI tools / Inicio rápido para herramientas de IA:

- `AI_START_HERE.md`
- `template-context/README.md`
- `template-context/01-PURPOSE.md`
- `template-context/02-AI-OPERATING-RULES.md`
- `template-context/03-FAST-ENTRY-FLOWS.md`
- `template-context/04-ANTI-MISUSE.md`
- `docs/es/10-agentes-ia-soportados-y-prompts.md`
- `docs/en/10-supported-ai-agents-and-prompts.md`

## 🧭 Repository context lock / Bloqueo de contexto del repositorio

- EN: Treat this repository as a starter template, not as a single in-progress product.
- ES: Trata este repositorio como un template de arranque, no como un único producto en desarrollo.

Before implementation tasks, explicitly determine:

1. If the task is `template maintenance` or `target project execution`.
2. The real target project path when execution is for a user project.
3. The active specification in that target project.

## 📚 Mandatory reading order / Orden obligatorio de lectura

1. `idea/IDEA_GENERAL.md`
2. `specs/INDEX.md`
3. Latest handoff file in `bitacora/handoffs/` / último archivo de `bitacora/handoffs/`
4. Reusable templates in `templates/` / plantillas reutilizables en `templates/`
5. Optional packs and quality evidence (`playbooks/`, `quality/`) when needed

## 🔧 Mandatory workflow / Flujo obligatorio

1. Work from one active specification.
2. If GitHub Spec Kit is available, use:
   - `/speckit.constitution`
   - `/speckit.specify`
   - `/speckit.plan`
   - `/speckit.tasks`
   - `/speckit.implement`
3. Keep `specs/` and `bitacora/` updated at session end.
4. Run `./scripts/validate-sdd.sh . --strict` before finishing.
5. Optional, if available: run `new-spec.sh`, `score-spec.sh`, `generate-roadmap.sh`, `generate-status.sh`, and `legacy-discovery.sh` for stronger consistency.

Optional modules are accelerators, not blockers. If they are not used, keep core consistency with `idea/`, `specs/`, and `bitacora/`.

## 🔁 Mandatory refinement protocol / Protocolo obligatorio de refinamiento

If idea, scope, priority, or requirements change:

1. Update the active specification.
2. Add an entry in `history.md`.
3. Update `specs/INDEX.md` if status or priority changes.
4. Register the change in `bitacora/`.

Do not continue implementation until documentation is aligned.

No continúes implementación hasta que la documentación quede alineada.

## 🧭 Required reference / Referencia obligatoria

Read and apply:

- `docs/es/10-agentes-ia-soportados-y-prompts.md` or
- `docs/en/10-supported-ai-agents-and-prompts.md`

and the refinement guide:

- `docs/es/11-refinamiento-continuo.md` or
- `docs/en/11-continuous-refinement.md`

For local desktop execution guidance (Codex desktop, Claude desktop, similar tools), read:

- `docs/es/16-guia-herramientas-desktop-local.md` or
- `docs/en/16-local-desktop-tools-guide.md`

For Lovable execution workflow after refined specs, read:

- `docs/es/17-trabajar-con-lovable.md` or
- `docs/en/17-working-with-lovable.md`

For operator level (beginner/intermediate/advanced), use:

- `docs/es/18-ruta-completa-3-niveles.md` / `docs/en/18-complete-3-level-path.md`
- `docs/es/13-guia-rapida-no-programadores.md` / `docs/en/13-quick-guide-non-programmers.md`
- `docs/es/14-guia-intermedia.md` / `docs/en/14-intermediate-guide.md`
- `docs/es/15-guia-avanzada.md` / `docs/en/15-advanced-guide.md`

## ✅ Final requirement / Requisito final

No implementation without specification, refinement trace, and logbook updates.

No hay implementación sin especificación, traza de refinamiento y actualización de bitácora.



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
