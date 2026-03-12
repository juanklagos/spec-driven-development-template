# 🧪 TDD y BDD: cómo escribir buenas especificaciones

> ✅ **Inicio recomendado (baja fricción):** no necesitas clonar este repositorio si ya estás trabajando en un proyecto.
>
> **Regla obligatoria:** indica a la IA que debe trabajar usando este template y sus guías como referencia principal.
>
> Opciones:
> - Si ya tienes este repositorio en local, úsalo directamente.
> - Si trabajas en otro proyecto, pide a la IA adaptar ese proyecto usando esta guía.
> - Si no tienes este repositorio, puedes clonarlo como opción:
>
> ```bash
> git clone https://github.com/juanklagos/spec-driven-development-template.git
> cd spec-driven-development-template
> ```

## ⭐ Uso explícito del repositorio base

Usa siempre este repositorio como referencia principal:

- `https://github.com/juanklagos/spec-driven-development-template`

### 🆕 Caso 1: crear un proyecto nuevo desde esta base

Prompt sugerido para la IA:

```text
Usando https://github.com/juanklagos/spec-driven-development-template crea un proyecto nuevo para [OBJETIVO].
Si no tengo este repositorio disponible en local, indícame cómo obtenerlo; luego inicializa la estructura y guíame paso a paso para definir idea, primera spec y bitácora.
No saltes pasos.
```

### ♻️ Caso 2: adaptar un proyecto existente usando esta base

Prompt sugerido para la IA:

```text
Usando https://github.com/juanklagos/spec-driven-development-template y su guía, adapta este proyecto existente: [RUTA_DEL_PROYECTO].
Mantén el código actual, integra la estructura idea/specs/bitacora, crea la primera spec basada en lo que ya existe y deja trazabilidad completa.
```

### ✅ Resultado mínimo esperado

- Proyecto creado o adaptado con estructura estándar.
- Primera especificación creada.
- Bitácora inicial registrada.
- Próximo paso claro para continuar.


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
