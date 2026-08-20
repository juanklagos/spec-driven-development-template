# Plan 039 - Ampliar con IA ve la spec, no solo el campo

## Resumen

El contexto ya está cargado en el cajón; el trabajo es bajarlo un nivel, darle
un campo propio en la petición, ponerle tope y contárselo al agente. No hay
lectura nueva de disco en el camino del builder.

## Contexto técnico

- `SpecDetail.docs` trae `spec`, `plan` y `tasks` en crudo desde
  `GET /api/spec/:id`, ya en memoria cuando el botón se monta.
- `AiRequest` se persiste como JSON en `<sddRoot>/.sdd/requests/`. Un campo
  nuevo opcional es compatible hacia atrás: las peticiones viejas no lo traen y
  el agente las atiende igual.
- El esquema zod del MCP (`server.ts:1099`) valida lo que ve el agente; si el
  campo no se declara ahí, el agente no lo recibe aunque esté en el archivo.
- La única fuente del texto de la skill es `SERVE_QUEUE_INSTRUCTIONS`; los
  `SKILL.md` versionados son copias generadas.

## Restricciones

- El contexto no se mezcla con la instrucción (decisión 1 de la spec).
- La sección en edición no se duplica (decisión 2).
- Los dos caminos llevan lo mismo (decisión 3).
- No se añade ninguna lectura de disco al crear la petición: lo que no esté ya
  en memoria, lo lee el agente por MCP.

## Fases de implementación

1. **Núcleo**: campo `context` en tipos, persistencia y esquema zod.
2. **Composición**: función pura que arma el contexto desde `SpecDetail.docs`,
   excluye la sección en edición y aplica el presupuesto. Con pruebas.
3. **Cableado**: `AiAssistButton` lo acepta y lo envía; `SectionEditor` y
   `SpecDrawer` lo pasan; `NoteNode` y `BitacoraModal` no.
4. **Camino copiable**: `buildFieldPrompt` incluye el mismo bloque.
5. **Skill**: instrucciones nuevas y prueba de no divergencia de las copias.
6. **Verificación**: pruebas, compuerta y una pasada real en el lienzo.

## Dependencias

- Ninguna externa. Se apoya en la cola de la spec 031 y en el principio de
  «una sola fuente para los dos caminos» de la 036.

## Hitos

- H1: la petición viaja con contexto y el agente lo recibe (fases 1-3).
- H2: las dos puertas llevan lo mismo (fase 4).
- H3: la skill lo usa y las copias no pueden divergir (fase 5).

## Riesgos

- **Que el modelo trate el contexto como orden** y reescriba la spec entera en
  vez del campo. Mitigación: campo separado, y la instrucción de la skill lo
  declara de solo lectura.
- **Que el prompt copiable se vuelva impegable.** Mitigación: es lo que
  justifica el presupuesto; el tope se fija pensando en ese camino, no en el
  del agente, que aguantaría mucho más.
- **Que las copias de la skill queden atrás.** Mitigación: es R6, y es
  precisamente el defecto que esta spec encontró sin buscarlo.
- **Peticiones antiguas sin el campo.** Mitigación: opcional en todos los
  niveles; una petición sin `context` se atiende como hoy.
