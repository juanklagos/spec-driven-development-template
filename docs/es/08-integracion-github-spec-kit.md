# 🤖 Integración con GitHub Spec Kit

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
