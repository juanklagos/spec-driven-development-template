# Evaluación: ¿app de escritorio para el SDD Builder? — 2026-07-21

> Investigación multi-agente (4 lentes + juez) con verificación de fuentes. Documento de referencia;
> la decisión resumida vive en `bitacora/decisiones/2026-07-21-no-app-escritorio.md`.

## Recomendación del juez

Do NOT build a desktop app first. Ship the builder inside the npm package and add a one-command `npx @juanklagos/sdd` launcher (port fallback, auto-open browser, workspace picker), plus a locally-generated double-click `.command`/`.bat` emitted by `create-sdd-project`. Budget ~2–3 days. In parallel, run a ~1-hour spike: install the current stdio server as an `.mcpb` in Claude Desktop and check whether the `ui://sdd/board.html` MCP App actually renders on ext-apps 1.7.4. If it renders, ship the `.mcpb` next (~1–2 days) — that is the non-technical audience's real answer. Revisit Electron only after both ship and usage data proves them insufficient.

## Rechazado (con motivo)

- Tauri desktop app — the Node server must ship as a target-triple sidecar (~115 MiB for the Node binary alone, vs ~116 MB for Electron's entire runtime), so the size advantage evaporates for this exact shape; opencode built this and reversed off it citing WebKit rendering and sidecar startup failures; WebKitGTK is the worst case for a React Flow canvas; macOS externalBin notarization bug is still open (tauri#11992); adds Rust as a second stack.
- Tray / menu-bar helper as a 'cheap middle path' — it pays the identical Apple $99/yr + notarization + Windows cert + three-OS QA toll as a full desktop app. ~80% of the cost for a fraction of the product. The free SwiftBar variant makes the non-technical story worse, not better (now they must install Node AND SwiftBar).
- PWA install — does not remove the terminal at all; it is a shortcut to a server that still must be started, its service worker cannot serve /api/* or the SSE stream, and its port-bound origin directly conflicts with the port fallback the launcher needs.
- Hosted web version — highest reach, but it contradicts the local-first architecture where every card is a real specs/NNN/ bundle on disk, and adds hosting/auth/multi-tenancy to a solo maintainer.
- VS Code extension — deferred, not killed. Real precedent (spec-workflow-mcp) but it serves developers, who are the half of the audience already in the least pain, and reaches ~0% of founders/PMs. Recurring upkeep includes the Entra ID publishing migration (Dec 2026) and dual OpenVSX publishing.
- Electron desktop app as the FIRST move — right framework, wrong sequencing. Deferred behind options 1–3, not rejected permanently.

---

# Recomendación: ¿app de escritorio para el SDD Builder?

Fecha: 2026-07-21 · Proyecto: `spec-driven-development-template` v1.7.0 · Mantenedor: 1 persona

---

## 1. Respuesta directa

**No construyas la app de escritorio. Todavía no, y probablemente nunca como primer movimiento.** El dolor real no es "correr comandos": es que **el builder ni siquiera viaja dentro del paquete npm** — `packages/sdd-mcp/package.json` declara `"files": ["dist"]` y `src/static.ts` dice literalmente que el frontend es *"checkout-only by design"*, así que hoy usar el builder exige clonar el repo, `npm install`, `builder:build` y recién ahí levantar el server.

Lo primero que tienes que hacer es empaquetar `builder/dist` (**752K medidos**) dentro del paquete npm y convertir `sdd-mcp-http` — que **ya existe como bin declarado** — en un lanzador de un comando: `npx @juanklagos/sdd`, con fallback de puerto, apertura automática del navegador y selector de carpeta. **2–3 días.** Después, gasta **1 hora** en probar si el MCP App renderiza dentro de Claude Desktop instalado como `.mcpb`; si renderiza, ese es el camino para founders y PMs.

---

## 2. Por qué

### 2.1 El diagnóstico está equivocado, y la versión correcta es más barata de arreglar

Verificado en tu propio repo, hoy:

| Hecho | Evidencia |
|---|---|
| El builder **no** se publica en npm | `packages/sdd-mcp/package.json` → `"files": ["dist"]`; `npm pack --dry-run` da 44 archivos / 51.1 kB, sin frontend |
| Está documentado como decisión | `packages/sdd-mcp/src/static.ts` línea 4: *"The builder frontend is checkout-only by design"* |
| El bin HTTP **ya existe** | `"bin": { "sdd-mcp": "./dist/index.js", "sdd-mcp-http": "./dist/http.js" }` |
| El puerto está fijo, sin fallback | `packages/sdd-mcp/src/http.ts:19` → `Number(process.env.SDD_MCP_HTTP_PORT ?? "3334")` |
| Lo que falta pesa | `du -sh builder/dist` → **752K** |

Traducción: la distancia entre "hoy" y "`npx` abre el navegador" son **752K de estáticos + fallback de puerto + `open` + selector de workspace**. No gastas 150–250 horas construyendo una app de escritorio para resolver una decisión de empaquetado de 752K.

### 2.2 El precedente es unánime: nadie en tu nicho tiene app de escritorio

Sobre ~10 herramientas comparables de spec/plan: **cero apps de escritorio propias**. La única excepción es **Kiro**, que es un fork de VS Code financiado por AWS — es decir, un IDE, no un canvas de specs.

- `spec-workflow-mcp` (Pimzino, ~4.3k★) — el análogo más cercano por forma de producto: `npx` + dashboard en `localhost:5000` + extensión de VS Code. Sin Electron. → https://github.com/Pimzino/spec-workflow-mcp
- GitHub Spec Kit — solo CLI y templates. → https://github.com/github/spec-kit
- OpenSpec — `openspec view` es una TUI de terminal, sin GUI. → https://github.com/Fission-AI/OpenSpec
- Devplan, ChatPRD, Lovable — los que **sí** alcanzan audiencia no técnica son **web hospedada**, no descargables.

### 2.3 El precedente de abandono: n8n Desktop (verificado)

n8n — una empresa financiada, con equipo — mató su build de escritorio. Los motivos declarados no fueron técnicos, fueron **demanda y complejidad**: *"Usage of the Cloud and self-hosted versions of n8n is growing very quickly, and Desktop is being left behind"*, y el objetivo de *"reduce complexity generally"*. Le dijeron a los usuarios que corrieran `npm install -g n8n`.

- Anuncio (2023-05-03): https://community.n8n.io/t/sunsetting-self-hosted-team-plan-desktop-version/25830
- Repo **archivado el 2025-08-15**, README reducido a *"This repository is no longer maintained."*: https://github.com/n8n-io/n8n-desktop-app

Corrección importante: **el caso Flowise es falso.** No hay evidencia de que Flowise haya publicado nunca una app de escritorio propia; las "Flowise Desktop App" que circulan son wrappers de terceros de WebCatalog/Wavebox (https://webcatalog.io/en/apps/flowiseai). La misma trampa existe con ChatPRD. Si alguien te cita eso como precedente, está mal.

### 2.4 Dos bloqueadores específicos de TU proyecto (verificados)

1. **Tu licencia cierra la firma gratuita.** SignPath Foundation da firma OV gratis a OSS, pero sus términos exigen *"an OSI-approved Open Source license"* (https://signpath.org/terms.html). **PolyForm Noncommercial no es OSI-approved** — su restricción no comercial viola la cláusula de no discriminación por campo de uso. Eres *source-available*, no open source. Pagas certificado completo.
2. **Flathub cerró el canal Linux principal.** El 2026-05-29 instituyó una prohibición categórica: *"Applications containing AI-generated or AI-assisted code, documentation, or any other content are not allowed"*, y cubre también los PRs de envío. → https://github.com/flathub-infra/documentation/commit/992f57b30de98ddbd5e80959e9672998c83c8c97 · https://linuxiac.com/flathub-now-rejects-ai-assisted-apps-and-submissions/
   Un toolkit de SDD con historial de commits visiblemente asistido por agentes es muy improbable que pase revisión. Te queda AppImage y `.deb` — la mitad de bajo apalancamiento de Linux.

### 2.5 El costo real, en horas tuyas

| Concepto | Cifra |
|---|---|
| Build inicial (Electron, 3 SO, firma, notarización, updater, onboarding, cola de bugs) | **~150–250 h ≈ 2–4 meses part-time** |
| Mantenimiento anual | **~150–300 h/año ≈ 0.1–0.2 FTE, para siempre** |
| Efectivo | **$220–400/año** (Apple $99 + Azure Artifact Signing ~$120, o cert OV $150–300) |

El renglón que domina no es el código: es **soporte de usuario** (6–18 días/año) por Gatekeeper, SmartScreen y falsos positivos de antivirus — y escala con la adopción, con una audiencia (founders, PMs) que no puede autodiagnosticarse.

Y el treadmill no se detiene: **Electron saca major cada 8 semanas y solo soporta los últimos 3** (https://www.electronjs.org/docs/latest/tutorial/electron-timelines) — heredas el flujo completo de CVEs de Chromium/V8. Además serías dueño personal de **un canal de push de código a las máquinas de tus usuarios**; ver CVE-2025-27554 (CVSS 9.9, ToDesktop), que afectó a Cursor, Linear y Notion Calendar: https://github.com/advisories/GHSA-6662-3hpj-63qq

### 2.6 Error de categoría en la premisa

Claude Desktop, la app de Codex y opencode son **hosts**: su trabajo es correr las herramientas de otros. El lugar correcto del SDD Builder es **adentro** de ellos — que es exactamente lo que ya hace tu MCP App (SEP-1865, commit `296824a`). Construir una app de escritorio te pondría a **competir** con Claude Desktop por espacio de ventana, en vez de ser un ciudadano suyo.

---

## 3. La ruta recomendada, por fases

### Fase 1 — Quitar la terminal en días (2–3 días) ← empieza aquí

**Objetivo:** `npx @juanklagos/sdd` y el navegador se abre en el builder. Cero clone, cero build, cero variable de entorno.

| Paso | Qué | Esfuerzo |
|---|---|---|
| 1.1 | Agregar `builder/dist` (752K) a los `files` publicados y arreglar `BUILDER_DIST` en `src/static.ts` para que resuelva desde `node_modules` | 0.5 d |
| 1.2 | Fallback de puerto en `src/http.ts:19` (`get-port`/`detect-port`) en vez del `3334` fijo | 0.25 d |
| 1.3 | Apertura automática del navegador con `open` (v11, ESM nativo, maneja macOS/Windows/Linux/WSL) — https://www.npmjs.com/package/open. Precedente: `server.open` de Vite y su fallback automático de puerto — https://vite.dev/config/server-options | 0.25 d |
| 1.4 | Selector interactivo de workspace (`@clack/prompts`), en vez de exigir `SDD_PROJECT_ROOT` | 0.5 d |
| 1.5 | Paquete `@juanklagos/sdd` como lanzador de un comando | 0.5 d |

**1.6 — Lanzador de doble clic (+0.5 día).** Que `create-sdd-project` **genere localmente** un `SDD.command` (macOS) y `SDD.bat` (Windows) en la raíz del proyecto. Doble clic → arranca el server → abre el navegador.

> ⚠️ **Inferido, no verificado — pruébalo antes de depender de ello:** el atributo `com.apple.quarantine` lo aplica el agente que **descarga** el archivo, no la creación local, así que un `.command` generado en la máquina no debería disparar el diálogo de "desarrollador no identificado". No encontré cita que lo afirme específicamente para `.command`. El comportamiento de Explorer/SmartScreen 2026 para un `.bat` generado localmente también está sin verificar. **Si cualquiera de los dos falla, degrada limpiamente a la Fase 1 sin pérdida.**

**Lo que la Fase 1 NO arregla, y hay que decirlo:** sigue presuponiendo Node instalado — que es el muro documentado para no técnicos (https://github.com/anthropics/claude-code/issues/19183, y la clase de fallos `spawn npx ENOENT`: https://github.com/orgs/modelcontextprotocol/discussions/477). Tampoco da ícono en el Dock, y la ventana de terminal queda viva como host del proceso. Aun así, es la mejor relación certeza/esfuerzo de todo lo evaluado, y arregla un problema **más grande** que el que nombraste.

### Fase 2 — El spike de 1 hora (gate, no fase)

Empaqueta el server stdio actual como `.mcpb`, instálalo en Claude Desktop, y **verifica si `ui://sdd/board.html` realmente renderiza** con `@modelcontextprotocol/ext-apps ^1.7.4` (versión confirmada en tu `package.json`).

Esto es un gate porque hay **dos bloqueadores verificados**:

1. **`.mcpb` es solo stdio**, y `modelcontextprotocol/ext-apps#165` (**ABIERTO**) reporta que en Claude Desktop sobre stdio el handshake del iframe `ui://` nunca se completa — el reportante señala explícitamente que **el mismo patrón sí funciona sobre HTTP**. `ext-apps#671` (**ABIERTO, 2026-05-27**) reporta lo mismo en Windows/claude.ai. → https://github.com/modelcontextprotocol/ext-apps/issues/671
2. **Claude Desktop rechaza conectores custom con `http://localhost`** (solo `https://`), así que tu server HTTP existente **no** sirve como ruta de respaldo.

El bug se abrió contra ext-apps v1.1.2 y tú corres ^1.7.4 — puede estar arreglado. **Nadie lo sabe, y toda la estrategia no técnica descansa en eso.** Por eso: 1 hora de prueba antes de comprometer días.

### Fase 3 — `.mcpb` (1–2 días, condicionada al spike)

Un `.mcpb` es un ZIP con tu server MCP + `manifest.json`; el usuario **hace doble clic e instala**. El framing de Anthropic es literalmente tu problema: *"There's no terminal, no configuration files, and no dependency conflicts."*

Lo decisivo: **Claude Desktop trae Node.js adentro** — *"We ship Node.js with Claude Desktop, eliminating external dependencies"*. Eso **elimina por completo el prerequisito de Node**, que es el muro identificado en la Fase 1. Precedente industrial: Microsoft distribuye el Azure MCP Server así.

- https://www.anthropic.com/engineering/desktop-extensions
- https://github.com/modelcontextprotocol/mcpb
- https://devblogs.microsoft.com/azure-sdk/azure-mcp-server-mcpb-support/

Flujo: `npm i -g @anthropic-ai/mcpb`, `mcpb init`, `mcpb pack`. Sin firma, sin notarización, sin updater, sin matriz de 3 SO.

**Si el spike falla:** publica el `.mcpb` igual — vale por las herramientas MCP — y deja el board en el navegador vía Fase 1.

Nota útil: tu propio `idea/PROPUESTAS_2026-07-17.md` ya lista el bundle `.mcpb` como ítem 3.4 del roadmap. Esta recomendación **promueve un plan que ya tenías**, no inventa uno.

### Fase 4 — Reencuadrar el MCP App que ya enviaste

Mantenlo, pero descríbelo honestamente: es la superficie **"ver mi tablero sin salir del chat"**, no un reemplazo de `/builder`. Tiene un techo arquitectónico, no un bug:

- CSP por defecto es `connect-src 'none'` → **la vista no puede hablar con tu server HTTP local ni con el stream SSE**; todo va y vuelve por `tools/call`.
- La persistencia de estado está **explícitamente diferida** por la spec.
- El tamaño lo controla el host (inline por defecto) — mal encaje para un canvas drag-and-drop con drawer.
- Spec: https://modelcontextprotocol.io/seps/1865-mcp-apps-interactive-user-interfaces-for-mcp

Es tu **mejor** superficie de cero instalación y la **peor** de fidelidad completa. Ambas cosas a la vez.

### Fase 5 — Reevaluar (no antes)

Solo después de que 1–3 estén en producción **y los datos de uso reales demuestren** que no alcanzan. Si llegas aquí con evidencia, la Sección 4 te dice qué cuesta.

---

## 4. Si aun así quieres la app de escritorio

Decisión informada, no desincentivada. Esto es lo que implica.

### 4.1 El framework es Electron. No es debatible para tu forma de producto.

Tu backend es `node:http` + ESM + **cero módulos nativos**. En Electron cae directo en el main process (Node 24.18.0 en Electron 43.1.1). En Tauri **no hay runtime JS**: tienes que enviar el server como *sidecar* con sufijo de target-triple y capability `shell:allow-execute`.

Y ahí la ventaja de tamaño de Tauri **se evapora** para tu caso exacto (medido):

| Artefacto | Tamaño |
|---|---|
| `node` binario solo, descomprimido (v24.18.0 darwin-arm64) | **~115 MiB** |
| Runtime completo de Electron (`electron-v43.1.1-darwin-arm64.zip`) | **~116 MB comprimido** |

**El equipo más cercano a ti ya corrió el experimento y se devolvió.** opencode envió el sidecar de Tauri y luego reconstruyó en Electron. En sus palabras (Brendan Allan, https://dev.to/brendonovich/moving-opencode-desktop-to-electron-4hip):

> *"Tauri uses WebKit on macOS and Linux, which not only has worse performance than Chromium when rendering our app, but also has minor inconsistencies with it, especially around styles."*

y sobre el sidecar: *"impacted startup time, and occasionally just failed."* El tamaño mayor fue *"a trade-off we're willing to make."* Verificado en el repo actual: `packages/desktop/README.md` dice *"built with Electron"*, con `electron 42.3.3` y `electron-builder 26.15.2` en su `package.json`.

Sumado: tu UI es **React Flow + dnd-kit**, es decir el peor caso conocido para WebKitGTK (issues abiertos de Tauri: #3988, #7021, #10566), y `externalBin` en macOS tiene un **bug de notarización abierto** (https://github.com/tauri-apps/tauri/issues/11992). DoltHub evaluó exactamente esto y **no envió nada**: https://www.dolthub.com/blog/2025-11-13-electron-vs-tauri/

### 4.2 Lo que hay que construir

| Trabajo | Días |
|---|---|
| Shell, ventana, menús, selector de carpeta de proyecto, single-instance, selección de puerto, ciclo de vida | 4–7 |
| Refactor del server HTTP de `sdd-mcp` para correr in-process con el ciclo de vida de la GUI | 3–5 |
| Spawn de `gh`/`git` desde una app GUI — **las apps GUI no heredan el `PATH` del login shell**; resolución de shell, onboarding "git no encontrado", credenciales *(inferido, spikéalo temprano)* | 2–4 |
| Firma + notarización + CI de release en 3 SO | 3–5 |
| Auto-updater + hosting del manifiesto + pruebas de rollback | 2–3 |
| AppImage + `.deb` (Flathub efectivamente cerrado — §2.4) | 1–2 |
| Onboarding de primera ejecución, páginas de instalación, docs "por qué sale esa advertencia" en ES/EN | 2–3 |
| Cola de bugs cross-OS en beta | 5–10 |
| **Total** | **~22–39 días hábiles ≈ 150–250 h** |

### 4.3 El mantenimiento anual honesto

| Trabajo | Días/año |
|---|---|
| Upgrades de major de Electron (4–6/año para seguir soportado) | 4–8 |
| Respins de emergencia por CVE de Chromium/V8 | 2–4 |
| Firmar/notarizar/verificar por release + paradas del Notary de Apple | 2–4 |
| Renovación de certificados (Windows ahora forzado ~cada 458 días) + reverificación de identidad | 1–2 |
| Majors nuevos de macOS/Windows cada otoño, deprecaciones, drift de toolchain | 1–3 |
| **Soporte de usuario: Gatekeeper/SmartScreen/falsos positivos de AV en 3 SO** | **6–18** |
| **Total** | **~16–39 días/año ≈ 150–300 h/año, para siempre** |

### 4.4 Fricciones que no controlas

- **Notarización de Apple es una dependencia externa.** Turnaround normal 2–5 min, pero hay paradas documentadas de días en 2026 (foros 811968, 803922, 814827) sin ETA y sin aparecer en la página de estado. **Tu tren de releases puede quedar bloqueado sin que puedas hacer nada.**
- **SmartScreen es por hash de archivo Y por certificado**, y Microsoft dice explícitamente que toma *"several weeks and hundreds of clean installs"*. Con releases pequeños y frecuentes, cada release es un hash nuevo: **puede que la reputación nunca se acumule**. Además, desde 2024 **EV ya no bypassea SmartScreen** — Microsoft dice que pagar el premium EV *"is no longer justified"*: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation
- ⚠️ **Verifica tu jurisdicción antes de presupuestar:** Azure Artifact Signing (~$120/año, CI-native, sin token) está disponible para **desarrolladores individuales solo en EE.UU. y Canadá**. Fuera de ahí, es cert OV con HSM/token: $150–300/año y logística física. → https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options
- ⚠️ Los **docs oficiales de Electron están desactualizados** en firma de código (siguen diciendo que Microsoft "mandates EV"), contradiciendo la documentación actual de Microsoft. Esperar más guías de terceros obsoletas es parte del impuesto.
- **Recomendación de herramienta:** Electron Forge con `@electron/windows-sign` / `@electron/osx-sign` directo, evitando capas de abstracción; y endurece con **Fuses** (`EnableEmbeddedAsarIntegrityValidation` + `onlyLoadAppFromAsar`, ambos apagados por defecto).
- **Buena noticia real:** `update.electronjs.org` es **gratis** para apps Electron en repos públicos de GitHub — encaja con tu modelo de distribución. Tauri exige tu propio keypair y tu propio hosting, y sus docs advierten: *"If you lose this key you will NOT be able to publish new updates."*

---

## 5. Tabla comparativa de las opciones evaluadas

| # | Opción | ¿Quita la terminal? | ¿Quita el prereq. de Node? | Esfuerzo | Mantenimiento | Alcance no técnico | $/año | Veredicto |
|---|---|---|---|---|---|---|---|---|
| 1 | **`npx @juanklagos/sdd` + builder en el paquete** | 7/10 | No | **días (2–3)** | Bajo | 4/10 | 0 | ✅ **HAZ ESTO PRIMERO** |
| 2 | **Lanzador `.command`/`.bat` generado localmente** | 8/10 | No | **+0.5 día** | Bajo | 5/10 | 0 | ✅ Empaquétalo con la #1 |
| 3 | **Bundle `.mcpb` para Claude Desktop** | **10/10** | **Sí** | días (1–2) | Bajo | **9/10** | 0 | ✅ **SEGUNDO**, tras spike de 1 h |
| 4 | **MCP App SEP-1865 (ya enviado)** | 9/10 | Sí | hecho | Bajo | 9/10 | 0 | ✅ Mantener, reencuadrado |
| 5 | App de escritorio **Electron** | 10/10 | Sí | **meses** | **Alto** | 9/10 | $220–400 | ⏸️ Diferir a Fase 5 |
| 6 | App de escritorio **Tauri** | 10/10 | Sí | meses | Alto | 9/10 | $220–400 | ❌ Rechazar |
| 7 | **Helper de bandeja / barra de menú** | 9/10 | Sí (Tier B) | semanas | Alto | 7/10 | $220–800 | ❌ Rechazar |
| 8 | **Extensión de VS Code** | 8/10 (solo en VS Code) | Solo si empaqueta el server | semanas (1–2) | Medio | **2/10** | 0 | ⏸️ Diferir |
| 9 | **PWA de la UI web actual** | **2/10** | No | días (0.5) | Bajo | 3/10 | 0 | ❌ Rechazar |
| 10 | **Versión web hospedada (SaaS)** | 10/10 | Sí | meses | Alto | **10/10** | hosting | ❌ Rechazar (otro producto) |

---

## 6. Lo que NO recomiendo y por qué

- **Tauri** — el server Node viaja como sidecar target-triple (~115 MiB solo el binario de Node vs ~116 MB del runtime *completo* de Electron), así que la ventaja de tamaño desaparece para esta forma exacta; opencode lo construyó y se devolvió; WebKitGTK es el peor caso para un canvas React Flow; el bug de notarización de `externalBin` sigue abierto (tauri#11992); y suma Rust como segundo stack.
- **Helper de bandeja como "camino intermedio barato"** — paga el mismo peaje de Apple $99/año + notarización + cert de Windows + QA en 3 SO que la app completa: ~80% del costo por una fracción del producto; y la variante gratis (SwiftBar) empeora la historia no técnica porque ahora hay que instalar Node **y** SwiftBar.
- **PWA** — no quita la terminal en absoluto (es un atajo a un server que igual hay que arrancar), su service worker no puede servir `/api/*` ni el stream SSE de `/api/events`, y su origen atado al puerto **choca directamente** con el fallback de puerto que necesita la opción 1; la variante "UI hospedada hablando a localhost" ahora dispara el prompt de Local Network Access de Chrome 142.
- **Web hospedada** — máximo alcance, pero contradice la arquitectura local-first donde cada tarjeta es un bundle real `specs/NNN/` en disco, y agrega hosting, auth y multi-tenancy a la carga de un mantenedor solo (además de encajar mal con PolyForm Noncommercial).
- **Extensión de VS Code** — diferida, no muerta: tiene precedente real (`spec-workflow-mcp`, 4.3k★ pero solo **7,751 instalaciones y 2 reseñas**), sirve a la mitad de la audiencia que **menos** dolor tiene, alcanza ~0% de founders/PMs, y arrastra upkeep permanente (churn de la API, migración de PATs de Azure DevOps a Entra ID el **2026-12-01**, y doble publicación en OpenVSX para Cursor/Windsurf).
- **Electron como PRIMER movimiento** — framework correcto, secuencia equivocada: 150–250 h de build y 150–300 h/año perpetuas, con dos bloqueadores propios de este proyecto (PolyForm no es OSI-approved → sin SignPath gratis; Flathub prohíbe envíos asistidos por IA desde 2026-05-29).

---

## Anexo: verificado vs. inferido

**Verificado** (repo local o fuente primaria): los 752K de `builder/dist`; `"files": ["dist"]` y el contenido de `npm pack`; el comentario *"checkout-only by design"* en `src/static.ts:4`; el bin `sdd-mcp-http` ya declarado; el puerto 3334 fijo sin fallback en `src/http.ts:19`; `ext-apps ^1.7.4` en dependencias; que `.mcpb` es stdio-only y su estado v2.1.2; que Claude Desktop trae Node.js; que Claude Desktop rechaza conectores `http://localhost`; que ext-apps #165 y #671 siguen abiertos; el archivado de n8n-desktop-app (2025-08-15); la política de Flathub (2026-05-29); que PolyForm Noncommercial no es OSI-approved; y el razonamiento Tauri→Electron de opencode en sus propias palabras.

**Inferido, pruébalo antes de depender de ello:** que un `.command` generado localmente escapa el prompt de Gatekeeper; el comportamiento de Windows 2026 para un `.bat` generado localmente; si ext-apps 1.7.4 ya arregló el render sobre stdio; la resolución de `PATH` para `gh`/`git` desde una app GUI; y tu elegibilidad para Azure Artifact Signing según jurisdicción.

**No verificable desde aquí:** si Certum acepta licencias no-OSI para su cert de "Open Source Code Signing" (~$50/año) — vale una consulta directa, es la única opción sub-$60 encontrada.
