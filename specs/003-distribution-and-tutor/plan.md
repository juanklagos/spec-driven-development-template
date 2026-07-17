# Plan 003 - distribution-and-tutor

## Resumen

Implementar el Nivel 2 de `idea/PROPUESTAS_2026-07-17.md`: distribución con un comando (plugin de Claude Code, GitHub Action, CLI npm preparado) y el tutor conversacional. Incluye además el arreglo del workflow de demo (R7, hallado en la primera corrida real: vhs-action@v2 falla instalando ffmpeg).

## Contexto técnico

- Marketplace de plugins: `.claude-plugin/marketplace.json` en la raíz del repo permite `/plugin marketplace add <owner>/<repo>`; el plugin (`plugin.json`) puede redirigir sus componentes a rutas existentes (`.claude/commands/sdd`, `skills/`), evitando duplicación.
- El nombre del plugin es `sdd` para que los comandos instalados mantengan el namespace `/sdd:*`.
- Action composite en `action.yml` (raíz): usable como `uses: juanklagos/spec-driven-development-template@main` sin publicación en Marketplace (esa requiere release y es paso posterior del autor).
- `create-sdd-project`: CLI zero-dep (node:readline, child_process) que clona el template con `--depth 1` y ejecuta `install-spec-sidecar.sh`; entra al workspace del monorepo con scripts no-op de build/typecheck para no romper `npm run build --workspaces`.
- Demo: reemplazar `charmbracelet/vhs-action@v2` por instalación directa (apt repo de Charm para vhs, binario ttyd, ffmpeg de Ubuntu) y `vhs demo.tape`.

## Fases de implementación

1. R1: `.claude-plugin/marketplace.json` + `.claude-plugin/plugin.json`.
2. R2: `.claude/commands/sdd/tutor.md` + espejo `.github/prompts/sdd-tutor.prompt.md`.
3. R3: entrevista reforzada en `.claude/commands/sdd/new.md` y su espejo.
4. R4: `action.yml` composite con autodetección de layout.
5. R5: `packages/create-sdd-project/` (package.json + index.mjs + README).
6. R6: README EN/ES (fila tutor, instalación plugin, snippet CI) + embed del GIF cuando exista.
7. R7: arreglar `.github/workflows/demo.yml` (instalación directa de vhs) y correrlo hasta obtener `docs/assets/demo.gif`.
8. Trazabilidad (CHANGELOG, INDEX, STATUS, bitácora, history) y validación (scripts + build + links).

## Dependencias

- GitHub Actions disponible (ya verificado); publicación npm/Marketplace fuera de alcance (autor).

## Hitos

- Hito 1: plugin instalable y tutor operativo (fases 1-3).
- Hito 2: Action y CLI preparados (fases 4-5).
- Hito 3: demo real en el README (fases 6-7).
- Hito 4: trazabilidad y validación en verde (fase 8).

## Riesgos

- Esquema de `plugin.json`: las rutas de componentes se validan localmente solo al instalar; se deja tarea de verificación manual con `/plugin` tras el push.
- Nombre `create-sdd-project` en npm: disponibilidad sin verificar; decidir scope al publicar.
- El apt repo de Charm o el binario de ttyd podrían cambiar; el workflow fija fallbacks mínimos.
