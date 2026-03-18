# Referencia completa de MCP

## Propósito

Esta es la referencia dedicada y orientada al usuario para el servidor local `sdd-mcp`.

Usa esta página cuando necesites saber:
- para qué sirve el servidor MCP
- qué tools, resources y prompts expone
- qué hace cada operación
- qué efectos laterales produce
- qué puede esperar el usuario como salida

Mantén [33-guia-servidor-mcp.md](./33-guia-servidor-mcp.md) como guía de instalación y conexión.
Mantén [40-referencia-resultados-comandos.md](./40-referencia-resultados-comandos.md) como referencia de resultados script por script.

## Qué es `sdd-mcp`

`sdd-mcp` es la capa MCP operativa de este framework.

Da a los clientes IA una forma estructurada de:
- crear o inicializar workspaces SDD
- crear e inspeccionar specs
- validar el estado SDD de un proyecto
- aplicar la compuerta de implementación
- escribir artefactos de trazabilidad
- leer contexto clave del proyecto a través de resources MCP

No es solo acceso a documentación. Es la interfaz ejecutable del framework.

## Qué puede esperar el usuario

Cuando un cliente IA está conectado a `sdd-mcp`, el usuario puede esperar:
- salidas estructuradas en vez de texto ambiguo
- escrituras determinísticas para status, roadmap, bitácora y trazabilidad
- chequeos explícitos de compuerta antes de implementar
- la opción de usar el workspace limpio por defecto en `./www/<nombre-proyecto>/`
- soporte para rutas externas en los tools basados en `projectRoot`

## Reglas de alcance

- Workspace recomendado por defecto dentro de este template: `./www/<nombre-proyecto>/`
- También se soportan rutas externas para tools que reciben `projectRoot`
- El proyecto ejecutable nunca debe inicializarse en la raíz del template
- Si un proyecto destino vive dentro de este template, debe vivir bajo `./www/`

## Transportes

Transportes soportados:
- `stdio`
- `Streamable HTTP`

Entrypoints:
- stdio: `packages/sdd-mcp/dist/index.js`
- HTTP: `http://127.0.0.1:3334/mcp`

## Referencia de tools

### `sdd_create_workspace`

Propósito:
- crear un workspace ejecutable administrado bajo `./www/<nombre-proyecto>/`

Cuándo usarlo:
- cuando el usuario quiere el workspace recomendado por defecto dentro de este template

Entrada:
- `projectName`
- `assistant`
- `profile`
- `useSpecKit`

Qué hace:
- crea la base SDD del workspace
- opcionalmente inicializa Spec Kit

Qué debe esperar el usuario:
- una carpeta de proyecto limpia bajo `./www/`
- ningún cambio fuera de ese workspace administrado

Salida estructurada:
- `projectRoot`
- `profile`
- `assistant`
- `usedSpecKit`

### `sdd_create_spec`

Propósito:
- crear la siguiente carpeta numerada de spec a partir del bundle template

Cuándo usarlo:
- cuando el proyecto destino ya tiene la base SDD y necesita una nueva spec de feature

Entrada:
- `projectRoot`
- `featureName`
- `owner`

Qué hace:
- crea `spec.md`, `plan.md`, `tasks.md`, `research.md`, `history.md`
- crea `contracts/README.md`
- agrega una fila en `specs/INDEX.md`

Qué debe esperar el usuario:
- una nueva carpeta numerada de spec
- el índice del proyecto actualizado automáticamente

Salida estructurada:
- `specId`
- `specDir`
- `indexUpdated`

### `sdd_validate`

Propósito:
- validar la estructura SDD y los archivos requeridos de un proyecto destino

Cuándo usarlo:
- antes de cerrar una sesión
- antes de confiar en un proyecto migrado o recién inicializado

Entrada:
- `projectRoot`

Qué hace:
- verifica carpetas requeridas
- verifica archivos requeridos
- verifica bundles numerados de spec

Qué debe esperar el usuario:
- un resumen estructurado de validación
- errores y warnings explícitos

Salida estructurada:
- `ok`
- `errors`
- `warnings`
- `messages[]`

### `sdd_check_gate`

Propósito:
- decidir si la implementación está permitida bajo las reglas SDD

Cuándo usarlo:
- inmediatamente antes de implementar

Entrada:
- `projectRoot`

Qué hace:
- revisa estado de aprobación
- revisa señales de consistencia del plan
- revisa presencia de tareas
- revisa exigencia de consentimiento cuando existen specs aprobadas

Qué debe esperar el usuario:
- un resultado claro tipo sí/no
- razones explícitas si la implementación debe seguir bloqueada

Salida estructurada:
- `ok`
- `errors`
- `warnings`
- `approvedSpecs`
- `totalSpecs`
- `messages[]`

### `sdd_record_user_consent`

Propósito:
- registrar aprobación explícita del usuario antes de iniciar implementación

Cuándo usarlo:
- solo cuando la implementación realmente va a comenzar

Entrada:
- `projectRoot`
- `summary`

Qué hace:
- agrega una línea con timestamp en `.sdd/user-consent.log`

Qué debe esperar el usuario:
- una traza durable de aprobación

Salida estructurada:
- `logFile`
- `summary`
- `timestamp`

### `sdd_list_specs`

Propósito:
- listar las specs numeradas y su estado

Cuándo usarlo:
- para elegir la spec activa de una sesión

Entrada:
- `projectRoot`

Qué hace:
- lee las specs numeradas
- extrae el estado de aprobación desde `spec.md`

Qué debe esperar el usuario:
- una lista compacta de las specs actuales y su estado

Salida estructurada:
- `specs[]`
  - `id`
  - `dir`
  - `status`

### `sdd_generate_status`

Propósito:
- construir un dashboard de estado del proyecto

Cuándo usarlo:
- al cierre de sesión
- antes de un handoff

Entrada:
- `projectRoot`

Qué hace:
- crea o reemplaza `STATUS.md`
- resume specs activas
- resume progreso de tareas
- incluye extracto reciente del log global

Qué debe esperar el usuario:
- un documento de estado listo para revisar o compartir

Salida estructurada:
- `path`
- `content`

### `sdd_generate_roadmap`

Propósito:
- generar un roadmap a partir de `specs/INDEX.md`

Cuándo usarlo:
- cuando el usuario quiere un roadmap visual y otro en markdown

Entrada:
- `projectRoot`

Qué hace:
- crea o reemplaza `docs/roadmap.mmd`
- crea o reemplaza `docs/roadmap.md`

Qué debe esperar el usuario:
- una fuente Mermaid
- un documento markdown del roadmap

Salida estructurada:
- `mermaidPath`
- `markdownPath`
- `mermaid`
- `markdown`

### `sdd_append_project_log`

Propósito:
- agregar una entrada al log global del proyecto

Cuándo usarlo:
- para registrar cambios de alto nivel de una sesión

Entrada:
- `projectRoot`
- `entry`

Qué hace:
- agrega contenido a `bitacora/global/PROJECT_LOG.md`

Qué debe esperar el usuario:
- un archivo de log global actualizado

Salida estructurada:
- `path`
- `content`

### `sdd_write_daily_log`

Propósito:
- crear o reemplazar un archivo de bitácora diaria

Cuándo usarlo:
- para guardar la nota de sesión de una fecha

Entrada:
- `projectRoot`
- `date`
- `content`

Reglas:
- `date` debe usar `YYYY-MM-DD`

Qué hace:
- crea o reemplaza `bitacora/diaria/YYYY-MM-DD.md`

Qué debe esperar el usuario:
- un documento de log por fecha

Salida estructurada:
- `path`
- `content`

### `sdd_write_handoff`

Propósito:
- crear o reemplazar un archivo de handoff

Cuándo usarlo:
- cuando una sesión deja un siguiente paso claro para otro operador o agente

Entrada:
- `projectRoot`
- `fileName`
- `content`

Reglas:
- `fileName` debe ser un nombre simple markdown

Qué hace:
- crea o reemplaza `bitacora/handoffs/<fileName>`

Qué debe esperar el usuario:
- un handoff durable

Salida estructurada:
- `path`
- `content`

### `sdd_write_decision`

Propósito:
- crear o reemplazar un registro de decisión

Cuándo usarlo:
- cuando la sesión toma una decisión importante del proyecto

Entrada:
- `projectRoot`
- `fileName`
- `content`

Reglas:
- `fileName` debe ser un nombre simple markdown

Qué hace:
- crea o reemplaza `bitacora/decisiones/<fileName>`

Qué debe esperar el usuario:
- un registro de decisión durable

Salida estructurada:
- `path`
- `content`

## Referencia de resources

### Resources estáticos

#### `sdd-policy`
- lee la política actual del framework
- úsalo cuando la IA necesita primero las reglas duras

#### `sdd-ai-start`
- lee la guía rápida de onboarding para IA
- úsalo cuando el operador arranca desde cero

#### `sdd-quickstart`
- lee la guía corta de quickstart
- úsalo cuando el operador necesita la ruta más corta posible

#### `sdd-spec-template`
- lee la plantilla base de `spec.md`
- úsalo cuando la IA necesita entender la estructura esperada de una spec

### Resource templates de workspace administrado

Estos resource templates son para proyectos administrados bajo `./www/<nombre-proyecto>/`.

#### `sdd-project-index`
- devuelve `specs/INDEX.md`
- espera una vista superior de las specs del proyecto

#### `sdd-project-log`
- devuelve `bitacora/global/PROJECT_LOG.md`
- espera el log global del proyecto

#### `sdd-project-latest-handoff`
- devuelve el archivo más reciente en `bitacora/handoffs/`
- espera el último handoff, si existe

#### `sdd-project-idea`
- devuelve `idea/IDEA_GENERAL.md`
- espera la intención y alcance del proyecto

#### `sdd-spec-document`
- devuelve un documento específico de una spec por id y nombre de archivo
- documentos soportados:
  - `spec.md`
  - `plan.md`
  - `tasks.md`
  - `research.md`
  - `history.md`

## Referencia de prompts

### `start_new_sdd_project`
- úsalo cuando el usuario quiere iniciar un proyecto nuevo desde este framework
- espera que la IA cree primero la base SDD y posponga implementación hasta que la compuerta esté cumplida

### `adapt_existing_project_to_sdd`
- úsalo cuando el usuario ya tiene un proyecto y quiere agregar estructura SDD
- espera que la IA preserve el comportamiento actual y agregue trazabilidad

### `close_sdd_session`
- úsalo al terminar una sesión
- espera un resumen con objetivo, cambios, validación, riesgos y próximo paso

## Flujo recomendado para el usuario

1. Conecta el servidor MCP.
2. Lee `sdd-policy` y `sdd-quickstart`.
3. Crea la base SDD con `sdd_create_workspace` o con scripts de bootstrap externo.
4. Crea la primera spec con `sdd_create_spec`.
5. Valida con `sdd_validate`.
6. Antes de implementar, ejecuta `sdd_check_gate`.
7. Si todo está aprobado, registra consentimiento con `sdd_record_user_consent`.
8. Cierra la sesión con status, logs y handoff según haga falta.

## Resumen de expectativa para el usuario

El usuario debe esperar que este MCP:
- guíe el trabajo SDD con estructura, no con improvisación
- cree archivos predecibles
- bloquee implementación cuando la documentación no está lista
- preserve trazabilidad entre sesiones
- haga que distintos clientes IA se comporten de forma más consistente sobre el mismo proyecto
