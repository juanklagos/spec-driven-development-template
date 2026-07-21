# 🛠️ Guía intermedia (equipos y proyectos reales)

## 🌍 Par de idioma / Language pair

- Español: **14-guia-intermedia.md**
- English: [../en/14-intermediate-guide.md](../en/14-intermediate-guide.md)


## 🗣️ Prompt amigable (copiar y pegar)

```text
Usando https://github.com/juanklagos/spec-driven-development-template, crea todo lo necesario para llevar a cabo mi proyecto de principio a fin.
Mi proyecto es: [explica tu proyecto en lenguaje simple].
Guíame por nivel y no omitas especificación, plan, tareas, bitácora y validación.
```


Para quién es:
- Para equipos que ya tienen SDD funcionando y ahora necesitan que cada sesión salga igual de bien.

## Objetivo
Que una sesión de trabajo se pueda repetir tal cual, deje traza y no obligue a rehacer lo de ayer.

## Flujo estándar por sesión

1. Lee contexto (`idea`, `INDEX`, último handoff).
2. Selecciona una sola spec activa.
3. Ejecuta solo tareas dentro de alcance.
4. Actualiza `history.md`, `INDEX.md` (si aplica), `PROJECT_LOG.md`.
5. Valida y cierra con próximo paso exacto.

## Pack de prompts (Intermedio)

### Prompt A: inicio de sesión
```text
Lee idea/IDEA_GENERAL.md, specs/INDEX.md y último handoff.
Selecciona una spec activa y propón plan de sesión en 5 pasos.
Bloquea tareas fuera de alcance.
```

### Prompt B: implementación controlada
```text
Implementa solo tareas de la spec activa.
Antes de codificar, confirma spec aprobada y plan consistente.
Después, actualiza history.md y bitácora.
```

### Prompt C: cierre + handoff
```text
Genera entrada de PROJECT_LOG y handoff con:
estado actual, pendientes, bloqueos, próximo paso exacto.
Además verifica si INDEX.md necesita actualización.
```

## Controles de equipo
- Una spec activa por sesión.
- Sin cambios de alcance no documentados.
- Handoff obligatorio si quedan pendientes.

## Validación
```bash
./scripts/validate-sdd.sh . --strict
./scripts/check-sdd-gate.sh .
```

## Más prompts
- [Matriz de prompts](./19-matriz-prompts-por-objetivo.md)
- [Banco de prompts validados](./26-banco-prompts-validados.md)

## Próximo paso
- [docs/es/15-guia-avanzada.md](./15-guia-avanzada.md)
