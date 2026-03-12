# Matriz de prompts por objetivo

⬅️ [Volver al índice](../README.md)

---

> Usa esta matriz para pedirle a cualquier IA resultados consistentes.

## Tabla principal

| Objetivo | Prompt base | Entregable esperado |
|---|---|---|
| Descubrir sistema legado | "Analiza este proyecto existente, documenta comportamiento actual y crea `idea/IDEA_GENERAL.md` + `specs/001-...` sin cambiar código" | Idea + spec base de ingeniería inversa |
| Crear spec nueva | "Trabaja sobre `specs/INDEX.md`, define la siguiente spec numerada y completa `spec.md`, `plan.md`, `tasks.md`, `research.md`, `history.md`" | Nueva spec completa |
| Refinar spec existente | "Refina la spec activa por cambios de alcance, actualiza `history.md` y registra impacto en bitácora" | Spec actualizada + traza |
| Preparar implementación | "Desde la spec activa, lista riesgos, plan de pruebas y tareas priorizadas antes de tocar código" | Plan técnico claro |
| Cerrar sesión | "Genera handoff con estado, pendientes y siguiente paso en `bitacora/handoffs/`" | Handoff listo |

## Prompt universal recomendado

```text
Usa https://github.com/juanklagos/spec-driven-development-template como guía principal.
Trabaja con la estructura idea/specs/bitacora.
Antes de implementar, valida spec activa y trazabilidad.
Al finalizar, deja bitácora y handoff.
```

## Reglas de consistencia

- Un cambio grande = una spec activa.
- No hay implementación sin `tasks.md`.
- Si cambia la idea, actualiza `history.md` y bitácora.
