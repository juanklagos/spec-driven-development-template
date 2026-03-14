# Anti-patrones y errores comunes

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Volver_al_índice-2D3139?style=for-the-badge" alt="Volver al índice"></a>

---

## 🗣️ Prompt amigable (copiar y pegar)

Usa esto cuando no eres técnico y quieres que la IA haga la integración + guía completa:

```text
Usando https://github.com/juanklagos/spec-driven-development-template, crea todo lo necesario para llevar a cabo mi proyecto de principio a fin.
Mi proyecto es: [explica tu proyecto en lenguaje simple].

Si mi proyecto es nuevo, inicialízalo con este template y GitHub Spec Kit.
Si mi proyecto ya existe, adáptalo a idea/specs/bitacora sin romper el comportamiento actual.
Guíame paso a paso según mi nivel (principiante/intermedio/avanzado), con lenguaje claro.
No omitas especificación, plan, tareas, traza de refinamiento, bitácora y validación.
```


> [!CAUTION]
> Estos son los errores más frecuentes que rompen el flujo SDD. Apréndelos para evitar sesiones desperdiciadas.

## 🚫 Anti-patrones críticos

### 1. Codificar antes de especificar

| Síntoma | Impacto | Solución |
|---|---|---|
| "Déjame construirlo rápido" | Cambios sin dirección, scope creep | Escribe `spec.md` primero, aunque sean 10 líneas |
| La IA genera código sin contexto | Features alucinadas, arquitectura incorrecta | Alimenta `IDEA_GENERAL.md` + spec activa a la IA antes de pedir código |
| Saltarse `plan.md` | La implementación no coincide con los requisitos | Siempre llena `plan.md` antes de abrir tu editor |

### 2. Cambios de alcance invisibles

| Síntoma | Impacto | Solución |
|---|---|---|
| "Ah, de paso también agregué X" | Trabajo no rastreado, trazabilidad rota | Registra cada cambio de scope en `history.md` |
| Requisitos discutidos solo en chat/Slack | Decisiones perdidas, entendimiento conflictivo | Transfiere las decisiones a `bitacora/decisiones/` |
| Cambiar prioridades sin actualizar INDEX | Confusión del equipo sobre qué está activo | Actualiza `specs/INDEX.md` de inmediato |

### 3. Fallas de continuidad entre sesiones

| Síntoma | Impacto | Solución |
|---|---|---|
| Sin handoff al final de la sesión | La siguiente sesión arranca de cero | Crea entrada en `bitacora/handoffs/` cada vez |
| "Ya me voy a acordar de lo que estaba haciendo" | Pérdida de contexto después de 24+ horas | Escríbelo — tu yo del futuro es un extraño |
| Múltiples specs en progreso sin seguimiento | Caos de prioridades, implementaciones parciales | Mantén `specs/INDEX.md` como fuente única de verdad |

### 4. Confusión de contexto template/producto

| Síntoma | Impacto | Solución |
|---|---|---|
| La IA modifica archivos del template para un proyecto usuario | Template corrompido | Clarifica modo: `template maintenance` vs `project execution` |
| Crear specs para el template durante trabajo de proyecto | Contextos mezclados | Repos separados o declarar modo mantenimiento explícitamente |

## ⚠️ Señales de que la disciplina SDD se está rompiendo

- `tasks.md` no se ha actualizado en 3+ sesiones
- `specs/INDEX.md` no refleja la realidad
- `bitacora/` no tiene entradas en la última semana
- `history.md` no muestra cambios pero el código sí ha evolucionado
- `validate-sdd.sh` no se ha ejecutado desde el inicio del proyecto

## 📏 La única regla que recordar

> **Si no está documentado, no está alineado. Si no está alineado, se va a romper.**

## 💡 Protocolo de recuperación

Si te descubres (o a tu equipo) rompiendo la disciplina SDD:

1. **Para de codificar** inmediatamente
2. Ejecuta `./scripts/validate-sdd.sh . --strict` para ver qué falta
3. Llena los vacíos: actualiza la spec activa, documenta decisiones, crea handoff
4. Solo entonces retoma la implementación

Esto toma 15 minutos y ahorra horas de retrabajo.
