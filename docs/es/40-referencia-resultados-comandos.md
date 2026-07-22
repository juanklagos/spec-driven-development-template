# Referencia de resultados por comando

## Propósito

Qué crea, qué modifica y qué devuelve cada script principal y cada tool MCP. Consúltala cuando quieras saber, antes de ejecutar algo, exactamente qué va a tocar en disco.

Si quieres primero la vista amigable por comandos, empieza aquí:
- [Guía fácil de MCP](./43-guia-mcp-facil.md)

Para la visión completa de MCP, intención de tools, resources y prompts, empieza aquí:
- [Referencia completa de MCP](./41-referencia-completa-mcp.md)

## Modelo de resultado

```mermaid
flowchart LR
  A["Comando o Tool"] --> B["Crea archivos"]
  A --> C["Actualiza archivos"]
  A --> D["Devuelve salida"]
  A --> E["Afecta traza o compuerta"]
```

## Scripts de workspace e inicialización

### `./scripts/create-www-project.sh <nombre-proyecto> <assistant> [flags]`

Úsalo cuando:
- quieres el workspace recomendado por defecto dentro de este template

Crea:
- `./www/<nombre-proyecto>/`
- la estructura base SDD dentro de esa carpeta
- setup opcional de Spec Kit, si está disponible

Modifica:
- nada fuera de la carpeta nueva del workspace

Resultado exitoso:
- imprime la ruta absoluta del workspace
- imprime el perfil elegido
- imprime los siguientes comandos sugeridos

### `./scripts/init-project.sh /ruta/absoluta/proyecto --profile=recommended`

Úsalo cuando:
- el usuario quiere el proyecto ejecutable fuera de este template

Crea:
- la base SDD completa en la ruta destino
- `idea/`, `specs/`, `bitacora/`, `.sdd/` y archivos auxiliares

Reglas:
- rechaza la raíz del template
- si la ruta destino vive dentro de este template, debe estar bajo `./www/`

Resultado exitoso:
- imprime la ruta inicializada
- imprime el perfil elegido
- imprime los siguientes comandos para continuar

### `./scripts/init-project-with-spec-kit.sh /ruta/absoluta/proyecto codex --profile=recommended`

Úsalo cuando:
- quieres una ruta externa más inicialización de GitHub Spec Kit

Crea:
- todo lo de `init-project.sh`
- configuración de Spec Kit para el asistente elegido

Resultado exitoso:
- imprime la ruta inicializada
- imprime el flujo sugerido de Spec Kit

### `./scripts/install-spec-sidecar.sh /ruta/absoluta/proyecto --profile=recommended`

Úsalo cuando:
- es el punto de entrada recomendado para un **proyecto real ya existente**: el código de la app se queda en la raíz y todo el sistema operativo SDD vive dentro de `./spec/`

Crea:
- `./spec/` con `idea/`, `specs/`, `bitacora/`, `scripts/`, `templates/`, `template-context/`, `.sdd/`, `sdd.policy.yaml` y los archivos de reglas para agentes
- archivos de entrada para agentes en la raíz del proyecto (`AGENTS.md`, `CLAUDE.md`, `AI_START_HERE.md`, `INSTRUCTIONS.md`, `GEMINI.md`, `AIDER.md`, `ROO.md`, `WINDSURF.md`, `.cursorrules`, `.clauderules`, `.github/copilot-instructions.md`) para que cualquier asistente encuentre las reglas

Reglas:
- el repositorio del framework **no** se copia dentro del proyecto — solo el sidecar compacto
- rechaza la raíz del template

Resultado exitoso:
- imprime `✅ Compact SDD sidecar installed at: <ruta>/spec` con la versión del template y el perfil
- imprime los siguientes comandos, que en un sidecar viven bajo `./spec/scripts/` (`new-spec.sh`, `validate-sdd.sh`, `check-sdd-policy.sh`, `check-sdd-gate.sh`)
- imprime el comando opcional de inicialización de GitHub Spec Kit

## Scripts de specs y trazabilidad

### `./scripts/new-spec.sh "feature-name" "Owner"`

Crea:
- `specs/NNN-feature-name/`
- `spec.md`
- `plan.md`
- `tasks.md`
- `research.md`
- `history.md`
- `contracts/README.md`

Modifica:
- agrega una fila a `specs/INDEX.md`

Resultado exitoso:
- imprime `Created: specs/NNN-feature-name`
- imprime `Added row to specs/INDEX.md`

### `./scripts/confirm-user-consent.sh --spec 001-<slug> "User approved scope X"`

Crea o actualiza:
- `.sdd/user-consent.log`

Resultado exitoso:
- imprime la ruta del archivo de log donde quedó el consentimiento

### `./scripts/generate-status.sh`

Crea o reemplaza:
- `STATUS.md`

Lee:
- `specs/INDEX.md`
- todos los `tasks.md`
- `bitacora/global/PROJECT_LOG.md` si existe

Resultado exitoso:
- imprime `Generated STATUS.md`

### `./scripts/generate-roadmap.sh`

Crea o reemplaza:
- `docs/roadmap.mmd`
- `docs/roadmap.md`

Lee:
- `specs/INDEX.md`

Resultado exitoso:
- imprime las rutas generadas del roadmap

### `./scripts/score-spec.sh specs/NNN-nombre` (o `--all`)

Úsalo cuando:
- quieres una lectura rápida de calidad de un bundle de spec antes de pedir aprobación

Lee:
- los archivos del bundle (`spec.md`, `plan.md`, `tasks.md`, `research.md`, `history.md`)

Escribe:
- nada — es de solo lectura

Resultado exitoso:
- imprime `Spec:`, `Score: NN/100 (Grade X)` y una lista `Notes:` con lo débil
- con `--all`, imprime un bloque por cada spec numerada
- el argumento es la **carpeta** del bundle, no `spec.md`; apuntarlo a un solo archivo reporta `missing required files`

Efecto en la compuerta:
- ninguno — el score es orientativo, nunca bloquea

## Scripts de documentación y mantenimiento

### `./scripts/generate-llms-txt.sh`

Crea o reemplaza:
- `llms.txt` en la raíz del repositorio

Lee:
- `docs/en/` y `docs/es/`, tomando el primer H1 de cada archivo como título

Resultado exitoso:
- imprime `Generated <ruta>/llms.txt (N lines)`

Cuándo ejecutarlo:
- después de agregar, renombrar o retitular cualquier guía, para que los agentes de código indexen la documentación real

### `./scripts/legacy-discovery.sh [objetivo] [carpeta-salida]`

Úsalo cuando:
- estás adoptando SDD sobre un código existente y necesitas un punto de partida para ingeniería inversa

Crea (por defecto `analysis/legacy-discovery/`):
- `routes-signals.txt` — coincidencias de rutas/endpoints
- `flow-signals.txt` — coincidencias de flujos de usuario (login, checkout, perfil…)
- `legacy-discovery-report.md` — conteo de señales, specs iniciales sugeridas y un prompt sugerido

Requiere:
- `rg` (ripgrep) en el PATH

Resultado exitoso:
- imprime `Generated <carpeta-salida>/legacy-discovery-report.md` y el siguiente paso

Efecto en la compuerta:
- ninguno — el reporte es insumo para escribir specs, no una spec

### `./scripts/reset-template.sh [--confirm]`

Úsalo cuando:
- clonaste este template y quieres empezar limpio con tu propio proyecto

Sin `--confirm`:
- imprime exactamente qué borraría y sale sin tocar nada

Con `--confirm` limpia:
- `idea/IDEA_GENERAL.md`, `bitacora/global/PROJECT_LOG.md`, `specs/INDEX.md`, `STATUS.md` (mantiene la estructura, quita el contenido)
- todas las carpetas de spec numeradas en `specs/` y la salida de `analysis/`

Nunca toca:
- `examples/`, `docs/`, `scripts/`

> [!WARNING]
> `--confirm` es destructivo y no tiene deshacer. Haz commit o respaldo primero.

## Scripts de validación

### `./scripts/validate-sdd.sh . --strict`

Chequea:
- carpetas y archivos requeridos
- integridad del bundle template
- carpetas numeradas de spec
- disciplina estricta de `history.md` cuando Git está disponible

Resultado exitoso:
- imprime líneas `[OK]`, `[WARN]` y `[FAIL]`
- termina con `Summary: X error(s), Y warning(s).`
- sale con código distinto de cero si existe algún error

### `./scripts/check-sdd-policy.sh .`

Chequea:
- `sdd.policy.yaml`
- archivos de reglas requeridos
- referencias a la fuente canónica
- frase de hard-stop
- frase de workspace recomendado por defecto

Resultado exitoso:
- imprime líneas `[OK]`, `[WARN]` y `[FAIL]`
- termina con `SDD Policy summary: X error(s), Y warning(s).`
- sale con código distinto de cero si existe algún error

### `./scripts/check-sdd-gate.sh .`

Chequea:
- estado de aprobación de specs
- señales de consistencia del plan
- presencia de tareas
- exigencia de consentimiento cuando existen specs aprobadas

Resultado exitoso:
- imprime el estado de la compuerta y sus mensajes de validación
- sale con código distinto de cero si la compuerta de implementación debe seguir cerrada

## Tools MCP

Alias amigables usados con frecuencia en chat:
- `/start-project` -> `sdd_create_workspace` o prompt guiado de inicio
- `/create-spec <nombre>` -> `sdd_create_spec`
- `/validate-project` -> `sdd_validate` + `sdd_check_gate`
- `/close-session` -> prompt de cierre + resumen de validación

### `sdd_create_workspace`

Alcance:
- solo workspace administrado
- crea `./www/<nombre-proyecto>/` dentro de este template

Salida estructurada:
- `projectRoot`
- `profile`
- `assistant`
- `usedSpecKit`

### `sdd_create_spec`

Alcance:
- se permite cualquier ruta de proyecto destino
- si la ruta vive dentro de este template, debe estar bajo `./www/`

Salida estructurada:
- `specId`
- `specDir`
- `indexUpdated`

### `sdd_validate`

Salida estructurada:
- `ok`
- `errors`
- `warnings`
- `messages[]`

### `sdd_check_gate`

Salida estructurada:
- `ok`
- `errors`
- `warnings`
- `approvedSpecs`
- `totalSpecs`
- `messages[]`

### `sdd_record_user_consent`

Salida estructurada:
- `logFile`
- `summary`
- `timestamp`

### `sdd_list_specs`

Salida estructurada:
- `specs[]`
  - `id`
  - `dir`
  - `status`

### `sdd_generate_status`

Salida estructurada:
- `path`
- `content`

Efecto lateral:
- crea o reemplaza `STATUS.md`

### `sdd_generate_roadmap`

Salida estructurada:
- `mermaidPath`
- `markdownPath`
- `mermaid`
- `markdown`

Efectos laterales:
- crea o reemplaza `docs/roadmap.mmd`
- crea o reemplaza `docs/roadmap.md`

### `sdd_append_project_log`

Salida estructurada:
- `path`
- `content`

Efecto lateral:
- agrega contenido a `bitacora/global/PROJECT_LOG.md`

### `sdd_write_daily_log`

Salida estructurada:
- `path`
- `content`

Reglas:
- `date` debe usar `YYYY-MM-DD`

Efecto lateral:
- crea o reemplaza `bitacora/diaria/YYYY-MM-DD.md`

### `sdd_write_handoff`

Salida estructurada:
- `path`
- `content`

Reglas:
- `fileName` debe ser un nombre simple markdown como `2026-03-18-handoff.md`

Efecto lateral:
- crea o reemplaza `bitacora/handoffs/<fileName>`

### `sdd_write_decision`

Salida estructurada:
- `path`
- `content`

Reglas:
- `fileName` debe ser un nombre simple markdown como `2026-03-18-decision.md`

Efecto lateral:
- crea o reemplaza `bitacora/decisiones/<fileName>`

## Regla práctica

- Usa `./www/<nombre-proyecto>/` como default limpio cuando el proyecto ejecutable debe vivir dentro de este template.
- Usa `init-project.sh` o `init-project-with-spec-kit.sh` con ruta absoluta cuando el usuario quiere el proyecto ejecutable en otro lugar.
- Nunca inicialices el proyecto ejecutable en la raíz del template.
