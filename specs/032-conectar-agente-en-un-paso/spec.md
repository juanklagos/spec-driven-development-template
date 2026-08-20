# Especificación 032 - Conectar el agente en un paso

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-08-12`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación / Approval evidence: Aprobado en sesión del 2026-08-12: ambas mejoras, con el requisito de cubrir todas las formas de conexión posibles y hacerlas lo más automáticas que se pueda, investigando la integración con los agentes de Codex, Claude, opencode y demás.

## Objetivo

Que conectar un agente al SDD Builder y dejarlo atendiendo la cola cueste un
comando y un slash command, en cualquiera de los siete clientes soportados,
sin abrir documentación ni redactar prompts a mano.

## Historia de usuario principal

Como persona que usa el SDD Builder, quiero conectar mi agente (Claude Code,
Codex, opencode, Cursor, Gemini CLI, Windsurf, VS Code) y dejarlo atendiendo
la cola de peticiones con **un solo comando**, sin buscar en la documentación
dónde va la config de cada cliente ni escribir a mano el prompt del bucle
cada sesión.

La spec 031 dejó el canal construido pero la conexión sigue siendo manual y
distinta en cada cliente: hay que registrar el MCP (archivo y formato
propios de cada herramienta) y luego pedirle al agente en lenguaje natural
que atienda la cola. Esta spec cierra ese hueco por tres caminos que
conviven, del más automático al más manual, para que ninguna herramienta se
quede fuera.

## Escenarios de aceptación

1. Dado un proyecto SDD y Claude Code instalado, cuando ejecuto
   `npx @juanklagos/sdd-mcp connect`, entonces el comando detecta los
   clientes presentes, escribe la configuración MCP en el archivo propio de
   cada uno, instala la skill portable de atención de cola, y me imprime la
   lista exacta de archivos que tocó y el siguiente paso.
2. Dado un archivo de configuración que ya existe con otros servidores MCP,
   cuando ejecuto `connect`, entonces mi configuración previa se conserva
   intacta y solo se añade o actualiza la entrada `sdd`; ejecutarlo dos
   veces deja el mismo resultado que ejecutarlo una vez.
3. Dado un cliente que lee el estándar abierto SKILL.md (Claude Code, Codex,
   Cursor y compatibles), cuando escribo `/sdd-serve` en su interfaz,
   entonces el agente entra en el bucle de atención de la cola sin que yo
   redacte ningún prompt.
4. Dado un cliente que expone los prompts MCP como slash commands (Claude
   Code, VS Code), cuando el MCP `sdd` está conectado, entonces existe un
   comando `sdd_serve_requests` disponible sin instalar ningún archivo.
5. Dado el builder con el estado "sin agente", cuando abro "Conectar
   agente", entonces veo mi ruta de proyecto y, por cliente, el comando
   exacto de conexión y el de atención, copiables con un clic.
6. Dado que no tengo ningún cliente instalado, cuando ejecuto `connect`,
   entonces el comando me lo dice sin fallar y me muestra las instrucciones
   manuales de cada cliente soportado.
7. Dado que quiero ver qué haría antes de que toque nada, cuando ejecuto
   `connect --dry-run`, entonces se imprime cada archivo y cambio previsto y
   no se escribe nada en disco.

## Criterios de aceptación (formato EARS recomendado)

- R1 — CUANDO se ejecute `sdd-mcp connect`, EL SISTEMA DEBERÁ detectar qué
  clientes están presentes (por existencia de su archivo o directorio de
  configuración, o de su binario en el PATH) y escribir la entrada del
  servidor `sdd` en el formato propio de cada cliente detectado, cubriendo
  como mínimo: Claude Code, Codex, Cursor, VS Code, Windsurf, Gemini CLI y
  opencode.
- R2 — CUANDO el archivo de configuración de un cliente ya exista, EL
  SISTEMA DEBERÁ fusionar la entrada `sdd` preservando todo el resto del
  contenido; SI la entrada `sdd` ya existe con el mismo valor, ENTONCES EL
  SISTEMA DEBERÁ dejar el archivo sin cambios e informar "sin cambios"
  (idempotencia observable).
- R3 — SI el archivo de configuración existente no se puede interpretar
  (JSON/TOML inválido), ENTONCES EL SISTEMA DEBERÁ dejarlo intacto, informar
  la ruta y el error, y continuar con los demás clientes sin abortar.
- R4 — CUANDO se ejecute `connect`, EL SISTEMA DEBERÁ instalar la skill
  portable `sdd-serve` en formato SKILL.md (estándar abierto: frontmatter
  con `name` y `description`) en el directorio de skills de cada cliente
  detectado que lo soporte, y en `.agents/skills/` como ubicación estándar
  del repositorio.
- R5 — CUANDO un cliente no lea SKILL.md pero tenga su propio formato de
  comandos, EL SISTEMA DEBERÁ instalar el equivalente nativo: TOML en
  `.gemini/commands/` para Gemini CLI y markdown en `.opencode/command/`
  para opencode.
- R6 — CUANDO un agente invoque la skill o el comando de atención, EL
  CONTENIDO DEBERÁ instruir el bucle completo: llamar `sdd_next_request`,
  redactar la propuesta, responder con `sdd_respond_request`, y NO escribir
  ningún archivo bajo `specs/`.
- R7 — EL SERVIDOR MCP DEBERÁ exponer un prompt `sdd_serve_requests` que
  entregue esas mismas instrucciones, para que los clientes que muestran
  prompts MCP como slash commands funcionen sin instalar archivos.
- R8 — CUANDO se ejecute `connect --dry-run`, EL SISTEMA DEBERÁ imprimir
  cada archivo que escribiría y qué cambio haría, y NO DEBERÁ escribir nada
  en disco.
- R9 — CUANDO no se detecte ningún cliente, EL SISTEMA DEBERÁ terminar con
  éxito (código 0) informando que no encontró clientes y mostrando las
  instrucciones manuales por cliente.
- R10 — CUANDO el builder muestre el estado "sin agente", EL SISTEMA DEBERÁ
  ofrecer una acción "Conectar agente" (también en ⌘K) que muestre la ruta
  del proyecto y, por cliente, el comando de conexión y el de atención,
  copiables individualmente.
- R11 — CUANDO `connect` termine, EL SISTEMA DEBERÁ imprimir un resumen con
  cada archivo tocado (ruta absoluta), su estado (`creado` / `actualizado` /
  `sin cambios` / `error`) y el siguiente paso exacto para atender la cola.

## Requisitos

- Un módulo de conectores en `sdd-core`, uno por cliente, con: nombre,
  detección, ruta del archivo de config, formato (JSON/TOML), forma de la
  entrada, y directorio de skills o comandos.
- Escrituras atómicas y con merge; nunca reescribir un archivo completo con
  plantilla propia.
- Subcomando `connect` en el CLI de `sdd-mcp`, con `--client <nombre>`,
  `--dry-run` y `--global` (config de usuario en vez de proyecto).
- Skill portable `sdd-serve` como fuente única, emitida a todos los
  destinos; su texto vive en el framework payload, no duplicado por cliente.
- Prompt MCP `sdd_serve_requests`, registrado junto al resto.
- Panel "Conectar agente" en el builder (accesible desde el estado sin
  agente y desde ⌘K), con los comandos exactos por cliente.
- Documentación bilingüe: tabla de clientes con archivo, formato y comando.

## Fuera de alcance / Out of scope

- Lanzar el agente por nosotros (que el builder o el servidor ejecuten
  `claude`/`codex` como subproceso): el usuario ejecuta sus propios
  comandos.
- Instalar los clientes de agente (npm/brew): solo configuramos los que ya
  existen.
- Autenticación o gestión de API keys de ningún cliente.
- Cubrir clientes fuera de la lista de R1 (queda el camino manual y la
  documentación).
- Cambiar el protocolo de la cola de la spec 031.

## Propiedades de la spec (opcional, puente a specs ejecutables)

- Para todo archivo de configuración preexistente y válido, tras `connect`
  EL SISTEMA DEBERÁ conservar todas las claves que no sean la entrada `sdd`.
- Para toda ejecución de `connect`, ejecutarla de nuevo sin cambios externos
  DEBERÁ reportar "sin cambios" en todos los destinos.

## Ámbito de archivos / File scope

- `packages/sdd-core/src/connect.ts` — conectores y merge
- `packages/sdd-mcp/src/cli.ts` — subcomando `connect`
- `packages/sdd-mcp/src/server.ts` — prompt `sdd_serve_requests`
- `builder/src/components/ConnectAgentModal.tsx` — panel del builder
- `template-context/` o payload del framework — texto de la skill

## Criterios de éxito

- Conectar un cliente nuevo y dejarlo atendiendo la cola cuesta un comando y
  un slash command, sin abrir documentación.
- Ninguna configuración previa del usuario se pierde en ninguno de los siete
  clientes soportados (verificado por prueba con config preexistente).
- Quien no use ninguno de los siete clientes sigue teniendo instrucciones
  claras y el prompt copiable de la spec 031.
