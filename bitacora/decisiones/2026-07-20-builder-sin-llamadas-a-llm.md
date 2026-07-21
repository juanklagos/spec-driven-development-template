# Decisión clave - El builder no llama a ninguna API de LLM: heurística local determinista y prompts copy-first / Key decision - Zero LLM calls, deterministic local heuristics

## Date / Fecha

2026-07-20

## Context / Contexto

La spec 008 («SDD Builder v3: IA») nació del catálogo `idea/IDEAS_BUILDER_V2_2026-07-20.md`, ítem 1: *"✨ Asistente IA «Descríbeme tu proyecto» — escribes una frase; **el agente (vía las tools MCP existentes `sdd_board_*`)** genera las tarjetas idea→épicas→specs conectadas"*. Desde el planteamiento la inteligencia se ubicó **fuera** del builder.

El producto es local-first y se instala como paquete npm: pedir una API key propia habría convertido «abrir el builder» en «date de alta en un proveedor y paga tokens», y habría metido un secreto en una app que corre en la máquina del usuario. Además, el usuario del builder **ya tiene un agente conectado** (Claude Code, Codex, Cursor…) — el mismo que lee este repo por MCP.

## Decision / Decisión

El asistente ✨ **no usa API keys ni llama a ningún modelo**. Criterio EARS literal en `specs/008-builder-v3-ai/spec.md:21`:

> *"EL SISTEMA DEBERÁ funcionar sin API key propia: la generación IA se delega al agente del usuario vía las tools MCP (`sdd_board_*`) con un prompt orquestador documentado, y el asistente de la UI DEBERÁ ofrecer modo plantilla+heurística cuando no haya agente conectado."*

En concreto:

- **Heurística 100 % local y determinista** (mismo texto + variante → mismo borrador): `builder/src/assistant.ts` detecta 9 dominios por regex — auth, catálogo, pagos, pedidos, admin, api, notificaciones, perfil, búsqueda (`assistant.ts:86-158`) — con fallback MVP «modelo de datos / flujo principal / interfaz» (`assistant.ts:168-181`). La cabecera del archivo lo declara: *"Pure and local: no API keys, no network… Real intelligence is delegated to the user's agent over MCP"* (`assistant.ts:1-8`).
- **La IA real se delega al agente** vía `buildOrchestratorPrompt` (`builder/src/prompts.ts`), documentado en la guía 51 (`docs/es/51-guia-visual-sdd-builder.md:36`, `docs/en/51-sdd-builder-visual-guide.md:36`: *"nunca llama a un LLM (no hay API keys que configurar — solo heurísticas locales)"*).
- **Copy-first, sin deep links**: `prompts.ts:2` — *"No deep links into any particular agent app on purpose — a copied prompt works with every agent (Claude Code, Codex, Cursor, …)"*; `builder/src/components/ImplementModal.tsx:1` — *"Copy-first by design: no fragile deep links into a specific agent app"*.

`specs/008-builder-v3-ai/history.md` (cierre 2026-07-20) lo confirma en la implementación: *"el resto es frontend puro sin llamadas a LLM (decisión de la spec: sin API keys, la IA real se delega al agente del usuario)"*.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Llamadas directas del server a APIs de LLM** | Rechazada de entrada: figura en «Fuera de alcance» de `spec.md:32` — *"Llamadas directas del server a APIs de LLM (sin keys)"*. Se rechazó **la categoría entera**, no un proveedor |
| **Deep links a una app de agente concreta** | Rechazados por fragilidad entre agentes (`prompts.ts:2`, `ImplementModal.tsx:1`). El ítem 14 del catálogo de ideas los dejaba abiertos (*"deep link o copy"*); la implementación eligió copy |

En la evidencia no hay comparación de proveedores, ni costos por token, ni benchmark de calidad heurística contra LLM. Tampoco un documento de investigación dedicado. El rechazo está escrito como línea de alcance, no como análisis de trade-off.

## Consequences / Consecuencias

**A favor**
- Cero configuración: no hay key que pedir, guardar ni rotar en una app local.
- El prompt copiado funciona con cualquier agente, hoy y con los que salgan.
- El borrador es reproducible: mismo input → mismo output, testeable sin red.

**Costos aceptados** *(registrados como notas de implementación en `history.md`, no como análisis previo de trade-off)*
- La heurística **solo conoce esos 9 dominios**; fuera de ellos cae al fallback MVP genérico.
- El asistente **solo aplica en workspaces vacíos** (`AssistantWizard.tsx:55,205`: `hasSpecs` deshabilita el botón), misma guardia y verdad del servidor que la galería de plantillas.
- Las épicas que se quedan sin specs **se descartan** del plan (sin notas huérfanas).
- Los nombres de spec se generan **sin acentos** para slugs limpios.
- `copyToClipboard` (`prompts.ts:77-102`) necesita race de timeout 1200 ms + fallback `execCommand` + aviso honesto «Selecciona y copia», porque la Clipboard API puede colgarse en navegadores embebidos.

**Coherencia con el hard stop**
- «Implementar con agente» queda **deshabilitado con tooltip del hard stop** mientras la spec no esté aprobada de verdad (status real del summary, `SpecDrawer.tsx`). Delegar la IA no relaja la compuerta: la refuerza, porque el prompt entregado arranca por `/sdd:gate`.

**Vigencia**
- **Vigente.** Ninguna decisión posterior la supersede. Verificado: no existe una sola referencia a `anthropic`, `openai` o `apiKey` en `builder/src` ni en `packages/*/src`. Spec 010 solo cambió los prompts a un idioma por vez (`prompts.ts:3`), y la Fase 3 de la spec 006 (MCP App, commit `296824a`) sigue sin llamar a ningún modelo.
- Commit de implementación `8dfaecf` (2026-07-20 21:00:28 -0500); publicado en v1.7.0 (`17bf6f7`, 2026-07-20 21:27:51 -0500), anunciado en `CHANGELOG.md:72` como *"AI without API keys"*.

**Cuándo revisar esta decisión**
- Si el fallback MVP genérico se dispara con frecuencia en uso real: señal de que 9 dominios no alcanzan y que la heurística está fingiendo entender.
- Si aparece un modelo local (sin key, sin red, sin costo) que quepa en el paquete: desaparecería la premisa económica del rechazo, no la de privacidad.
- Si se acumula evidencia de usuarios **sin agente conectado** que esperaban IA real: hoy reciben plantilla+heurística, y ese es el modo degradado que la spec eligió a propósito.
- Si algún agente publica un mecanismo de entrega de prompt estable y estándar (no un deep link propietario): la parte «copy-first» podría revisarse sin tocar la parte «sin API keys» — son dos decisiones que conviene separar al revisarlas.
- Si alguna vez se añade una llamada a LLM, este registro debe reemplazarse, no editarse: cambia el contrato de instalación («no hay nada que configurar») que hoy se promete en la guía 51.
