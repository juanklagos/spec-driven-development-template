# 🚀 Guía rápida para no programadores (5 minutos)

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


> Objetivo: que puedas usar esta plantilla sin saber programar.

## 🧠 Idea clave

No necesitas escribir código para empezar.
Primero defines la idea y pides a la Inteligencia Artificial que te ayude paso a paso.

## ✅ Qué hacer primero

1. Abre `idea/IDEA_GENERAL.md`
2. Escribe tu idea con frases simples
3. Crea `specs/001-mi-primera-spec/`
4. Copia las plantillas desde `specs/_template/`
5. Pide a la Inteligencia Artificial completar contigo cada sección

## 🗣️ Prompt listo (inicio)

```text
Actúa como guía para principiantes.
Ayúdame a completar idea/IDEA_GENERAL.md con lenguaje simple.
No asumas información.
Hazme preguntas cortas, una por una.
Al final, resume la idea en formato claro para continuar con specs.
```

## 🗣️ Prompt listo (crear primera spec)

```text
Con base en idea/IDEA_GENERAL.md, crea una especificación inicial en specs/001-mi-primera-spec/ con:
- spec.md
- plan.md
- tasks.md
- research.md
- history.md
Usa lenguaje fácil de entender y evita siglas sin explicar.
```

## 🧪 Verificación rápida

| Pregunta | Si la respuesta es Sí, vas bien ✅ |
|---|---|
| ¿Entiendes qué se va a construir? | Sí |
| ¿Existe una lista de tareas concreta? | Sí |
| ¿Puedes explicar la idea a otra persona? | Sí |

## 📌 Regla de oro

Si cambia la idea, primero actualiza documentación y después implementación.
