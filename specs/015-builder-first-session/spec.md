# Especificación 015 - La primera sesión del builder: reconocer, consentir, navegar

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-21`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-21 — el autor respondió *«hazlo»* a los tres siguientes por valor que le propuse: título humano en las tarjetas, consentimiento desde el lienzo y paleta de comandos. Consentimiento en `.sdd/user-consent.log`.

## Contexto

Tres cosas que un usuario nota en su primera sesión, verificadas contra el código.

**1. Las tarjetas muestran el slug del directorio.** `builder-v5-pro-ux` y `builder-v4-teams` son
indistinguibles de un vistazo, y `013-gate-integrity` no dice nada sobre qué resuelve. La línea 1 de
cada `spec.md` **ya lleva el título humano** (`# Especificación 012 - Veredicto de compuerta: que un
verde signifique algo`) y el archivo ya se lee entero para extraer el estado. El dato está a mano y
se tira.

**2. Apruebas en el lienzo y la compuerta sigue cerrada, sin salida desde el lienzo.**
No existe ninguna ruta de consentimiento en la API: `grep consent` sobre `packages/sdd-mcp/src/api.ts`
y `builder/src/api.ts` no devuelve nada. `recordUserConsent` vive en el core desde siempre. Así que
apruebas una spec desde el builder, la tarjeta se pone verde, y la compuerta falla con consentimiento
ausente — reparable solo abriendo una terminal. Para el público al que apunta el builder, eso es un
callejón sin salida.

**3. No hay forma de llegar a una spec sin buscarla con el ratón.** Con 13 specs el lienzo ya obliga
a hacer zoom y barrer. No hay búsqueda, ni salto por nombre, ni atajo global más allá de deshacer.

## Historia de usuario principal

Como alguien que abre el builder con un proyecto de verdad, quiero reconocer las specs por su nombre,
llegar a cualquiera sin buscarla a ojo, y completar una aprobación de principio a fin sin salir del
lienzo.

## Escenarios de aceptación

1. Dada una spec cuyo `spec.md` empieza con un título, cuando la veo en el lienzo o en el kanban,
   entonces leo ese título y no el slug del directorio.
2. Dada una spec sin título reconocible, cuando la veo, entonces leo algo derivado de su id y nunca
   una tarjeta en blanco.
3. Dada una spec que acabo de aprobar desde el lienzo, cuando la compuerta pide consentimiento,
   entonces puedo registrarlo desde el propio lienzo.
4. Dado que registro el consentimiento, cuando se refresca la compuerta, entonces refleja el cambio
   sin que yo recargue.
5. Dado el builder abierto, cuando pulso Cmd+K (o Ctrl+K), entonces puedo saltar a cualquier spec
   escribiendo parte de su número o de su título.
6. Dada la paleta abierta, cuando pulso Escape, entonces se cierra y el foco vuelve donde estaba.

## Criterios de aceptación (formato EARS) / Acceptance criteria (EARS format)

- EL SISTEMA DEBERÁ extraer el título humano de la primera línea de `spec.md` y exponerlo en cada
  resumen de spec.
- SI la primera línea no contiene un título reconocible, ENTONCES EL SISTEMA DEBERÁ derivar una
  etiqueta legible del identificador, y NUNCA mostrar una tarjeta sin nombre.
- EL SISTEMA DEBERÁ mostrar el identificador junto al título: es la clave que el usuario usa en la
  terminal y en los commits.
- EL SISTEMA DEBERÁ ofrecer una ruta para registrar consentimiento de una spec desde el lienzo.
- CUANDO se registre consentimiento, EL SISTEMA DEBERÁ refrescar la compuerta sin recarga.
- EL SISTEMA NO DEBERÁ registrar consentimiento sin una acción explícita del usuario.
- CUANDO el usuario pulse Cmd+K o Ctrl+K, EL SISTEMA DEBERÁ abrir una paleta que filtre las specs por
  número y por título.
- CUANDO el usuario pulse Escape en la paleta, EL SISTEMA DEBERÁ cerrarla sin efecto lateral.
- EL SISTEMA DEBERÁ funcionar con teclado únicamente: abrir, filtrar, elegir con flechas, confirmar.

## Requisitos

- El título es de solo lectura en esta spec: se muestra, no se edita. Editarlo es reescribir la línea
  1 de `spec.md` y eso merece su propia decisión.
- El consentimiento por API exige un identificador de spec explícito, nunca inferido.
- Todo texto nuevo existe en español e inglés, en los dos diccionarios que se reflejan.
- La paleta no introduce dependencias nuevas: shadcn ya trae el componente de comando.

## Fuera de alcance / Out of scope

- Editar el título desde la interfaz.
- Búsqueda dentro del contenido de las specs (solo número y título).
- Aprobar desde la paleta: aprobar sigue siendo un formulario con aprobador y evidencia.

## Ámbito de archivos / File scope

- `packages/sdd-core/src/workspace.ts` — `extractSpecTitle`, `SpecSummary.title`
- `packages/sdd-core/src/index.ts` — exportación
- `packages/sdd-mcp/src/schemas.ts` — `title` en los esquemas
- `packages/sdd-mcp/src/server.ts` — `title` en `sdd_list_specs`
- `packages/sdd-mcp/src/api.ts` — `POST /api/spec/:id/consent`
- `builder/src/api.ts` — cliente del consentimiento
- `builder/src/types.ts` — `title` en `SpecSummary`
- `builder/src/components/SpecNode.tsx` — título en la tarjeta
- `builder/src/components/KanbanBoard.tsx` — título en la tarjeta
- `builder/src/components/SpecDrawer.tsx` — consentimiento tras aprobar
- `builder/src/components/CommandPalette.tsx` — la paleta
- `builder/src/App.tsx` — atajo global
- `builder/src/i18n.ts` — textos ES/EN

## Propiedades de la spec / Spec properties

- Para toda spec, la etiqueta mostrada DEBERÁ ser no vacía.
- Para todo consentimiento registrado, DEBERÁ existir una acción explícita del usuario que lo originó.

## Criterios de éxito

- Un tablero de 13 specs se lee de un vistazo sin abrir ninguna tarjeta.
- Una aprobación se completa de principio a fin sin abrir una terminal.
- Llegar a una spec concreta cuesta tres teclas, no un barrido visual.
