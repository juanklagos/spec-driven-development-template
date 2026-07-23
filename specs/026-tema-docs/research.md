# Investigación 026 - tema de la documentación

## Hallazgos

- **delphitools es shadcn/ui con paleta custom** sobre Next.js (Turbopack; `_next/static/chunks`). Tokens verificados en vivo (`getComputedStyle` + reglas CSS): `--radius: 0`, `--background:#faf5e6`, `--primary:#1e6626`, y el set completo de variables shadcn (incluida la del `sidebar`). Modo oscuro invierte a fondo casi-negro-verde y `--primary` vira a dorado `#c2ad61`.
- **Fuente: iA Writer Quattro** (`getComputedStyle(body).fontFamily` = `"iA Writer Quattro", ui-monospace, monospace`; `document.fonts` la confirma en 400/700). Licencia **SIL OFL** → auto-hospedable. Repo: `iaolo/iA-Fonts`.
- **La docs es Astro Starlight 0.41** (`@astrojs/starlight ^0.41.3`) **sin `customCss`**. Cambiar el tema es CSS + fuente + una línea de config; no toca contenido.
- **Nuestros tokens ya existen y están probados de facto** en `builder/src/styles.css` (oklch, claro y oscuro): fondo/texto slate, `--primary` verde `#16a34a`/`#22c55e`, `--amber` `#ca8a04`/`#eab308`, `--blue` `#2563eb`/`#60a5fa`, `--gray-edge`. Reusarlos da coherencia con el builder que el usuario ya ve a diario.
- **Choque con 018.** `specs/018-brand-logo/spec.md:18-21`: el verde está reservado para **estado**, el logo es monocromo, *«un logo verde pondría marca y estado a competir por el mismo color»*. El verde primario en la docs reintroduce esa competencia — elegido por el propietario con la advertencia explícita.

## Decisiones derivadas de los hallazgos

- **Mapear, no inventar.** Los tokens del builder → variables de Starlight. Una sola fuente de color para producto y docs.
- **Verde primario, logo monocromo.** Se acepta el verde de acento (lo que el usuario pidió) pero se conserva 018 RF2 (logo monocromo) y el significado de estado se ancla en etiquetas/badges, no solo en color. Decisión registrada aparte.
- **Auto-hospedar la fuente.** Coherente con MIT y con «sin peticiones externas»; el CDN solo se usó en el mockup de preview.
- **Ticker opcional.** Si exige ejectar componentes de Starlight, se separa para no inflar la spec.
