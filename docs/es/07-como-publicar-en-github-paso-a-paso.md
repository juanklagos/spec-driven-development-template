# Cómo publicar en GitHub paso a paso

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


## Requisitos previos

- Tener cuenta en GitHub.
- Tener Git instalado en tu computadora.

## Paso 1: Crear repositorio en GitHub

1. Entra a GitHub.
2. Crea un nuevo repositorio.
3. Copia la dirección del repositorio.

## Paso 2: Inicializar el repositorio local

Desde la carpeta `spec-driven-development-template` ejecuta:

```bash
git init
git add .
git commit -m "Initial template release"
```

## Paso 3: Conectar con GitHub

```bash
git branch -M main
git remote add origin <URL_DEL_REPOSITORIO>
git push -u origin main
```

## Paso 4: Revisar archivos visibles

Confirma en GitHub que se ven:

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- carpeta `docs/`

## Paso 5: Publicar versión inicial

Puedes crear una versión etiquetada para marcar la salida inicial.

Ejemplo:

```bash
git tag v1.0.0
git push origin v1.0.0
```

## Recomendación

En la descripción del repositorio explica en una frase para quién es la plantilla y qué problema resuelve.
