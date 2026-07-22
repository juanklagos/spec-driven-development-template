# Releasing / Publicar una versión

EN: the exact sequence, in order, with the traps that have already cost us a release.
ES: la secuencia exacta, en orden, con las trampas que ya nos han costado un release.

Three registries have to end up saying the same number: npm (three packages), the
official MCP Registry, and the git tag. They are published by three different commands.

Tres registros tienen que acabar diciendo el mismo número: npm (tres paquetes), el
registro oficial de MCP, y el tag de git. Los publican tres comandos distintos.

> [!WARNING]
> **npm does not let you unpublish.** A wrong number or a broken tarball stays public.
> Everything below happens before `npm publish`, on purpose.
>
> **npm no deja despublicar.** Un número equivocado o un tarball roto se queda público.
> Todo lo de abajo va antes del `npm publish`, a propósito.

## 1. Bump / Sube la versión

Eight places. Seven are obvious; the fourth is the one that has bitten us.

Ocho sitios. Siete son evidentes; el cuarto es el que nos ha mordido.

| Archivo / File | Qué / What |
|---|---|
| `package.json` | `version` |
| `packages/sdd-core/package.json` | `version` |
| `packages/sdd-mcp/package.json` | `version` |
| `packages/sdd-mcp/package.json` | **`dependencies["@juanklagos/sdd-core"]`** |
| `packages/create-sdd-project/package.json` | `version` |
| `packages/sdd-mcp/server.json` | `version` (dos veces / twice: servidor y paquete npm) |
| `README.md` y `README.es.md` | badges y `uses:` (`vX.Y.Z`) |
| `CHANGELOG.md` | `[Unreleased]` → `[vX.Y.Z]` con fecha |

**The pin.** `packages/sdd-mcp` depends on `@juanklagos/sdd-core` at an **exact** version,
not a range. Publish `sdd-mcp@2.2.0` while that line still says `2.1.0` and npm installs
the old core: it does not fail, it does not warn, and the user silently loses whatever
the new core added.

**El pin.** `packages/sdd-mcp` depende de `@juanklagos/sdd-core` con versión **exacta**,
no un rango. Si publicas `sdd-mcp@2.2.0` con esa línea todavía en `2.1.0`, npm instala el
core viejo: no falla, no avisa, y el usuario pierde en silencio lo que trajera el nuevo.

Comprobación / Check:

```bash
grep -rn "OLD_VERSION" package.json packages/*/package.json packages/sdd-mcp/server.json README.md README.es.md
```

Debe salir vacío. / Must come back empty.

## 2. Build / Compila

El frontend primero. / The frontend first.

```bash
npm run builder:build
npm run build
```

> [!IMPORTANT]
> `npm run build` compila TypeScript y nada más. Lo que mete el builder dentro del
> paquete es el `prepack` de `packages/sdd-mcp`, que se dispara en `npm pack` y en
> `npm publish`. Por eso el paso 3 no es opcional: es donde compruebas que viajó.
>
> `npm run build` compiles TypeScript and nothing else. What puts the builder inside the
> package is `packages/sdd-mcp`'s `prepack`, which fires on `npm pack` and `npm publish`.
> That is why step 3 is not optional: it is where you check that it travelled.

## 3. Pack y verifica el tarball / Pack and check the tarball

```bash
npm pack --workspaces --pack-destination /tmp/rc
tar tzf /tmp/rc/juanklagos-sdd-mcp-X.Y.Z.tgz | grep builder-ui
tar xzOf /tmp/rc/juanklagos-sdd-mcp-X.Y.Z.tgz package/package.json | grep sdd-core
```

El primero tiene que listar `index.html` y al menos un asset. El segundo tiene que decir
la versión nueva.

The first must list `index.html` and at least one asset. The second must say the new version.

## 4. Instala los tarballs como un desconocido / Install the tarballs as a stranger

Fuera del repositorio, en un directorio vacío. Si algo depende del checkout, aquí se cae.

Outside the repository, in an empty directory. If anything depends on the checkout, this
is where it falls over.

```bash
cd $(mktemp -d) && npm init -y
npm install /tmp/rc/juanklagos-sdd-core-X.Y.Z.tgz /tmp/rc/juanklagos-sdd-mcp-X.Y.Z.tgz
node node_modules/@juanklagos/sdd-mcp/dist/index.js --http &
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3334/builder   # 200
```

Y el andamiador **sin terminal interactiva**, que es como lo ejecuta un agente:

And the scaffolder **with no interactive terminal**, which is how an agent runs it:

```bash
node node_modules/@juanklagos/create-sdd-project/index.mjs mi-app < /dev/null
```

## 5. Compuerta / Gate

```bash
./scripts/validate-sdd.sh . --strict
./scripts/check-sdd-policy.sh .
./scripts/check-sdd-gate.sh .
```

## 6. Publica en npm, en este orden / Publish to npm, in this order

`sdd-core` primero: los otros dos dependen de él.

`sdd-core` first: the other two depend on it.

```bash
npm publish --workspace @juanklagos/sdd-core --access public
npm publish --workspace @juanklagos/sdd-mcp --access public
npm publish --workspace @juanklagos/create-sdd-project --access public
```

Si el segundo falla con el primero ya publicado, no hay daño: `sdd-core@X.Y.Z` queda ahí
y nadie lo alcanza hasta que suba `sdd-mcp`. Repite el comando.

If the second fails with the first already up, no harm: `sdd-core@X.Y.Z` sits there and
nobody reaches it until `sdd-mcp` goes up. Just run it again.

## 7. Tag

```bash
git tag vX.Y.Z && git push origin main --tags
```

## 8. Registro MCP / MCP Registry

**Desde `packages/sdd-mcp/`**, que es donde vive `server.json`. Desde la raíz falla con
`server.json not found`.

**From `packages/sdd-mcp/`**, where `server.json` lives. From the root it fails with
`server.json not found`.

```bash
cd packages/sdd-mcp
mcp-publisher login github
mcp-publisher publish
```

El login solo autentica. Publicar es el segundo comando.
Login only authenticates. Publishing is the second command.

## 9. Verifica los tres canales / Verify all three channels

```bash
npm view @juanklagos/sdd-mcp version
npm view @juanklagos/sdd-mcp dependencies       # el pin
git ls-remote --tags origin | grep vX.Y.Z
curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=juanklagos"
```

Los cuatro tienen que decir el mismo número. Mientras no lo digan, el release no está hecho.

All four must say the same number. Until they do, the release is not done.
