# Estructura detallada

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


## Carpeta idea

Ruta: `idea/`

Archivo principal:

- `IDEA_GENERAL.md`: define el problema, objetivo, alcance, usuarios, riesgos y criterio de terminado.

## Carpeta specs

Ruta: `specs/`

Archivos principales:

- `INDEX.md`: lista de todas las especificaciones.
- `README.md`: reglas del formato.
- `_template/`: plantilla para nuevas especificaciones.

Cada especificación vive en una carpeta enumerada:

- `001-nombre`
- `002-nombre`
- `003-nombre`

## Carpeta bitacora

Ruta: `bitacora/`

Subcarpetas:

- `global/`: historial general del proyecto.
- `diaria/`: trabajo por fecha.
- `handoffs/`: contexto para retomar trabajo.
- `decisiones/`: decisiones importantes.
- `templates/`: plantillas para registrar información.

## Carpeta docs

Ruta: `docs/`

Contiene la documentación pedagógica del sistema.

## Carpeta scripts

Ruta: `scripts/`

Contiene scripts para instalar esta estructura en otro repositorio.
