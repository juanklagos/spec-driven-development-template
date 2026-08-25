# Investigación 041 - El builder soporta los grupos de JSON Canvas

Medido el 2026-08-25 sobre `main` en `4d60beb`, con el repositorio en 2.7.0.

## R1. Reproducción, en tres líneas

Ejecutado el ida y vuelta real del builder (`boardToFlow` → `flowToBoard`,
`builder/src/convert.ts`) sobre un nodo grupo legítimo:

```
ENTRADA     : {"id":"capa-0","type":"group","label":"Capa 0 · Fundación","x":0,"y":0,"width":800,"height":400,"background":"#eef"}
EN EL LIENZO: {"id":"capa-0","type":"note","position":{"x":0,"y":0},"data":{"text":"","width":800,"height":400}}
AL GUARDAR  : {"id":"capa-0","x":0,"y":0,"width":800,"height":400,"type":"text","text":""}
```

Dos pérdidas, no una:

1. **Al leer** el `label` se descarta, porque la rama de reserva de
   `boardToFlow` construye la nota con `text: n.text ?? ""` y un grupo no
   tiene `text` (`builder/src/convert.ts:163-168`).
2. **Al guardar** el nodo vuelve al disco como `type:"text"` con `text:""`
   (`builder/src/convert.ts:202`). El tipo, el `label` y el `background`
   desaparecen del archivo del usuario.

La segunda es la grave. El builder guarda el layout ante cualquier cambio, así
que basta mover una tarjeta para escribir la pérdida.

## R2. Por qué la tarjeta dice «IDEA» y sale vacía

`NoteNode` deduce el tipo de nota del color (`builder/src/components/NoteNode.tsx:19`).
Un grupo no trae `color`, así que `colorToHex(undefined, IDEA_COLOR)` cae en
idea y la cabecera pinta `IDEA` en mono mayúsculas; el cuerpo es `data.text`,
que es la cadena vacía. De ahí, literalmente, «nueve tarjetas IDEA (vacío)».

## R3. El modelo no conoce el grupo, y lo declara tres veces

| Archivo | Línea | Declaración |
|---|---|---|
| `packages/sdd-core/src/board.ts` | 45 | `type: "file" \| "text"` |
| `builder/src/types.ts` | 9 | `type: "file" \| "text"` |
| `packages/sdd-mcp/src/schemas.ts` | 44 | `z.enum(["file", "text"])` |

La misma verdad escrita en tres sitios que nadie obliga a coincidir. Añadir
`"group"` exige tocar los tres; olvidar uno da un fallo distinto en cada borde.

## R4. El núcleo sí deja pasar el grupo

`readBoardAt` (`packages/sdd-core/src/board.ts:314-323`) valida con `isCanvas`,
que solo comprueba que `nodes` y `edges` sean arrays, y devuelve el objeto
parseado tal cual. Por eso el archivo con grupos sobrevive intacto **hasta que
el builder guarda**: el daño no está en la lectura del servidor sino en la
conversión del cliente. Es también lo que hace el defecto silencioso — abrir el
board no rompe nada, y mover una tarjeta sí.

## R5. Asimetría entre los dos bordes de escritura

- MCP: `sdd_board_write` valida con `canvasSchema`, cuyo `z.enum(["file","text"])`
  **rechazaría** un canvas con grupos (`packages/sdd-mcp/src/server.ts:429-445`).
- REST: `PUT /api/board` hace `writeBoard(projectRoot, (await readBody(req)) as never)`
  (`packages/sdd-mcp/src/api.ts:66`), sin validar nada.

Es decir: hoy el navegador puede escribir cualquier cosa y el agente no puede
escribir un grupo. Al añadir `"group"` al enum la asimetría deja de doler para
este caso, pero sigue ahí: el `as never` del REST es un hueco propio y merece su
propia spec.

## R6. JSON Canvas no tiene campo de pertenencia

Leída la especificación 1.0 (jsoncanvas.org/spec/1.0) el 2026-08-25. El nodo de
tipo `group` admite `id`, `type`, `x`, `y`, `width`, `height` como obligatorios y
`color`, `label`, `background` y `backgroundStyle` (`cover` | `ratio` | `repeat`)
como opcionales.

**No existe ningún campo de padre, hijo o pertenencia.** La pertenencia a un
grupo es puramente geométrica: un nodo está dentro porque sus coordenadas caen
dentro del rectángulo del grupo.

Esto decide el diseño entero. React Flow expresa la contención con `parentId` y
coordenadas relativas al padre; JSON Canvas no tiene `parentId` y guarda
coordenadas absolutas. La conversión, por tanto, tiene que derivar la
pertenencia en cada carga y **no persistirla nunca**: inventar un `parentId` en
el archivo lo dejaría fuera de la especificación y Obsidian —que es de donde
salen estos boards— no lo entendería.

## R7. Qué ofrece React Flow para esto

`@xyflow/react@12.8.2` (`builder/package.json`). Soporta `parentId` con
`extent: "parent"`, que es exactamente la contención pedida: el hijo se mueve
con el padre y no puede salirse arrastrando. Dos exigencias conocidas del
runtime que la implementación tiene que respetar:

- el nodo padre debe aparecer **antes** que sus hijos en el array de nodos;
- la `position` de un hijo es relativa al padre, no absoluta.

## R8. Evidencia en un proyecto real

`El-MERDN` (`spec/specs/board.canvas`) tiene hoy nueve nodos `type:"text"` con
los títulos de capa dentro del campo `text` («Capa 0 · Fundación\n\n1 spec», …).
El commit `254cbd4` de ese repositorio ya los tiene así, de modo que **el
historial no prueba la destrucción**: para cuando se commiteó, o bien ya habían
sido reescritos a mano, o bien se autoraron así. La prueba del defecto es la
reproducción de §R1, no ese archivo.

Lo que sí muestra ese board es la forma del uso real: nueve capas usadas como
agrupación visual de 17 specs. Es exactamente el caso que esta spec tiene que
sostener.

## R9. Lo que hay que decidir, y no es obvio

- **Anidamiento.** Dos grupos que se solapan y un nodo dentro de ambos: hay que
  elegir padre. El criterio propuesto es el grupo contenedor de menor área.
- **Borrado.** Borrar un grupo podría arrastrar a sus hijos. Se propone que no:
  las tarjetas de spec ya son `deletable: false` (`builder/src/store.ts`), así
  que una cascada sería incoherente con la regla que ya existe.
- **Orden de pintado.** Un grupo es un fondo; tiene que ir detrás de las
  tarjetas y no robar el clic.
