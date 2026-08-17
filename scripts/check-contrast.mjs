// Spec 035 — mide el contraste de los pares de color reales del sitio.
//
// Existe porque el rediseño anterior (spec 034) envió un badge de 11px con
// 3.09:1 sobre fondo claro sin que nadie lo notara: la revisión de
// documentación nunca midió contraste. Un handoff de diseño lo detectó, pero
// dos de sus cifras estaban mal. Estimar no sirve; esto convierte oklch a
// luminancia y aplica la fórmula de WCAG.
//
// Uso: node scripts/check-contrast.mjs

/** oklch → sRGB con gamma, sin dependencias. */
function oklchToSrgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  ];
  return lin.map((c) => {
    const v = Math.min(1, Math.max(0, c));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  });
}

function relativeLuminance([r, g, b]) {
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(fg, bg) {
  const a = relativeLuminance(fg);
  const b = relativeLuminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const ok = (l, c, h) => oklchToSrgb(l, c, h);

// Fondos reales del tema (site/src/styles/theme.css).
const BG_DARK = ok(0.172, 0.014, 261.7);
const BG_LIGHT = ok(0.977, 0.003, 247.9);
const BG_NAV_LIGHT = ok(1, 0, 0);

/**
 * Cada par que el sitio pinta de verdad. `large: true` para texto de 24px, o
 * de 19px en negrita: WCAG le permite 3:1.
 */
const PAIRS = [
  // --- Texto principal ---
  { name: "texto sobre fondo (oscuro)", fg: ok(0.925, 0.008, 255.5), bg: BG_DARK },
  { name: "texto sobre fondo (claro)", fg: ok(0.235, 0.02, 257.3), bg: BG_LIGHT },

  // --- Texto secundario: gray-3 es el mínimo usable, gray-4 es borde ---
  { name: "texto tenue gray-3 (oscuro)", fg: ok(0.69, 0.02, 256.8), bg: BG_DARK },
  { name: "texto tenue gray-3 (claro)", fg: ok(0.5, 0.025, 257.3), bg: BG_LIGHT },

  // --- Verde como TEXTO: el defecto que corrige esta spec ---
  { name: "verde texto: accent (oscuro)", fg: ok(0.723, 0.192, 149.6), bg: BG_DARK },
  { name: "verde texto: accent-high (claro)", fg: ok(0.38, 0.11, 150), bg: BG_LIGHT },
  { name: "verde texto sobre nav blanco (claro)", fg: ok(0.38, 0.11, 150), bg: BG_NAV_LIGHT },

  // --- Botón relleno ---
  { name: "boton primario (oscuro)", fg: ok(0.2, 0.03, 150), bg: ok(0.723, 0.192, 149.6) },
  { name: "boton primario (claro)", fg: ok(0.99, 0, 0), bg: ok(0.5, 0.15, 149) },

  // --- Avisos: variante de TEXTO, no la de superficie ---
  { name: "ambar texto (oscuro)", fg: ok(0.84, 0.13, 82), bg: BG_DARK },
  { name: "ambar texto (claro)", fg: ok(0.48, 0.12, 72), bg: BG_LIGHT },
  { name: "rojo texto (oscuro)", fg: ok(0.704, 0.191, 22.2), bg: BG_DARK },
  { name: "azul texto (oscuro)", fg: ok(0.707, 0.143, 254.6), bg: BG_DARK }
];

let failed = false;
console.log("contraste (WCAG AA: 4.5:1 texto normal, 3:1 texto grande)\n");
for (const pair of PAIRS) {
  const ratio = contrast(pair.fg, pair.bg);
  const min = pair.large ? 3 : 4.5;
  const pass = ratio >= min;
  if (!pass) failed = true;
  console.log(`${pass ? "  ok  " : " FALLA"} ${ratio.toFixed(2).padStart(5)}:1  ${pair.name}`);
}

if (failed) {
  console.error("\nHay pares por debajo del minimo. Corrige el token, no el tamano del texto.");
  process.exitCode = 1;
} else {
  console.log("\nTodos los pares cumplen.");
}
