# 🧪 TDD y BDD: cómo escribir buenas especificaciones

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Volver_al_índice-2D3139?style=for-the-badge" alt="Volver al índice"></a>

---

> [!TIP]
> Para inicio rápido y prompts, usa:
> - [`AI_START_HERE.md`](../../AI_START_HERE.md)
> - [Matriz de prompts](./19-matriz-prompts-por-objetivo.md)
> - [Banco de prompts validados](./26-banco-prompts-validados.md)



Este apartado es un plus del repositorio para conectar desarrollo guiado por especificaciones con prácticas de calidad.

## 1) Diferencia simple entre TDD y BDD

| Enfoque | Significado | Pregunta principal | Resultado esperado |
|---|---|---|---|
| TDD | Desarrollo guiado por pruebas | ¿Cómo validamos el comportamiento técnico? | Pruebas que guían implementación |
| BDD | Desarrollo guiado por comportamiento | ¿Cómo se comporta el sistema para la persona usuaria? | Escenarios de negocio claros |

## 2) Relación con esta plantilla

- `spec.md` define el comportamiento esperado (muy alineado con BDD).
- `tasks.md` puede incluir tareas de pruebas técnicas (alineado con TDD).
- `contracts/` ayuda a definir reglas verificables para ambos enfoques.

## 3) Cómo escribir una spec sólida para TDD

### Estructura recomendada

1. En `spec.md`, define reglas precisas y medibles.
2. En `plan.md`, define estrategia de prueba técnica.
3. En `tasks.md`, agrega tareas explícitas de pruebas antes de implementación.

### Checklist TDD

- [ ] Cada requisito tiene una validación técnica asociada.
- [ ] Las tareas de prueba existen y son ejecutables.
- [ ] Hay criterio de fallo claro antes de implementar.
- [ ] Se registran resultados de pruebas en bitácora.

## 4) Cómo escribir una spec sólida para BDD

### Estructura recomendada

1. En `spec.md`, usa escenarios en formato:
   - Dado
   - Cuando
   - Entonces
2. Describe comportamiento observable, no detalles internos de código.
3. Prioriza lenguaje entendible para negocio y personas técnicas.

### Checklist BDD

- [ ] Escenarios claros y verificables.
- [ ] Lenguaje sin ambigüedad.
- [ ] Cada escenario conecta con un requisito.
- [ ] Se puede demostrar el comportamiento en una revisión funcional.

## 5) Plantilla rápida de escenarios

```text
Dado [contexto inicial]
Cuando [acción o evento]
Entonces [resultado esperado]
```

## 6) Estrategia combinada recomendada (TDD + BDD)

1. Define comportamiento en `spec.md` (BDD).
2. Traduce a tareas técnicas en `tasks.md` (TDD).
3. Implementa por iteraciones cortas.
4. Registra hallazgos y ajustes en `history.md` y `bitacora/`.

## 7) Errores comunes

- Escribir specs vagas sin criterios verificables.
- Mezclar alcance de negocio con detalles técnicos en la misma sección.
- No actualizar `history.md` cuando cambian escenarios.
- Implementar sin revisar primero si la spec sigue vigente.
