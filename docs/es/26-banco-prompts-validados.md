# Banco de prompts validados

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Volver_al_índice-2D3139?style=for-the-badge" alt="Volver al índice"></a>

---

## 🌍 Par de idioma / Language pair

- Español: **26-banco-prompts-validados.md**
- English: [../en/26-validated-prompt-bank.md](../en/26-validated-prompt-bank.md)


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


> Prompts probados que producen resultados consistentes y de alta calidad en ChatGPT, Claude, Gemini, Copilot y Cursor.

## 🎯 Cómo usar este banco

1. Elige el prompt que coincida con tu objetivo
2. Reemplaza los `[CORCHETES]` con tu contenido específico
3. Pega en tu herramienta de IA preferida
4. Siempre incluye esta línea de contexto primero:

```text
Usa https://github.com/juanklagos/spec-driven-development-template como guía principal.
Trabaja con la estructura idea/specs/bitacora. Antes de implementar, valida la spec activa.
```

---

## Prompt 1: Convertir idea a especificación

**Cuándo usar:** Tienes una idea general y necesitas formalizarla en estructura SDD.

```text
Tengo esta idea: [DESCRIBE TU IDEA EN 2-3 ORACIONES].

Usando el template SDD como referencia:
1. Ayúdame a llenar idea/IDEA_GENERAL.md con: nombre, problema, objetivo, alcance MVP, fuera de alcance, usuarios objetivo.
2. Luego crea la primera spec (spec.md) con: descripción, requisitos, criterios de aceptación, fuera de alcance.
3. Crea un plan.md con el enfoque técnico.
4. Descompón en tasks.md con 8-12 checkboxes.
5. Inicializa history.md con la entrada de creación.

No saltes ningún paso. Muéstrame el contenido completo para cada archivo.
```

## Prompt 2: Dividir idea compleja en specs

**Cuándo usar:** Tu idea es demasiado grande para una sola spec y necesita descomposición.

```text
Analiza esta idea: [DESCRIBE TU IDEA COMPLEJA].

1. Identifica dominios funcionales o features independientes.
2. Para cada dominio, propón una spec numerada (001, 002, 003...).
3. Define el orden de dependencia entre specs.
4. Para cada spec, proporciona: título, descripción de un párrafo, y criterios de aceptación.
5. Sugiere cuál spec implementar primero y por qué.
6. No implementes código hasta que todas las ambigüedades estén resueltas.
```

## Prompt 3: Revisar consistencia de spec

**Cuándo usar:** Antes de empezar a implementar, verifica que todo esté alineado.

```text
Revisa los siguientes artefactos SDD para consistencia:
- IDEA_GENERAL.md: [pega o referencia]
- spec.md: [pega o referencia]
- plan.md: [pega o referencia]
- tasks.md: [pega o referencia]

Verifica:
1. Requisitos en spec.md que no estén cubiertos por tasks en tasks.md
2. Tasks que no mapean a ningún requisito
3. Enfoque de plan.md que conflictúe con requisitos de spec.md
4. Criterios de aceptación faltantes
5. Ítems de scope que deberían marcarse "fuera de alcance"

Entrega una lista numerada de brechas con correcciones específicas para cada una.
```

## Prompt 4: Generar cierre de sesión (handoff + bitácora)

**Cuándo usar:** Al final de cada sesión de trabajo.

```text
Estoy cerrando mi sesión de trabajo. Ayúdame a generar:

1. Una entrada de PROJECT_LOG.md con: objetivo, trabajo completado, archivos modificados, decisiones tomadas, bloqueos, próximo paso, responsable.
2. Una entrada de handoff para bitacora/handoffs/ con: estado actual, ítems pendientes, bloqueos, quién debería continuar.
3. Verifica si specs/INDEX.md necesita actualización de status.
4. Verifica si history.md necesita una nueva entrada por cambios de alcance.

Contexto de esta sesión:
- Spec activa: [NÚMERO Y NOMBRE DE LA SPEC]
- En qué trabajé: [DESCRIPCIÓN BREVE]
- Qué queda pendiente: [QUÉ FALTA]
```

## Prompt 5: Adaptar proyecto existente a SDD

**Cuándo usar:** Para integrar estructura SDD a un codebase que ya existe.

```text
Analiza este proyecto existente en [RUTA_DEL_PROYECTO].
NO modifiques ningún código ni comportamiento existente.

1. Estudia el codebase e identifica: features principales, patrones de arquitectura, dependencias.
2. Crea idea/IDEA_GENERAL.md basado en el propósito actual del sistema.
3. Crea una spec baseline (specs/001-baseline/) que documente el comportamiento actual tal cual.
4. Sugiere división de specs por dominio si el sistema tiene múltiples features independientes.
5. Crea una entrada inicial en bitácora documentando esta sesión de descubrimiento.
6. Recomienda la siguiente spec a crear para evolución.
```

## Prompt 6: Retomar trabajo de sesión anterior

**Cuándo usar:** Al iniciar una nueva sesión después de una pausa.

```text
Estoy retomando trabajo en mi proyecto SDD. Lee en este orden:
1. idea/IDEA_GENERAL.md — visión del proyecto
2. specs/INDEX.md — specs activas
3. El archivo más reciente en bitacora/handoffs/ — dónde lo dejé
4. El tasks.md de la spec activa — progreso actual

Luego dime:
- ¿Cuál es el estado actual del proyecto?
- ¿En qué debería trabajar siguiente según el handoff?
- ¿Hay algún problema de consistencia que debería corregir primero?
```

---

## 📏 Reglas de calidad de output

Cada respuesta de IA durante trabajo SDD debería incluir:

1. **Objetivo de sesión** — ¿qué estamos haciendo?
2. **Especificación activa** — ¿en qué spec estamos trabajando?
3. **Plan inmediato** — próximas 2-3 acciones concretas
4. **Cambios realizados** — qué se modificó
5. **Validación** — ¿ejecutamos `validate-sdd.sh`?
6. **Próximo paso exacto** — una acción clara para la siguiente sesión

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
