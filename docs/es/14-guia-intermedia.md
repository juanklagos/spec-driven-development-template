# Guía intermedia (equipos y proyectos reales)

Para quién es:
- Para equipos que ya usan SDD básico y necesitan ejecución consistente.

## Objetivo
Ejecutar sesiones repetibles con trazabilidad y bajo retrabajo.

## Flujo estándar por sesión

1. Lee contexto:
- `idea/IDEA_GENERAL.md`
- `specs/INDEX.md`
- último handoff en `bitacora/handoffs/`

2. Selecciona una sola spec activa.
3. Ejecuta solo tareas dentro de alcance (`tasks.md`).
4. Actualiza trazabilidad:
- `history.md`
- `specs/INDEX.md` (si cambia estado/prioridad)
- `bitacora/global/PROJECT_LOG.md`

5. Valida:

```bash
./scripts/validate-sdd.sh . --strict
./scripts/check-sdd-gate.sh .
```

## Controles de equipo
- Una spec activa por sesión.
- Sin cambios de alcance sin registro.
- Handoff obligatorio si quedan pendientes.

## Prompt recomendado
Usa y adapta:
- [Matriz de prompts](./19-matriz-prompts-por-objetivo.md)

## Próximo paso
Pasa a gobernanza avanzada:
- [docs/es/15-guia-avanzada.md](./15-guia-avanzada.md)
