# Change history / Historial de cambios

| Date / Fecha | Change type / Tipo de cambio | Summary / Resumen | Files impacted / Archivos impactados | Owner / Responsable |
|---|---|---|---|---|
| 2026-08-20 | Scope / Alcance | Borrador y aprobación: adjuntar el contexto de la spec a las peticiones de «Ampliar con IA» por los dos caminos, e instruir a la skill a leer el workspace. Alcance A+D; el brief de proyecto y las decisiones (B y C) quedan fuera | `spec.md`, `plan.md`, `tasks.md`, `research.md` | Juan Carlos Alvarez Lagos / Claude |
| 2026-08-20 | Implementation / Implementación | Implementada y verificada en el lienzo. Un hallazgo propio durante la verificación: el contexto arrastraba el bloque de aprobación —ruido para redactar, y la única superficie que la spec 031 dejó sin IA por ser la firma humana—, así que se excluye siempre | `builder/src/speccontext.ts`, `prompts.ts`, `AiAssistButton.tsx`, `SectionEditor.tsx`, `SpecDrawer.tsx`, `sections.ts`, `packages/sdd-core/src/requests.ts`, `connect.ts`, `packages/sdd-mcp/src/server.ts` | Juan Carlos Alvarez Lagos / Claude |
