# 🎨 SDD Builder: construye tus specs visualmente

El SDD Builder es un lienzo drag-and-drop donde compones tu flujo SDD como tarjetas conectadas — y cada tarjeta es un bundle **real** `specs/NNN-slug/` en disco. Tu markdown sigue siendo la fuente de verdad; el lienzo solo guarda posiciones en `specs/board.canvas` (formato abierto JSON Canvas).

## Inicio rápido

```bash
# una sola vez: compila el frontend
npm run builder:build

# crea un workspace de juego (o usa cualquier proyecto con sidecar spec/)
./scripts/install-spec-sidecar.sh ~/sdd-playground --profile=recommended

# arranca el servidor apuntando a tu workspace
SDD_PROJECT_ROOT=~/sdd-playground npm run mcp:http:start
# abre http://127.0.0.1:3334/builder
```

Nota: dentro de este repositorio template el builder está bloqueado por diseño (no se ejecuta trabajo de proyecto destino en la raíz del template). Apunta siempre `SDD_PROJECT_ROOT` a un workspace real.

## Qué puedes hacer

| En el lienzo | Qué pasa en disco |
| :--- | :--- |
| Arrastra una tarjeta **Spec** de la paleta y ponle nombre | Se crea un bundle real `specs/NNN-slug/` (spec, plan, tasks, history) |
| Clic en una tarjeta de spec | Drawer con sus tareas como checkboxes; extracto de spec.md en solo lectura |
| Marca un checkbox de tarea | La línea `- [ ]` de `tasks.md` pasa a `- [x]` quirúrgicamente |
| Conecta dos tarjetas, doble clic en la línea | Dependencia con etiqueta guardada en `board.canvas` |
| Añade tarjetas 💡 Idea / 📦 Épica | Notas libres (con color) en `board.canvas` |
| Mueve tarjetas | Posiciones guardadas (con debounce) — nunca toca tus .md |

## Desde un agente IA (MCP)

Cualquier cliente MCP conectado a `sdd-mcp` puede trabajar con el mismo board mediante cinco tools — `sdd_board_read`, `sdd_board_write`, `sdd_board_connect`, `sdd_read_tasks`, `sdd_set_task_done` — respaldadas por la misma capa `sdd-core` que el lienzo, así que lo que tu agente escribe es lo que ves en `/builder` (y viceversa). Ver guía 41 (referencia completa de MCP).

## Sincronización en vivo

El servidor vigila tu directorio `specs/`. Edita cualquier `tasks.md` en tu editor y la barra de progreso de la tarjeta se actualiza sola — sin recargar. La barra superior muestra **🟢 En vivo**; si el servidor se reinicia con otro workspace, un banner ámbar te pide recargar. Regla de concurrencia: tu markdown siempre gana; el layout del lienzo es "último escritor gana" (una fase futura añade merge más fino).

## Novedades de la v2 (spec 007)

- **Semáforo del gate**: chip vivo en la barra superior (🟢 abierto / 🔴 cerrado) más un botón «Validar ahora» que ejecuta la validación real; los errores del gate aparecen como badge rojo `⚠ N` con tooltip sobre la tarjeta afectada.
- **Aprobar desde el panel**: un clic confirmado escribe el bloque de aprobación real (estado, fecha de hoy, aprobador, evidencia) en `spec.md` — con error claro si el bloque no existe.
- **Tour de bienvenida**: cinco pasos anclados (paleta → crear → conectar → tareas → gate), descartable con «No mostrar de nuevo» y relanzable desde el botón «?».
- **Galería de plantillas**: los playbooks App web, API/Backend, E-commerce y SaaS crean specs reales más un tablero conectado y ordenado. Solo en un workspace con cero specs.
- **Editor guiado de spec**: la pestaña «Editar» del panel escribe la historia de usuario, los escenarios, los criterios EARS (prefijo autocompletado al enfocar) y el fuera de alcance de forma quirúrgica — la aprobación y los requisitos nunca se tocan.
- **Deshacer/rehacer + export PNG**: historial del lienzo (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z) y un botón «📷 PNG» para compartir el tablero como imagen.

Los agentes tienen los mismos tres poderes por MCP: `sdd_gate_summary`, `sdd_approve_spec`, `sdd_update_spec_sections`.

## Limitaciones (honestas)

- El contenido largo de `spec.md` más allá de las secciones guiadas se edita en tu editor, no en el lienzo (por diseño: el lienzo compone, tu editor escribe).
- Borrar una carpeta de spec en disco no retira su tarjeta automáticamente (conservador; borra la tarjeta a mano).
- Un workspace por instancia del servidor (`SDD_PROJECT_ROOT`).

## Roadmap

La vista MCP App (el board dentro de Claude/ChatGPT/VS Code) está planeada para cuando la spec MCP final (2026-07-28) se asiente — ver `specs/006-visual-spec-builder/`.
