# 🤖 Integración con GitHub Spec Kit

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Volver_al_índice-2D3139?style=for-the-badge" alt="Volver al índice"></a>

---

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


> [!TIP]
> Para inicio rápido y prompts, usa:
> - [`AI_START_HERE.md`](../../AI_START_HERE.md)
> - [Matriz de prompts](./19-matriz-prompts-por-objetivo.md)
> - [Banco de prompts validados](./26-banco-prompts-validados.md)



Esta plantilla recomienda usar GitHub Spec Kit como motor de flujo de trabajo.

## Mapa rápido

| Fase | Comando | Propósito |
|---|---|---|
| 1 | <kbd>/speckit.constitution</kbd> | Definir principios del proyecto |
| 2 | <kbd>/speckit.specify</kbd> | Definir qué se construye |
| 3 | <kbd>/speckit.plan</kbd> | Definir cómo se construye |
| 4 | <kbd>/speckit.tasks</kbd> | Generar tareas ejecutables |
| 5 | <kbd>/speckit.implement</kbd> | Ejecutar implementación |

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

## Inicialización recomendada con este template

Si ya tienes este template en local, puedes arrancar un proyecto nuevo y dejar Spec Kit listo en un solo paso:

```bash
./scripts/init-project-with-spec-kit.sh /ruta/proyecto codex
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

Y valida:

```bash
./scripts/validate-sdd.sh . --strict
./scripts/check-sdd-gate.sh .
```
