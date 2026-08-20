# Investigación 039 - Qué contexto llega hoy, y cuál está a mano

## Lo que se leyó en el código (2026-08-20)

### Lo que viaja hoy

`AiRequest` (`packages/sdd-core/src/requests.ts:44`) lleva `target`,
`currentText` e `instruction`. El comentario del campo es explícito sobre su
intención: `currentText` está ahí «so the agent needs no second lookup» — un
atajo para el caso común, no un techo.

### Lo que está a mano y no se usa

`SpecDrawer` llama a `api.getSpec(specId)` (`SpecDrawer.tsx:702`) y recibe
`SpecDetail`:

    interface SpecDetail {
      id: string;
      docs: { spec: string; plan: string; tasks: string };
      tasks: TaskItem[];
    }

Es decir: cuando la persona pulsa «Ampliar con IA» sobre una sección, el
navegador ya tiene `spec.md`, `plan.md` y `tasks.md` completos. El
`AiAssistButton` recibe cuatro props —`kind`, `specId`, `refId`,
`currentText`— y ninguna es ese contenido.

El hueco no es de arquitectura: es un prop que nadie bajó.

### Presupuesto: por qué hace falta

Medido sobre cinco specs del propio repositorio:

| Spec | `spec.md` | `plan.md` |
|---|---|---|
| 036 | 10.5 KB | 5.8 KB |
| 021 | 7.1 KB | 4.4 KB |
| 013 | 7.3 KB | 3.3 KB |
| 037 | 6.4 KB | 2.5 KB |
| 038 | 4.9 KB | 2.3 KB |

Para un agente por MCP, 16 KB no es nada. El límite lo pone el otro camino: el
prompt copiable lo pega una persona a mano. El tope se fija pensando en ese, no
en el del agente.

### Dónde se monta el botón

Cinco sitios: `SectionEditor` (dos), `SpecDrawer`, `NoteNode` y
`BitacoraModal`. Solo los tres primeros tienen una spec detrás. Las notas del
lienzo y las entradas de bitácora no pertenecen a ninguna, y por eso no envían
contexto: no hay nada que enviar.

### La skill autoriza, pero no pide

`SERVE_QUEUE_INSTRUCTIONS` (`packages/sdd-core/src/connect.ts:36`) incluye:

> No inventes contexto que no esté en la petición ni en el workspace.

Permite leer el workspace. No dice que lo haga. Un agente que siga la skill al
pie de la letra redactará con lo que le llegó y no abrirá la spec, aunque tenga
las tools para hacerlo. De ahí que ampliar el payload y ampliar la instrucción
sean dos arreglos distintos y complementarios, no uno redundante.

### Un defecto encontrado de paso

`.claude/skills/sdd-serve/SKILL.md` y `.agents/skills/sdd-serve/SKILL.md` están
versionadas y se generan desde `connect.ts`. `connect.test.ts:223` comprueba
que las constantes contengan los nombres de las tools, pero nada compara los
archivos con su fuente: pueden quedarse atrás sin que nada avise. Entra como R6
porque esta misma spec va a modificar esa fuente.
