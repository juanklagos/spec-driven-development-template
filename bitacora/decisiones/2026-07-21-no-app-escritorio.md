# Decisión clave - No construir app de escritorio (por ahora) / Key decision - No desktop app (for now)

## Date / Fecha

2026-07-21

## Context / Contexto

El autor pidió una app de escritorio "tipo Codex/Claude Desktop/opencode" porque **"es mejor que estar corriendo comandos"**: hoy usar el SDD Builder exige levantar el servidor y abrir el navegador a mano.

Hallazgo que reencuadra el problema: **el dolor real no son los comandos, es que el builder no viaja en el paquete npm**. `packages/sdd-mcp/package.json:25` declara `"files": ["dist"]`, así que hoy hay que **clonar el repositorio** para usar el builder. Medido en el repo (`idea/EVALUACION_DESKTOP_2026-07-21.md:43,47`): `du -sh builder/dist` → **752K**; `npm pack --dry-run` → **44 archivos / 51.1 kB, sin frontend**.

**Matiz honesto sobre qué se está revirtiendo aquí.** El `"files": ["dist"]` entró en el commit `5b4d5b5` (2026-07-20 07:12:52 -0500, *"feat(npm): publishable packages under @juanklagos scope"*) como parte de un bloque de metadata de publicación (`files`, `repository`, `license`, `engines`, `publishConfig`, `prepublishOnly`) — **no** hay evidencia de que excluir el frontend fuera una elección deliberada. El comentario *"The builder frontend is checkout-only by design"* (`packages/sdd-mcp/src/static.ts:4`) **no está commiteado**: existe solo en el árbol de trabajo (`git grep checkout-only HEAD` no lo encuentra). Es decir: **un default de empaquetado que se convirtió en muro de distribución y se racionalizó a posteriori**, no una decisión razonada de la que ahora se vuelve. Se deja dicho para no fabricar una deliberación que no ocurrió.

Investigación previa: `idea/EVALUACION_DESKTOP_2026-07-21.md` (4 lentes + juez, con inventario explícito de qué quedó verificado contra fuente primaria en `:247`).

## Decision / Decisión

**No** construir app de escritorio como primer movimiento. En su lugar, por orden:

1. **Lanzador de un comando** (`npx @juanklagos/sdd`): publicar `builder/dist` en el paquete, fallback de puerto, apertura automática del navegador, selector interactivo de workspace, y lanzadores de doble clic generados localmente. → spec `011`.
2. **Spike de 1 hora**: empaquetar el server como `.mcpb`, instalarlo en Claude Desktop y comprobar si `ui://sdd/board.html` renderiza de verdad.
3. **`.mcpb`** si el spike pasa: doble clic e instala, y **Claude Desktop trae Node incorporado**, lo que elimina el único prerequisito que el lanzador no puede quitar.

Electron queda **diferido, no descartado**: se revisará solo si las tres fases anteriores demuestran ser insuficientes con uso real.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Tauri** | El servidor Node debe ir como sidecar (~115 MiB solo el binario, vs ~116 MB de todo Electron): la ventaja de tamaño desaparece para esta forma de producto. `opencode` lo construyó y **dio marcha atrás** (fallos de arranque del sidecar, renderizado WebKit); WebKitGTK es el peor caso para un canvas React Flow; bug de notarización de `externalBin` abierto (tauri#11992); añade Rust como segundo stack |
| **Electron (ahora)** | Framework correcto, secuencia equivocada: ~150-250 h de build y ~150-300 h/año de mantenimiento antes de saber si alguien lo instala |
| **App de bandeja / menu-bar** | Paga el mismo peaje de firma, notarización y QA en tres SO (~80% del costo) por una fracción del producto |
| **PWA** | No quita la terminal (el servidor sigue arrancándose a mano) y su service worker no puede servir `/api/*` ni el stream SSE |
| **Extensión de VS Code** | Diferida: sirve a desarrolladores, que son la mitad de la audiencia con **menos** dolor; alcanza ~0% de fundadores y PMs |
| **Versión web hospedada** | Contradice la arquitectura local-first (cada tarjeta es un bundle real en disco) y añade hosting, auth y multi-tenancy a un mantenedor solo |

## Consequences / Consecuencias

**A favor**
- El problema mayor (hay que clonar el repo) se resuelve en días, no meses.
- Se evitan ~150-300 h/año de mantenimiento perpetuo y $220-400/año en certificados.
- Se conserva la arquitectura local-first y los 5 canales de distribución existentes.

**Costos aceptados**
- El lanzador **sigue presuponiendo Node instalado** — el muro real para no técnicos. Solo la fase `.mcpb` lo elimina (Claude Desktop trae Node dentro).
- Sin ícono en el Dock ni ventana propia; la terminal queda viva como host del proceso.

**Bloqueadores específicos verificados que pesaron en la decisión**
- La licencia **PolyForm Noncommercial no está aprobada por OSI**, así que la firma de código gratuita para OSS (SignPath Foundation) **no aplica**: habría que pagar certificado completo. Es un costo heredado, no reabierto aquí → `2026-03-12-polyform-noncommercial-source-available.md` (ver `:45-46` y su sección "Cuándo revisar").
- **Flathub prohíbe desde el 2026-05-29** las apps con código asistido por IA, cerrando el canal principal de Linux.
- El empaquetado que esta decisión corrige es el que quedó fijado al separar el producto en `sdd-core` y `sdd-mcp` → `2026-03-18-separacion-sdd-core-y-sdd-mcp.md`. Cambia **qué se publica**, no la separación ni la fuente de verdad (`2026-07-20-builder-visual-opcion-b-y-md-como-fuente-de-verdad.md`).

**Precedente**
- **n8n Desktop**: discontinuado y repositorio archivado el 2025-08-15, con la recomendación explícita de usar `npm install -g n8n`.
- Corrección de registro: el supuesto "Flowise Desktop" **no existió** — son envoltorios de terceros (WebCatalog), no un producto oficial. No usarlo como precedente.
- En el nicho SDD (spec-kit, OpenSpec, spec-workflow-mcp, Traycer): **cero apps de escritorio**. La excepción, Kiro, es un fork de VS Code financiado por AWS.

**Vigencia**
- **Vigente**, no superseded. Aprobación del autor: *"has lo mejor a corto y largo plazo"* (`.sdd/user-consent.log:9`, 2026-07-21 11:53:44 -0500).
- La spec `011-one-command-launcher` existe y está aprobada, pero **la implementación está en espera** de que aterricen los arreglos críticos, porque comparten archivos (`specs/011-one-command-launcher/history.md`). Es decir: la decisión está tomada y **aún no ejecutada** — al leer este registro, verificar primero si `builder/dist` ya viaja en el paquete.

## Cuándo revisar esta decisión / When to revisit

- Si tras el lanzador y el `.mcpb` hay evidencia de uso real de que la fricción persiste.
- **Si el spike de 1 hora falla** (`ui://sdd/board.html` no renderiza como `.mcpb`): cae la fase 3, el lanzador queda solo y con él el prerrequisito de Node — es el escenario que devuelve Electron a la mesa antes de lo previsto.
- Si Claude Desktop deja de traer Node, o el `.mcpb` deja de ser viable.
- Si cambian los bloqueadores de canal: Flathub revierte su política del 2026-05-29, o aparece firma de código asequible sin exigir licencia OSI-approved.
- Si el proyecto deja de ser mantenido por una sola persona.
