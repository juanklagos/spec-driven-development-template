# Especificación 029 - actualizar SDD sin sorpresas

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-08-12`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-08-12: "sigue con las 029 y luego se necesita publicar todo a main" — instrucción explícita de retomar e implementar la spec

## Objetivo / Objective

Que actualizar SDD en un proyecto que ya lo usa sea una acción **nombrada, visible
y reversible**, y que entre versiones nada diverja en silencio. Hoy no existe un
camino de actualización: existe un efecto secundario de reinstalar, sin nombre, sin
aviso previo y sin forma de saber que hacía falta.
/ Make updating SDD in a project that already uses it a **named, visible and
reversible** action, and stop anything from silently diverging between versions.

## Historia de usuario principal

Como persona que ya tiene SDD instalado en un proyecto real, quiero que el sistema
me diga cuándo me he quedado atrás y actualizarme con un solo gesto, sabiendo de
antemano qué va a tocar y qué es mío, sin tener que leer el instalador para
averiguar qué se sobrescribe.

## Contexto (medido, no supuesto)

Todo lo que sigue se verificó el 2026-08-08 contra los paquetes publicados en npm
y contra el entorno real del propietario.

**D1. El andamiador aborta en vez de actualizar.** `npx @juanklagos/create-sdd-project@latest .`
sobre un proyecto que ya tiene sidecar responde:

```
✖ .../spec already exists — aborting to avoid overwriting.
```

No propone alternativa. Es el comando que QUICKSTART y ambos README enseñan, así
que el usuario concluye razonablemente que no hay forma de actualizar.

**D2. La vía que sí funciona no tiene nombre.** `sdd_install_sidecar` **es**
idempotente y hace lo correcto. Verificado sobre un sidecar 2.2.1 con un script
manipulado y contenido propio: reparó `check-sdd-gate.sh`, subió
`.sdd/TEMPLATE_VERSION` de 2.2.1 a 2.3.0 y dejó intactos `idea/`, la spec del
usuario y su decisión. Pero se llama «install», su descripción dice «instalar el
sidecar en un proyecto externo EXISTENTE», y nada en el producto la presenta como
la forma de ponerse al día.

**D3. Un tercio del sidecar nunca se actualiza, y sí cambia.** El instalador
separa `copy_framework_file` (`cp -f`, se repara) de `copy_if_absent` (se conserva
para siempre). En el segundo grupo están `sdd.policy.yaml`, `specs/_template/*`,
`template-context/core-instructions/AGENT_OPERATING_SYSTEM.md` y las plantillas de
bitácora. Medido con `git log` desde la v1.5.1:

| Archivo | Cambios desde v1.5.1 | Llega a proyectos existentes |
|---|---|---|
| `templates/sidecar/sdd.policy.yaml` | 2 | nunca |
| `specs/_template/spec.md` | 2 | nunca |
| `.../AGENT_OPERATING_SYSTEM.md` | 1 | nunca |
| `bitacora/templates/DECISION_TEMPLATE.md` | 1 | nunca |

La decisión de conservarlos es correcta —son editables por el usuario— pero hoy se
paga en silencio: un proyecto instalado en la 1.5.1 valida contra una política de
seis releases atrás y crea specs con una plantilla vieja, sin un solo aviso.

**D4. El desajuste de versión del servidor sigue vivo, y en este mismo repositorio.**
La spec 021 documentó el daño de correr un `sdd-mcp` cacheado y lo dio por rodeado
porque «todos los comandos publicados fijan `@latest`». No todos: el `.mcp.json`
de este template declara `"args": ["-y", "@juanklagos/sdd-mcp"]`, sin `@latest`.
Medido hoy contra la 2.3.0 publicada:

| Invocación | Herramientas servidas |
|---|---|
| `npx -y @juanklagos/sdd-mcp` | **21** |
| `npx -y @juanklagos/sdd-mcp@latest` | **35** |

Catorce herramientas ausentes y ningún aviso. En la máquina del propietario había
además un servidor HTTP vivo (PID 49839) sirviendo 21 herramientas desde una caché
de la 2.2.1, consumido por otro proyecto vía `http://127.0.0.1:3334/mcp`.

**D6. La divergencia silenciosa también muerde hacia dentro: el pin entre
paquetes.** Medido el 2026-08-12 publicando la 2.4.0. `@juanklagos/sdd-mcp`
declaraba `"@juanklagos/sdd-core": "2.3.0"` con versión **exacta**. Al subir el
núcleo a 2.4.0 y empaquetar, npm dejó de considerar el tarball local y bajó el
2.3.0 del registro; el paquete instalado moría al arrancar con
`does not provide an export named 'SERVE_QUEUE_INSTRUCTIONS'` — el mismo
síntoma que habría tenido cualquiera al hacer `npx` el día de la publicación.
Lo cazó `scripts/smoke-test-npm-package.mjs` porque instala tarballs de verdad
en un proyecto limpio; nada más lo habría visto. Es la misma familia de defecto
que D4 (dos versiones que no coinciden y nadie lo dice), pero en la puerta del
mantenedor en vez de la del usuario, y se repetirá en **cada** release mientras
el pin se suba a mano.

**D5. Existe el marcador, falta la comparación.** `.sdd/TEMPLATE_VERSION` ya guarda
`template_version`, `profile` e `installed_at`. Nadie lo lee para compararlo con la
versión del servidor en marcha. La materia prima del aviso ya está en disco.

## Escenarios de aceptación

1. **Sidecar atrasado, usuario con agente.** El proyecto tiene `template_version=2.2.1`
   y el servidor conectado es 2.3.0. El usuario pide actualizar. El sistema informa qué
   archivos del framework refrescará, qué archivos propios difieren de la versión nueva,
   y no toca ninguno de los segundos sin respuesta explícita.
2. **Sidecar al día.** Mismo gesto, `template_version` igual a la del servidor. El
   sistema responde que no hay nada que hacer y no escribe un solo byte.
3. **Archivo propio divergente.** El usuario editó `sdd.policy.yaml`. La actualización
   lo detecta, lo enumera con el motivo del cambio en la versión nueva, y ofrece
   aplicar, saltar o ver la diferencia. Al saltar, el archivo queda byte a byte igual.
4. **Andamiador sobre proyecto existente.** `create-sdd-project` encuentra `spec/` y,
   en vez de abortar a secas, nombra el comando exacto de actualización.
5. **Servidor viejo.** El usuario ejecuta el binario cacheado contra un sidecar más
   nuevo, o al revés. El sistema lo dice en voz alta antes de operar, con las dos
   versiones y el comando que lo corrige.

## Criterios de aceptación (formato EARS recomendado) / Acceptance criteria

- CUANDO el usuario solicite actualizar un proyecto cuyo `template_version` sea menor
  que la versión del servidor, EL SISTEMA DEBERÁ refrescar los archivos propiedad del
  framework y reportar cada uno por nombre.
- CUANDO la actualización encuentre un archivo del grupo conservado cuyo contenido
  difiera del de la versión nueva, EL SISTEMA DEBERÁ enumerarlo y NO DEBERÁ escribirlo
  sin una respuesta explícita del usuario.
- CUANDO el usuario elija saltar un archivo divergente, EL SISTEMA DEBERÁ dejarlo
  idéntico byte a byte.
- SI el `template_version` del proyecto ya coincide con la versión del servidor,
  ENTONCES EL SISTEMA DEBERÁ informarlo y NO DEBERÁ realizar ninguna escritura.
- CUANDO el andamiador encuentre un `spec/` existente, EL SISTEMA DEBERÁ nombrar el
  comando de actualización en su salida en vez de abortar sin alternativa.
- MIENTRAS el Builder esté conectado a un workspace cuyo `template_version` sea menor
  que la versión del servidor, EL SISTEMA DEBERÁ mostrar ese desfase en la interfaz.
- CUANDO la versión del servidor y la del sidecar no coincidan, EL SISTEMA DEBERÁ
  declarar ambas versiones y el comando que las alinea.
- SI la dependencia interna de `sdd-mcp` sobre `sdd-core` no coincide con la
  versión declarada por `sdd-core`, ENTONCES LA VERIFICACIÓN DEL REPOSITORIO
  DEBERÁ fallar nombrando ambas versiones y el archivo a corregir.

## Requisitos

- **R1. Comparación de versiones en el núcleo.** Función en `sdd-core` que lea
  `.sdd/TEMPLATE_VERSION`, la compare con la versión del paquete en marcha y
  clasifique cada archivo del sidecar en: al día, del framework a refrescar,
  conservado e idéntico, o conservado y divergente. Sin efectos secundarios.
- **R2. Actualización con aviso previo.** Operación de actualización que aplique lo
  del framework, enumere lo divergente y no lo escriba sin permiso explícito. Modo
  de solo diagnóstico que no escriba nada.
- **R3. Herramienta MCP `sdd_upgrade`.** Nombre reconocible para lo que hoy solo
  ocurre como efecto secundario de `sdd_install_sidecar`.
- **R4. Comando de terminal.** Bandera del binario publicado para quien no usa
  agente, coherente con el contrato de la spec 021: nunca en silencio.
- **R5. Aviso en el Builder.** El desfase visible en el lienzo, con la acción al lado.
- **R6. El andamiador redirige.** `create-sdd-project` sobre un `spec/` existente
  nombra el comando de actualización en vez de abortar a secas.
- **R7. Fijar `@latest` donde falta.** El `.mcp.json` de este repositorio, y
  cualquier comando publicado que aún no lo fije. Cierra el hueco que la spec 021
  dio por cerrado. *(Resuelto el 2026-08-08 en el commit `014a349`; queda la
  auditoría del resto de comandos publicados.)*
- **R8. Documentación.** Guía de actualización ES/EN, enlazada desde QUICKSTART y
  ambos README.
- **R9. El pin interno deja de ser manual.** CUANDO se verifique el repositorio,
  EL SISTEMA DEBERÁ fallar si la dependencia de `@juanklagos/sdd-mcp` sobre
  `@juanklagos/sdd-core` no coincide con la versión que ese paquete declara.
  Cubre D6: el desajuste se detecta antes de empaquetar, no al publicar.

## Propiedades de la spec / Spec properties

- Para todo archivo del grupo conservado, si el usuario no autoriza su escritura,
  su contenido tras la actualización DEBERÁ ser idéntico byte a byte al de antes.
- Para todo proyecto ya al día, una actualización DEBERÁ dejar el árbol de archivos
  sin ninguna modificación (`mtime` incluido donde el sistema de archivos lo permita).
- Actualizar dos veces seguidas DEBERÁ producir el mismo resultado que actualizar
  una vez (idempotencia).

## Ámbito de archivos / File scope

- `packages/sdd-core/src/` — comparación y actualización
- `packages/sdd-mcp/src/server.ts` — herramienta `sdd_upgrade`
- `packages/sdd-mcp/src/cli.ts` — bandera de terminal
- `scripts/install-spec-sidecar.sh` — clasificación de archivos
- `packages/create-sdd-project/index.mjs` — redirección
- `builder/src/` — aviso de desfase
- `.mcp.json` — fijar `@latest`

## Criterios de éxito

- Un proyecto en 1.5.1 llega a la versión actual con un solo gesto, sabiendo de
  antemano qué se toca.
- Ningún archivo editado por el usuario cambia sin que el usuario lo haya dicho.
- El desfase de versión deja de ser invisible en las cuatro puertas: agente,
  terminal, lienzo y andamiador.
- Nadie vuelve a correr 21 herramientas creyendo que tiene 35.

## Fuera de alcance / Out of scope

- Migraciones de contenido (reescribir specs del usuario a un formato nuevo).
- Actualización automática sin intervención: la spec exige aviso, no autonomía.
- Volver a publicar `server.json` con transporte HTTP (pendiente aparte).
- Unificar el `ears.ts` del Builder con el del núcleo (heredado de la spec 008).
