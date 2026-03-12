# 🤖 Integración con GitHub Spec Kit

Esta plantilla recomienda usar GitHub Spec Kit como motor de flujo de trabajo.

## Mapa rápido

| Fase | Comando | Propósito |
|---|---|---|
| 1 | `/speckit.constitution` | Definir principios del proyecto |
| 2 | `/speckit.specify` | Definir qué se construye |
| 3 | `/speckit.plan` | Definir cómo se construye |
| 4 | `/speckit.tasks` | Generar tareas ejecutables |
| 5 | `/speckit.implement` | Ejecutar implementación |

## Flujo visual

```mermaid
flowchart LR
  A["Constitución"] --> B["Especificación"]
  B --> C["Plan"]
  C --> D["Tareas"]
  D --> E["Implementación"]
  E --> F["Bitácora + Refinamiento"]
```

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

## Relación con esta plantilla

- `idea/` define intención general.
- `specs/` guarda especificaciones numeradas.
- `bitacora/` mantiene trazabilidad real.

## Recomendación práctica

Después de usar comandos de Spec Kit, actualiza siempre:

- `specs/INDEX.md`
- `history.md` de la spec activa
- `bitacora/global/PROJECT_LOG.md`
- `bitacora/diaria/`
- `bitacora/handoffs/` si dejas trabajo pendiente
