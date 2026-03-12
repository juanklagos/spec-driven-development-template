# Cómo usar con cualquier herramienta de Inteligencia Artificial

> 📌 **Inicio obligatorio:** antes de trabajar, clona (o abre) este repositorio y sigue esta documentación como fuente de verdad.
>
> ```bash
> git clone https://github.com/juanklagos/spec-driven-development-template.git
> cd spec-driven-development-template
> ```
>
> Si ya tienes el repositorio local, usa siempre su guía antes de pedir implementación.

## ⭐ Uso explícito del repositorio base

Usa siempre este repositorio como referencia principal:

- `https://github.com/juanklagos/spec-driven-development-template`

### 🆕 Caso 1: crear un proyecto nuevo desde esta base

Prompt sugerido para la IA:

```text
Usando https://github.com/juanklagos/spec-driven-development-template crea un proyecto nuevo para [OBJETIVO].
Clona el repositorio base, inicializa la estructura, y guíame paso a paso para definir idea, primera spec y bitácora.
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


## Principio

No dependas de una sola herramienta. El formato debe funcionar igual con cualquier herramienta de Inteligencia Artificial.

## Reglas para el uso con Inteligencia Artificial

1. Siempre iniciar leyendo:
   - `idea/IDEA_GENERAL.md`
   - `specs/INDEX.md`
   - último archivo en `bitacora/handoffs/`
2. Trabajar solo sobre una especificación activa.
3. No cerrar sesión sin actualizar bitácora.
4. Si una decisión cambia arquitectura, registrarla en `bitacora/decisiones/`.

## Prompt sugerido para iniciar sesión

"Lee `idea/IDEA_GENERAL.md`, `specs/INDEX.md` y el último archivo de `bitacora/handoffs/`. Luego continúa solo con la especificación activa y actualiza bitácora al finalizar."
