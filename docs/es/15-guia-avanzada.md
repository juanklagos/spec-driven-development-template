# 🧭 Guía avanzada (equipos exigentes y resultados unificados)

> Objetivo: lograr consistencia alta entre diferentes herramientas de Inteligencia Artificial.

## 🧱 Estrategia avanzada

1. Usa contrato de salida unificado.
2. Fuerza validaciones explícitas por sesión.
3. Exige refinamiento antes de cambios de alcance.
4. Controla calidad con TDD y BDD.

## 🗣️ Prompt maestro avanzado

```text
Sigue el estándar del repositorio.

Lectura obligatoria:
1) idea/IDEA_GENERAL.md
2) specs/INDEX.md
3) último handoff
4) docs/es/10-agentes-ia-soportados-y-prompts.md
5) docs/es/11-refinamiento-continuo.md

Reglas:
- No implementar sin spec activa.
- Si detectas cambio de alcance, actualiza history.md y bitácora antes de implementar.
- Entrega salida con este formato:
  1) Objetivo
  2) Cambios
  3) Validaciones
  4) Riesgos
  5) Próximo paso
```

## 📈 Métricas sugeridas

| Métrica | Objetivo |
|---|---|
| Especificaciones con `history.md` al día | 100% |
| Sesiones con bitácora completa | 100% |
| Cambios fuera de alcance | 0 |
| Pendientes sin handoff | 0 |

## 🔒 Criterio de calidad

Si no hay trazabilidad, el trabajo no está terminado.
