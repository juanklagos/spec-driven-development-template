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
- Para equipos que ya usan SDD básico y necesitan ejecución consistente.

## Objetivo
Ejecutar sesiones repetibles con trazabilidad y bajo retrabajo.

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

## 💡 Tips rápidos

- Empieza con una descripción corta del proyecto en lenguaje simple.
- Pide a la IA confirmar la spec activa antes de programar.
- Cierra cada sesión con validación y próximo paso claro.

## 📊 Flujo visual

```mermaid
flowchart LR
  A["Idea del proyecto"] --> B["Spec aprobada"]
  B --> C["Plan alineado"]
  C --> D["Tareas priorizadas"]
  D --> E["Implementación"]
  E --> F["Validación + Bitácora"]
```
