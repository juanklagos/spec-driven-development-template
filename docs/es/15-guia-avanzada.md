# Guía avanzada (estandarización y alta consistencia)

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

4. Contrato de salida por sesión:
- objetivo
- spec activa
- cambios
- validación
- riesgos
- próximo paso exacto

## Gobernanza recomendada
- Versionado SemVer.
- Changelog por release.
- Sin merge cuando falla la compuerta SDD.

## Métricas sugeridas
- % specs con `history.md` actualizado
- % sesiones con bitácora completa
- cambios fuera de alcance por sprint
- consistencia entre agentes

## Referencias siguientes
- [Checklists de calidad](./21-checklists-calidad-por-etapa.md)
- [Decisiones de arquitectura](./24-decisiones-de-arquitectura.md)
- [Checklist de release](./09-release-checklist.md)
