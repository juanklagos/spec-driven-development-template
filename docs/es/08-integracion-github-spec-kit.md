# Integración con GitHub Spec Kit

Esta plantilla promueve el uso de GitHub Spec Kit como mecanismo práctico para aplicar desarrollo guiado por especificaciones.

## Qué es GitHub Spec Kit

GitHub Spec Kit es un conjunto de herramientas para organizar el trabajo en fases:

1. Principios del proyecto.
2. Especificación funcional.
3. Plan técnico.
4. Lista de tareas.
5. Implementación.

## Instalación recomendada

### Opción 1: instalación persistente

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
```

### Opción 2: uso puntual

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init <NOMBRE_PROYECTO>
```

## Inicializar en proyecto existente

```bash
specify init . --ai codex
# o
specify init --here --ai codex
```

También puedes usar ejecución puntual:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify init . --ai codex
```

## Flujo recomendado en sesión

1. `/speckit.constitution`
2. `/speckit.specify`
3. `/speckit.plan`
4. `/speckit.tasks`
5. `/speckit.implement`

## Relación con esta plantilla

- `idea/` conserva la intención general del proyecto.
- `specs/` conserva las especificaciones numeradas para lectura humana directa.
- `bitacora/` conserva historial real de ejecución.

GitHub Spec Kit y esta plantilla se complementan: uno guía el flujo y el otro ordena el conocimiento del proyecto.

## Recomendación práctica

Después de usar comandos de Spec Kit, actualiza siempre:

- `specs/INDEX.md`
- `bitacora/global/PROJECT_LOG.md`
- `bitacora/diaria/`
- `bitacora/handoffs/` si dejas trabajo pendiente
