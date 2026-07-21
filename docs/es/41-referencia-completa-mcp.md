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
Mantén [43-guia-mcp-facil.md](./43-guia-mcp-facil.md) como vista no técnica y por comandos estilo slash.

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

## Arquitectura visual

```mermaid
flowchart LR
  A["Usuario"] --> B["Cliente IA"]
  B --> C["sdd-mcp"]
  C --> D["sdd-core"]
  C --> E["Resources MCP"]
  D --> F["Proyecto destino"]
  E --> F
  F --> G["idea/"]
  F --> H["specs/"]
  F --> I["bitacora/"]
  F --> J["docs/"]
```

Ruta de lectura:
- el cliente IA lee resources y prompts MCP
- `sdd-mcp` expone el contrato operativo
- `sdd-core` ejecuta las mutaciones reales del proyecto
- el proyecto destino guarda los artefactos SDD resultantes

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

### `sdd_board_read`

Propósito:
- leer el board visual del SDD Builder de un proyecto destino

Cuándo usarlo:
- cuando la IA necesita el layout del lienzo más cada spec con estado y progreso de tareas

Entrada:
- `projectRoot`

Qué hace:
- lee `specs/board.canvas` (JSON Canvas), generando un layout por defecto si falta
- lista las specs con estado de aprobación y conteo de tareas hechas/totales

Qué debe esperar el usuario:
- exactamente la misma vista que renderiza el lienzo `/builder`

Salida estructurada:
- `canvas` (nodes, edges)
- `specs` (id, dir, status, tasks)

### `sdd_board_write`

Propósito:
- reemplazar el layout del lienzo del board

Cuándo usarlo:
- cuando la IA organiza o reordena tarjetas y uniones en conjunto

Reglas:
- solo se guarda layout; los archivos markdown nunca se tocan

Qué hace:
- valida y escribe atómicamente `specs/board.canvas`

Entrada:
- `projectRoot`
- `canvas`

Salida estructurada:
- `ok`
- `nodes`
- `edges`

### `sdd_board_connect`

Propósito:
- conectar dos tarjetas existentes del board con una unión etiquetada opcional

Cuándo usarlo:
- cuando la IA registra una dependencia o relación entre tarjetas

Reglas:
- ambos ids de nodo deben existir en el board
- las uniones idénticas no se duplican (idempotente)

Entrada:
- `projectRoot`
- `fromNode`
- `toNode`
- `label`

Salida estructurada:
- `canvas`

### `sdd_read_tasks`

Propósito:
- leer las tareas checkbox del `tasks.md` de una spec

Cuándo usarlo:
- antes de marcar una tarea, para obtener números de línea y estado

Entrada:
- `projectRoot`
- `specId`

Salida estructurada:
- `specId`
- `tasks` (text, done, line)

### `sdd_set_task_done`

Propósito:
- marcar o desmarcar una línea checkbox del `tasks.md` de una spec

Cuándo usarlo:
- cuando una tarea se completa o se reabre durante una sesión

Reglas:
- edición quirúrgica de la única línea `- [ ]` / `- [x]`, escritura atómica
- `line` viene de `sdd_read_tasks`

Entrada:
- `projectRoot`
- `specId`
- `line`
- `done`

Salida estructurada:
- `specId`
- `tasks`

### `sdd_gate_summary`

Propósito:
- semáforo del gate en una sola llamada: el chequeo de compuerta más la validación estructural, con cada mensaje agrupado por la spec a la que pertenece

Cuándo usarlo:
- cuando quieres el estado completo del workspace en una sola llamada (es el dato detrás del chip de gate del SDD Builder y de los badges por tarjeta)

Reglas:
- misma capa `sdd-core` que la ruta REST `/api/gate` — no hay una segunda copia de la regla
- `dependencyWarnings` son solo avisos (una spec aprobada que depende de una no aprobada), nunca errores de compuerta

Entrada:
- `projectRoot`

Salida estructurada:
- `ok`
- `errors`, `warnings` (conteos)
- `messages` agrupados por spec
- `dependencyWarnings`

### `sdd_approve_spec`

Propósito:
- rellenar quirúrgicamente el bloque de aprobación existente de un `spec.md`

Cuándo usarlo:
- cuando la persona que decide aprobó la spec y hay que dejar la evidencia en disco antes de implementar

Reglas:
- escribe `Estado` -> `Aprobado`, fecha de aprobación -> hoy, aprobador -> el nombre indicado
- `evidence` siempre gana cuando se entrega; sin él, una línea de evidencia existente nunca se sobrescribe
- falla con un error bilingüe claro cuando falta el bloque `## Estado de aprobación / Approval status` — copia primero el bloque desde `specs/_template/spec.md`
- la tool registra la decisión, no la toma: aprobar es siempre un acto humano

Entrada:
- `projectRoot`
- `specId`
- `approver`
- `evidence` (opcional)

Salida estructurada:
- `specId`
- `status`
- `approvalDate`
- `approver`
- `evidenceUpdated`
- `fieldsUpdated`

### `sdd_update_spec_sections`

Propósito:
- reemplazar **solo** el contenido bajo los encabezados del editor guiado de un `spec.md`, preservando todo lo demás

Cuándo usarlo:
- cuando llenas o refinas una spec desde un editor guiado o desde la conversación, sin reescribir el archivo completo

Reglas:
- lectura-modificación-escritura quirúrgica, atómica y serializada: dos guardados concurrentes hacen cola en vez de pisarse
- el bloque de aprobación siempre se preserva
- tolerante a los encabezados EN/ES de la plantilla del repo; un encabezado que el archivo no tiene se agrega al final con su título bilingüe canónico y se reporta en `created`

Entrada:
- `projectRoot`
- `specId`
- `story` (opcional, texto libre)
- `scenarios`, `criteria`, `requirements`, `properties`, `successCriteria` (opcionales, listas)
- `outOfScope` (opcional, texto libre)

Salida estructurada:
- `specId`
- `updated` (secciones reemplazadas en su lugar)
- `created` (secciones agregadas porque el archivo no las tenía)

### `sdd_board_app`

Propósito:
- mostrar el board SDD visual **dentro del cliente** como MCP App (SEP-1865, extensión oficial `ext-apps`)

Cuándo usarlo:
- cuando el usuario quiere *ver* el board (tarjetas, uniones, semáforo del gate, avisos de dependencias) sin salir del chat

Reglas:
- vista de solo lectura; vinculada al recurso `ui://sdd/board.html` vía `_meta.ui.resourceUri` (`text/html;profile=mcp-app`)
- los hosts sin soporte de MCP Apps reciben igualmente los datos completos de board + gate como texto JSON
- un gate cerrado es dato de la vista, nunca un error de la tool

Entrada:
- `projectRoot`

Salida estructurada:
- `projectRoot`
- `board` (canvas + specs, misma forma que `sdd_board_read`)
- `gate` (misma forma que `sdd_gate_summary`)

## Referencia de resources

### Resources estáticos

#### `sdd-policy`
- lee la política actual del framework
- úsalo cuando la IA necesita primero las reglas duras

#### `sdd-ai-start`
- lee la guía rápida de onboarding para IA
- úsalo cuando el operador arranca desde cero

#### `sdd-easy-mcp-guide`
- lee la guía amigable y no técnica de MCP
- úsalo cuando el operador quiere primero la explicación más fácil posible

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

### URIs de recursos / Resource URIs

Lee un recurso con `resources/read` usando su URI exacta. Recursos estáticos:

| URI | Qué devuelve |
|---|---|
| `sdd://policy/current` | `sdd.policy.yaml` — la política legible por máquina |
| `sdd://docs/quickstart` | `QUICKSTART.md` |
| `sdd://docs/ai-start` | `AI_START_HERE.md` |
| `sdd://docs/easy-mcp` | The easy MCP guide (43) |
| `sdd://templates/spec` | La plantilla de spec que usa `sdd_create_spec` |

Plantillas por proyecto — sustituye `{projectName}` por el nombre del workspace, y `{specId}` / `{document}` (`spec.md`, `plan.md`, `tasks.md`, `research.md`, `history.md`):

| URI template |
|---|
| `sdd://project/{projectName}/index` |
| `sdd://project/{projectName}/idea` |
| `sdd://project/{projectName}/project-log` |
| `sdd://project/{projectName}/latest-handoff` |
| `sdd://project/{projectName}/specs/{specId}/{document}` |

### Rutas REST del builder / REST routes

El transporte HTTP también sirve la API del builder en el mismo puerto. Escucha solo en loopback y rechaza mutaciones cross-origin — ver las notas de seguridad en la guía 51.

| Método | Ruta | Para qué |
|---|---|---|
| GET | `/api/board` | El lienzo y cada spec con su estado y progreso |
| PUT | `/api/board` | Guarda el layout del lienzo (`specs/board.canvas`) |
| GET | `/api/gate` | Resumen de la compuerta, errores por spec y avisos de dependencias |
| GET | `/api/events` | Stream SSE de cambios del workspace (sync en vivo) |
| POST | `/api/spec` | Crea un paquete de spec real |
| GET | `/api/spec/:id` | Una spec: documentos y tareas parseadas |
| PUT | `/api/spec/:id/tasks` | Marca/desmarca una tarea en `tasks.md` |
| PUT | `/api/spec/:id/sections` | Reescribe secciones de spec.md (quirúrgico) |
| POST | `/api/spec/:id/approve` | Rellena el bloque de aprobación |
| POST | `/api/spec/:id/issues` | Crea issues de GitHub para las tareas pendientes (requiere `gh`) |

## Referencia de prompts

### `start_new_sdd_project`
- úsalo cuando el usuario quiere iniciar un proyecto nuevo desde este framework
- espera que la IA cree primero la base SDD y posponga implementación hasta que la compuerta esté cumplida

### `easy_start_project`
- úsalo cuando el usuario quiere iniciar un proyecto con guía tipo niño de 10 años
- espera que la IA explique acción, archivos tocados, resultado esperado y siguiente paso

### `easy_create_spec`
- úsalo cuando el usuario dice algo como `/create-spec pagos`
- espera que la IA cree el paquete de spec y explique el resultado con lenguaje simple

### `easy_show_structure`
- úsalo cuando el usuario se siente perdido y necesita el mapa de carpetas explicado fácil
- espera que la IA describa la estructura del proyecto como un mapa básico

### `easy_validate_project`
- úsalo cuando el usuario quiere validación y estado de compuerta en lenguaje simple
- espera que la IA traduzca warnings y errores a un único siguiente paso claro

### `easy_show_next_step`
- úsalo cuando el usuario quiere el siguiente paso SDD seguro sin jerga
- espera que la IA elija un solo siguiente paso exacto

### `adapt_existing_project_to_sdd`
- úsalo cuando el usuario ya tiene un proyecto y quiere agregar estructura SDD
- espera que la IA preserve el comportamiento actual y agregue trazabilidad

### `close_sdd_session`
- úsalo al terminar una sesión
- espera un resumen con objetivo, cambios, validación, riesgos y próximo paso

### `easy_close_session`
- úsalo al terminar una sesión con usuario no técnico
- espera que la IA resuma en lenguaje simple y deje un solo siguiente paso exacto

## Flujo recomendado para el usuario

```mermaid
flowchart LR
  A["Conectar MCP"] --> B["Leer policy + quickstart"]
  B --> C["Crear base SDD"]
  C --> D["Crear primera spec"]
  D --> E["Validar"]
  E --> F["Revisar compuerta"]
  F --> G["Registrar consentimiento"]
  G --> H["Implementar"]
  H --> I["Escribir logs y handoff"]
```

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
