# Spec Driven Development Template

Plantilla de trabajo para organizar proyectos con un enfoque guiado por especificaciones.

Esta plantilla sirve para equipos y personas que:

- Están empezando a programar.
- Ya tienen experiencia profesional.
- Quieren trabajar con cualquier herramienta de Inteligencia Artificial.

## Recomendación central

Esta plantilla está diseñada para trabajar junto con GitHub Spec Kit.

GitHub Spec Kit aporta el flujo operativo y esta plantilla aporta la estructura humana de proyecto (`idea`, `specs`, `bitacora`).

## Qué significa este enfoque

Trabajar guiado por especificaciones significa que, antes de escribir o modificar código, se define de forma clara:

- Qué problema se quiere resolver.
- Qué comportamiento debe tener el sistema.
- Cómo se va a validar que funciona.
- Qué se hizo en cada sesión de trabajo.

En este sistema, la documentación no es opcional. Es parte del producto.

## Objetivo de la plantilla

Convertir la organización del proyecto en un estándar reutilizable para cualquier repositorio.

## Estructura principal

```text
spec-driven-development-template/
├── idea/
├── specs/
├── bitacora/
├── docs/
├── scripts/
└── .github/
```

### Significado de cada carpeta

- `idea/`: contiene la idea general del proyecto.
- `specs/`: contiene las especificaciones numeradas del proyecto.
- `bitacora/`: contiene el historial real de trabajo del equipo.
- `docs/`: contiene guías para entender y aplicar el sistema.
- `scripts/`: contiene scripts de ayuda para inicializar el formato en otros proyectos.
- `.github/`: contiene archivos recomendados para publicar en GitHub.

## Reglas obligatorias del estándar

1. No se empieza una funcionalidad sin una especificación escrita.
2. Cada especificación debe tener carpeta propia y número consecutivo.
3. Cada sesión de trabajo debe quedar registrada en la bitácora.
4. Cada decisión importante debe dejarse por escrito.
5. Toda persona nueva debe poder entender el estado del proyecto leyendo la documentación.

## Formato obligatorio de cada especificación

Cada carpeta dentro de `specs/` debe tener:

- `spec.md`: qué se va a construir y por qué.
- `plan.md`: cómo se va a implementar.
- `tasks.md`: tareas concretas.
- `research.md`: hallazgos y contexto técnico.
- `contracts/`: contratos funcionales o técnicos cuando hagan falta.

## Guía rápida de uso

1. Completa `idea/IDEA_GENERAL.md`.
2. Crea tu primera especificación con número: `specs/001-nombre-de-la-especificacion/`.
3. Llena los archivos obligatorios de esa especificación.
4. Registra avances en `bitacora/`.
5. Repite para cada nueva necesidad del proyecto.

## Publicación en GitHub

Esta plantilla ya incluye documentos base para compartir en GitHub:

- `LICENSE`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `.github/ISSUE_TEMPLATE.md`
- `.github/PULL_REQUEST_TEMPLATE.md`

## Uso con GitHub Spec Kit

Instalación recomendada:

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

Inicializar en carpeta actual:

```bash
specify init . --ai codex
```

O uso puntual sin instalación persistente:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init . --ai codex
```

Flujo de sesión recomendado:

1. `/speckit.constitution`
2. `/speckit.specify`
3. `/speckit.plan`
4. `/speckit.tasks`
5. `/speckit.implement`

Script incluido para crear proyecto + Spec Kit:

```bash
./scripts/init-project-with-spec-kit.sh /ruta/del-proyecto codex
```

## Lectura recomendada

- `docs/00-introduccion.md`
- `docs/01-estructura.md`
- `docs/02-flujo-de-trabajo.md`
- `docs/03-como-usar-con-cualquier-inteligencia-artificial.md`
- `docs/04-glosario.md`
- `docs/05-preguntas-frecuentes.md`
- `docs/06-que-usa-esta-plantilla.md`
- `docs/07-como-publicar-en-github-paso-a-paso.md`
- `docs/08-integracion-github-spec-kit.md`
- `docs/09-release-checklist.md`
