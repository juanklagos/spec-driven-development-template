# Plan 025 - semáforo de deriva spec↔código

## Resumen

Calcular en `sdd-core`, sin LLM ni red, si el código gobernado por una spec
aprobada cambió después de la aprobación (cruce ámbito de archivos × `git log` ×
fecha de aprobación), y pintarlo como un color en la tarjeta del lienzo. Convertir
el diferencial estructural del proyecto —tener un lienzo— en la respuesta visual a
un problema que el resto del mercado solo resuelve con comandos que hay que recordar.

## Contexto técnico

- La sección «Ámbito de archivos» ya existe en la plantilla de spec y en 011/023.
- `getBoardView` ya calcula `tone` una vez y lo transporta; `drift` sigue el mismo
  patrón exacto (decisión 2026-07-21, una sola regla de estado).
- `packages/sdd-mcp/src/github.ts` ya invoca binarios externos con `execFile`
  (no shell) y timeout — el patrón para `git log` ya está en el repo.
- El builder pinta `tone` sin recalcular (`SpecNode`, `KanbanBoard`, `SpecDrawer`);
  `drift` se engancha en los mismos puntos.

## Fases de implementación

1. **Depende de 024.** No arrancar hasta que exista el runner: esta lógica se
   escribe con prueba desde el primer commit (git log es fácil de fingir mal).
2. **Parser de ámbito** (`sdd-core`): rutas entre backticks de la sección File scope. Prueba con specs reales del repo.
3. **Fecha base:** leer «Fecha de aprobación»; placeholder + aprobado → estado `unknown`, no comparación falsa.
4. **Consulta git acotada:** `git log --since --name-only -- <rutas>` con `execFile`, timeout, límite. Degradar limpio si no es repo git.
5. **Campo `drift` en el board** y en el esquema MCP (`schemas.ts`), calculado en `getBoardView`.
6. **Pintado:** chip en `SpecNode`, lista de commits en `SpecDrawer`. Dark/light, idioma único.
7. **Dashboard + tool MCP:** exponer `drift` para que un agente lo vea.
8. **Docs guía 51** EN/ES: significado de colores, «señal no veredicto».

## Dependencias

- **Spec 024 (núcleo con pruebas)** — dura, no blanda: la corrección del cruce de fechas/rutas se demuestra con pruebas o no se demuestra.
- La sección «Ámbito de archivos» debe estar poblada en las specs para que la señal sea útil (si no, estado `unscoped`).

## Hitos

- H1: `getBoardView` devuelve `drift` correcto en pruebas de `sdd-core`.
- H2: chip ámbar visible en el lienzo sobre un caso real.
- H3: drawer lista los commits; dashboard y tool MCP exponen el campo.

## Riesgos

- **Ámbito mal declarado o vacío** → señal inútil. Mitigación: estado `unscoped` explícito que empuja a declararlo, en vez de verde engañoso.
- **Rutas movidas/renombradas** entre aprobación y hoy: `git log` sobre una ruta vieja puede no ver commits en la nueva. Mitigación: documentar el límite; `--follow` solo aplica a archivos, no a directorios.
- **Costo de git en repos grandes:** acotar con `--since`, límite de commits y timeout; cachear por commit HEAD si hace falta.
- **Tentación de reconciliar:** mantener el fuera de alcance firme; detectar no es resolver, y resolver toca el hard stop.
