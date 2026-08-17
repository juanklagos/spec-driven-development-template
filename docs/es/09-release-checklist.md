# Checklist de publicación

<!-- sdd:doc-type:start -->

<p class="sdd-doc-type"><strong>Cómo hacer</strong> Pasos para una tarea concreta. Da por sabido lo básico.</p>

<!-- sdd:doc-type:end -->

## 🌍 Par de idioma / Language pair

- Español: **09-release-checklist.md**
- English: [../en/09-release-checklist.md](../en/09-release-checklist.md)

> [!TIP]
> Para inicio rápido y prompts, usa:
> - [`AI_START_HERE.md`](../../AI_START_HERE.md)
> - [Matriz de prompts](./19-matriz-prompts-por-objetivo.md)
> - [Banco de prompts validados](./26-banco-prompts-validados.md)

## 🗣️ Prompt amigable (copiar y pegar)

```text
Usando https://github.com/juanklagos/spec-driven-development-template, haz una revisión de release para mi proyecto.
Mi proyecto es: [explica el proyecto].
Revisa este checklist, dime qué falta y propón acciones exactas en lenguaje simple.
```

## Para qué es esta lista

Esta es **la** lista antes de publicar una versión, cada vez. Los comandos se
ejecutan desde la carpeta principal del repositorio.

Hubo otras dos listas —[39](./39-preparacion-v1.2.0.md) y
[46](./46-preparacion-v1.3.0.md)— escritas para releases concretas que ya
salieron. Se conservan como registro histórico y no se siguen.

## 1. La compuerta primero

No hay release sin compuerta en verde, igual que no hay código sin spec.

```bash
./scripts/check-sdd-gate.sh
```

- [ ] La compuerta pasa: 0 errores.
- [ ] Cada spec tocada en este ciclo está aprobada y su plan es consistente.
- [ ] Las decisiones que se tomaron están en `bitacora/decisiones/`.

## 2. Código

```bash
npm run typecheck && npm run build && npm test
```

- [ ] `npm run typecheck` pasa.
- [ ] `npm run build` pasa.
- [ ] `npm test` pasa — unitarios más la integración MCP.

## 3. El servidor MCP responde de verdad

Las tres pruebas de humo levantan el servidor y hablan con él; no leen el
código, lo ejecutan.

```bash
npm run mcp:smoke && npm run mcp:http:smoke && npm run mcp:pack:smoke
```

- [ ] `mcp:smoke` pasa — transporte stdio.
- [ ] `mcp:http:smoke` pasa — Streamable HTTP.
- [ ] `mcp:pack:smoke` pasa — **el más importante antes de publicar**: empaqueta
      el tarball tal como saldría a npm y lo ejecuta. Es el que detectó que un
      pin interno exacto hacía que npm bajara la versión ya publicada de
      `sdd-core` en vez de la del propio tarball.

## 4. Documentación

```bash
npm run docs:types && npm run docs:links && npm run docs:contrast
```

- [ ] `docs:types` no deja cambios sin confirmar — la cabecera de tipo de cada
      guía sale de `site/src/guides.mjs`, así que no pueden discrepar.
- [ ] `docs:links` pasa en las tres superficies: `docs/`, el paquete npm y el
      sitio construido.
- [ ] `docs:contrast` pasa — ningún par de color por debajo de WCAG AA.
- [ ] Ninguna afirmación sobre la interfaz describe algo que ya no existe.
- [ ] El español y el inglés dicen lo mismo.

## 5. Versiones alineadas

Los cuatro paquetes y el `server.json` llevan **un solo número**, el de la
release del repositorio ([guía 37](./37-estrategia-versionado.md)).

- [ ] `packages/sdd-core`, `packages/sdd-mcp`, `packages/create-sdd-project` y
      el paquete raíz coinciden.
- [ ] `packages/sdd-mcp/server.json` coincide con ellos.
- [ ] El pin de `sdd-mcp` sobre `sdd-core` no se quedó atrás.

Esto no se revisa a ojo: lo comprueba `release-integrity.test.ts`, que corre
dentro de `npm test`. Si falla, dice exactamente qué archivo corregir.

## 6. Publicar

- [ ] El `CHANGELOG.md` tiene la entrada de esta versión, con lo que cambió y
      no solo los números.
- [ ] La etiqueta de git, la versión de los paquetes y el changelog coinciden.
- [ ] Las configuraciones copy/paste de MCP en la documentación corresponden a
      esta versión.

## Solo la primera vez

Estos puntos son de la publicación inicial del repositorio, ya hecha. Quedan
aquí porque sirven a quien parte de esta plantilla para su propio proyecto:

- [ ] `LICENSE`, `CONTRIBUTING.md` y `CODE_OF_CONDUCT.md` presentes.
- [ ] Plantillas de issue y pull request en `.github/`.
- [ ] Descripción y temas (topics) del repositorio en GitHub.
- [ ] `idea/`, `specs/` y `bitacora/` con sus plantillas, y al menos una spec
      de ejemplo completa.
