# 🧭 Flujo de trabajo

## Vista rápida

| Paso | Acción | Resultado |
|---|---|---|
| 1 | Definir idea | Dirección clara del proyecto |
| 2 | Crear especificación | Alcance definido |
| 3 | Planificar y dividir tareas | Ejecución ordenada |
| 4 | Implementar | Entregable real |
| 5 | Registrar bitácora | Trazabilidad completa |
| 6 | Refinar | Mejora continua |

## Flujo visual

```mermaid
flowchart LR
  A["Idea"] --> B["Especificación"]
  B --> C["Plan"]
  C --> D["Tareas"]
  D --> E["Implementación"]
  E --> F["Bitácora"]
  F --> G["Refinamiento"]
  G --> B
```

## Paso 1: Definir la idea general ✨

Completa `idea/IDEA_GENERAL.md`.

## Paso 2: Crear una especificación 📄

Crea carpeta numerada dentro de `specs/`.

Ejemplo:

- `specs/001-autenticacion/`

## Paso 3: Llenar archivos obligatorios ✅

- `spec.md`
- `plan.md`
- `tasks.md`
- `research.md`
- `history.md`
- `contracts/` si aplica

## Paso 4: Ejecutar trabajo real ⚙️

Implementa tareas del archivo `tasks.md`.

## Paso 5: Registrar lo que pasó 📝

Actualiza:

- `bitacora/global/PROJECT_LOG.md`
- `bitacora/diaria/AAAA-MM-DD.md`
- `bitacora/handoffs/` cuando dejes trabajo pendiente

## Paso 6: Refinar 🔁

Si cambian ideas o requisitos, sigue:

- `docs/es/11-refinamiento-continuo.md`
