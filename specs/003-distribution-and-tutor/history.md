# History 003 - distribution-and-tutor

## 2026-07-17

- Se crea la spec a partir del Nivel 2 de `idea/PROPUESTAS_2026-07-17.md`.
- El autor aprueba con "hazlo y continua con todo nivel senior"; consentimiento registrado en `.sdd/user-consent.log`.
- Se añade al alcance el arreglo del workflow de demo (R7): la primera corrida real reveló que vhs-action@v2 falla instalando ffmpeg.
- Publicación efectiva en npm/Marketplace queda fuera de alcance (requiere cuentas del autor); se deja preparada y documentada.

## 2026-07-17 (cierre)

- Workflow de demo corregido y verificado en CI real: run 29594585862 en verde, `docs/assets/demo.gif` (211 KB) commiteado por el bot y embebido en README EN/ES.
- R1-R7 entregados; T11 (publicar npm/Marketplace y verificar `/plugin install` end-to-end) queda como paso del autor.
- Validación: 3 scripts SDD en 0 errores; `npm run build` y `typecheck` en verde con el paquete nuevo; 0 enlaces rotos.

## 2026-07-20 (preparación npm final)

- Cuenta npm del autor recuperada. Paquetes renombrados al scope real y destapados: `@juanklagos/sdd-core`, `@juanklagos/sdd-mcp` (imports y scripts de workspace actualizados), y el scaffolder pasa a `@juanklagos/create-sdd-project` porque `create-sdd-project` ya está tomado en npm (0.20.0 de un tercero).
- Metadatos de publicación completos (files, repository, license, engines, publishConfig public, prepublishOnly build). Verificado: build, typecheck, mcp:test y `npm pack --dry-run` de los tres paquetes.
- Publicación efectiva: la ejecuta el autor con su sesión npm.
