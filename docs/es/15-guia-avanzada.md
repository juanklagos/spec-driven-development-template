# 🧭 Guía avanzada (estandarización y alta consistencia)

## 🌍 Par de idioma / Language pair

- Español: **15-guia-avanzada.md**
- English: [../en/15-advanced-guide.md](../en/15-advanced-guide.md)


## 🗣️ Prompt amigable (copiar y pegar)

```text
Usando https://github.com/juanklagos/spec-driven-development-template, crea todo lo necesario para llevar a cabo mi proyecto de principio a fin.
Mi proyecto es: [explica tu proyecto en lenguaje simple].
Guíame por nivel y no omitas especificación, plan, tareas, bitácora y validación.
```


Para quién es:
- Equipos que estandarizan SDD entre múltiples herramientas y modelos de IA.

## Objetivo
Entregar resultados equivalentes sin depender del agente/modelo usado.

## Modelo operativo avanzado

1. Instrucciones canónicas de IA:
- `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md`

2. Flujo Spec Kit-first:
- `/speckit.constitution`
- `/speckit.specify`
- `/speckit.plan`
- `/speckit.tasks`
- `/speckit.implement`

3. Compuertas obligatorias:
- `spec.md` aprobada
- `plan.md` consistente
- validaciones en verde

## Pack de prompts (Avanzado)

### Prompt A: modo estándar multiagente
```text
Opera con gobernanza SDD estricta y flujo Spec Kit-first.
Aplica compuerta: no código sin spec aprobada y plan consistente.
Trabaja con una sola spec activa.
```

### Prompt B: protocolo de refinamiento
```text
Detecta cambios de alcance/prioridad/requisitos.
Si existen, detén implementación y actualiza:
- spec activa
- history.md
- specs/INDEX.md (si cambia estado/prioridad)
- bitácora
Luego continúa.
```

### Prompt C: cierre de gobernanza
```text
Cierra sesión con:
objetivo, spec activa, cambios, validaciones, riesgos, próximo paso exacto.
Incluye impacto en release/gobernanza si aplica.
```

## Gobernanza recomendada
- Disciplina de versionado SemVer.
- Changelog actualizado por release.
- Sin merge cuando falla la compuerta SDD.

## Métricas sugeridas
- % specs con `history.md` actualizado
- % sesiones con bitácora completa
- cambios fuera de alcance por sprint
- consistencia entre agentes

## Validación
```bash
./scripts/validate-sdd.sh . --strict
./scripts/check-sdd-gate.sh .
```

## Más prompts
- [Matriz de prompts](./19-matriz-prompts-por-objetivo.md)
- [Banco de prompts validados](./26-banco-prompts-validados.md)
- [Prompts por característica](./30-guia-prompts-por-caracteristica.md)

## Referencias siguientes
- [Checklists de calidad](./21-checklists-calidad-por-etapa.md)
- [Decisiones de arquitectura](./24-decisiones-de-arquitectura.md)
- [Checklist de release](./09-release-checklist.md)

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
