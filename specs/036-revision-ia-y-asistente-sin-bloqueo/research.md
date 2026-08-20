# Investigación 036 - Revisión por IA y asistente sin bloqueo

## Lo que se leyó en el código (2026-08-19)

Nada aquí es recuerdo ni suposición; cada línea se abrió.

| Afirmación | Dónde | Resultado |
| :--- | :--- | :--- |
| El asistente se deshabilita con specs | `builder/src/components/AssistantWizard.tsx` | **cierto**: `disabled={busy \|\| hasSpecs \|\| keptCount === 0}` y aviso `assistant.hasSpecs` |
| La guardia real está más abajo | `builder/src/store.ts:492` | **cierto**: `applyBoardPlan` lanza `error.templatesNonEmpty` si `board.specs.length > 0` |
| La ruta «Estructurar con IA» sí funciona con specs | mismo fichero, `createStructured` | **cierto**: no consulta `hasSpecs` |
| La cola tiene dos tipos de petición | `builder/src/requests.ts` | **cierto**: `draft-field`, `structure-idea` |
| Reclamar/responder es solo MCP | `packages/sdd-mcp/src/server.ts:1121`, `:1145` | **cierto**: no hay ruta HTTP equivalente |
| El catálogo de clientes es cerrado | `packages/sdd-core/src/connect.ts:144` | **cierto**: 7 entradas |
| La IA ya llega a todas las superficies de contenido | `builder/src/ai-surfaces.test.ts` | **cierto**: 7 secciones + tareas + notas + bitácora; aprobación y consentimiento excluidos por contrato |
| El prompt copiable existe | `builder/src/prompts.ts`, `PromptBox.tsx` | **cierto**; no hay camino de vuelta |

## Por qué el `PUT` de lienzo es el nudo

`applyBoardPlan` construye un lienzo **entero** y lo manda con
`api.putBoard(canvas)`. El `PUT` reemplaza, no fusiona. De ahí la guardia: sin
ella, aplicar una propuesta sobre un proyecto poblado habría borrado el lienzo
anterior. La guardia no era paranoia; era el parche barato al reemplazo.

Por eso la fase 1 del plan no consiste en «quitar el `if`», sino en fusionar
antes del `PUT`. Quitar el `if` a secas convierte un callejón sin salida en
una pérdida de datos.

## Por qué se descartan las claves de API

Tres costes que las otras dos opciones no tienen:

1. **Un secreto en disco.** Habría que decidir dónde vive, que no entre en
   git y qué pasa al compartir el workspace. Una clave filtrada es daño real.
2. **Salida de red desde el servidor local.** `packages/sdd-mcp/src/security.ts`
   está escrito para un servidor que solo toca ficheros. Añadir egress cambia
   el modelo de amenaza del producto entero, no de esta función.
3. **Adaptadores por proveedor**: nombres de modelo, límites, errores, coste.
   Trabajo permanente a cambio de algo que ya se resuelve pegando texto.

Y el argumento a favor —«sin terminal»— lo cubre el camino de pegado, que
además funciona con IAs que no tienen API.

## Lo que el camino de pegado sí exige

Un analizador tolerante. `parseStructuredDraft` ya demostró la forma: quitar
vallas de código, `JSON.parse`, validar campo a campo y devolver `null` en vez
de lanzar. La revisión añade una validación más: el ancla de cada hallazgo
tiene que ser una de las 7 secciones de la plantilla, o el hallazgo se cae.
Sin eso, una IA puede inventar secciones y el panel pintaría hallazgos que no
llevan a ninguna parte.
