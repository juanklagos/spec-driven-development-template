// Template gallery data (spec 007, R4; localized in spec 010, R1). Pure data:
// each template describes epics (free text notes), specs (created for real
// via POST /api/spec, in order, so numbering is deterministic) and labeled
// edges referencing either a spec `key` or an epic `key`. Positions are
// pre-laid-out so the applied board looks tidy without any auto-layout code.
// Spec names avoid accented characters on purpose so their slugs stay clean
// (see sdd-core slugify). Every human-readable string carries both languages
// and `templateToPlan(template, lang)` resolves them at apply time, so what
// lands on the board (and on disk) is in the user's language only.

import { EPIC_COLOR } from "./convert";
import type { Lang } from "./i18n";

/** Bilingual string resolved at render/apply time. */
export interface LocalText {
  es: string;
  en: string;
}

export interface TemplateEpic {
  key: string;
  text: LocalText;
  x: number;
  y: number;
}

export interface TemplateSpec {
  key: string;
  /** Feature name sent to POST /api/spec (slugified server-side). */
  name: LocalText;
  x: number;
  y: number;
}

export interface TemplateEdge {
  from: string;
  to: string;
  label?: LocalText;
}

export interface BoardTemplate {
  id: string;
  emoji: string;
  name: LocalText;
  description: LocalText;
  epics: TemplateEpic[];
  specs: TemplateSpec[];
  edges: TemplateEdge[];
}

export const EPIC_NOTE = { width: 260, height: 110, color: EPIC_COLOR };

// --- Board plans -----------------------------------------------------------
// Neutral "board plan" shape applied by the store (applyBoardPlan): the
// template gallery converts its templates into plans, and the ✨ assistant
// (spec 008, assistant.ts) builds plans from its heuristic drafts. Specs are
// created in array order (POST /api/spec), so numbering stays deterministic.

export interface BoardPlanNote {
  key: string;
  text: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoardPlanEdge {
  from: string;
  to: string;
  label?: string;
}

export interface BoardPlan {
  id: string;
  notes: BoardPlanNote[];
  specs: Array<{ key: string; name: string; x: number; y: number }>;
  /** `from`/`to` reference a spec `key` or a note `key`. */
  edges: BoardPlanEdge[];
}

export function templateToPlan(template: BoardTemplate, lang: Lang): BoardPlan {
  return {
    id: template.id,
    notes: template.epics.map((epic) => ({
      key: epic.key,
      text: epic.text[lang],
      color: EPIC_NOTE.color,
      x: epic.x,
      y: epic.y,
      width: EPIC_NOTE.width,
      height: EPIC_NOTE.height
    })),
    specs: template.specs.map((spec) => ({ key: spec.key, name: spec.name[lang], x: spec.x, y: spec.y })),
    edges: template.edges.map((edge) => ({
      from: edge.from,
      to: edge.to,
      ...(edge.label ? { label: edge.label[lang] } : {})
    }))
  };
}

const THEN: LocalText = { es: "luego", en: "then" };
/** Canonical "contains" purpose (spec 010, R3) — epic → spec. */
const CONTAINS: LocalText = { es: "contiene", en: "contains" };

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: "web-app",
    emoji: "🌐",
    name: { es: "App web", en: "Web App" },
    description: {
      es: "Registro, panel y perfil para una aplicación web clásica.",
      en: "Sign-up, dashboard and profile for a classic web application."
    },
    epics: [
      {
        key: "frontend",
        text: {
          es: "📦 Frontend\nPantallas y flujo de usuario",
          en: "📦 Frontend\nScreens and user flow"
        },
        x: 60,
        y: 0
      },
      {
        key: "backend",
        text: { es: "📦 Backend\nDatos y sesiones", en: "📦 Backend\nData and sessions" },
        x: 800,
        y: 0
      }
    ],
    specs: [
      { key: "auth", name: { es: "registro y login", en: "signup and login" }, x: 0, y: 220 },
      { key: "dashboard", name: { es: "panel principal", en: "main dashboard" }, x: 380, y: 220 },
      { key: "profile", name: { es: "perfil de usuario", en: "user profile" }, x: 760, y: 220 },
      { key: "deploy", name: { es: "despliegue", en: "deployment" }, x: 1140, y: 220 }
    ],
    edges: [
      { from: "frontend", to: "dashboard", label: CONTAINS },
      { from: "backend", to: "auth", label: CONTAINS },
      { from: "auth", to: "dashboard", label: THEN },
      { from: "dashboard", to: "profile", label: THEN },
      { from: "profile", to: "deploy", label: THEN }
    ]
  },
  {
    id: "api-backend",
    emoji: "🔌",
    name: { es: "API / Backend", en: "API / Backend" },
    description: {
      es: "Modelo de datos, CRUD y autenticación para un servicio API.",
      en: "Data model, CRUD and authentication for an API service."
    },
    epics: [
      {
        key: "core",
        text: { es: "📦 Nucleo del servicio", en: "📦 Service core" },
        x: 400,
        y: 0
      }
    ],
    specs: [
      { key: "model", name: { es: "modelo de datos", en: "data model" }, x: 0, y: 200 },
      { key: "crud", name: { es: "endpoints crud", en: "crud endpoints" }, x: 380, y: 200 },
      { key: "auth", name: { es: "autenticacion de api", en: "api authentication" }, x: 760, y: 200 },
      { key: "docs", name: { es: "documentacion y tests", en: "docs and tests" }, x: 380, y: 440 }
    ],
    edges: [
      { from: "core", to: "crud", label: CONTAINS },
      { from: "model", to: "crud", label: THEN },
      { from: "crud", to: "auth", label: THEN },
      { from: "auth", to: "docs", label: THEN }
    ]
  },
  {
    id: "ecommerce",
    emoji: "🛒",
    name: { es: "E-commerce", en: "E-commerce" },
    description: {
      es: "Catálogo, carrito, checkout y pedidos para una tienda online.",
      en: "Catalog, cart, checkout and orders for an online store."
    },
    epics: [
      {
        key: "store",
        text: {
          es: "📦 Tienda\nLo que ve el cliente",
          en: "📦 Store\nWhat the customer sees"
        },
        x: 60,
        y: 0
      },
      {
        key: "ops",
        text: {
          es: "📦 Operaciones\nDetrás del mostrador",
          en: "📦 Operations\nBehind the counter"
        },
        x: 800,
        y: 0
      }
    ],
    specs: [
      { key: "catalog", name: { es: "catalogo de productos", en: "product catalog" }, x: 0, y: 220 },
      { key: "cart", name: { es: "carrito de compra", en: "shopping cart" }, x: 380, y: 220 },
      { key: "checkout", name: { es: "checkout y pagos", en: "checkout and payments" }, x: 760, y: 220 },
      { key: "orders", name: { es: "gestion de pedidos", en: "order management" }, x: 1140, y: 220 }
    ],
    edges: [
      { from: "store", to: "catalog", label: CONTAINS },
      { from: "ops", to: "orders", label: CONTAINS },
      { from: "catalog", to: "cart", label: THEN },
      { from: "cart", to: "checkout", label: THEN },
      { from: "checkout", to: "orders", label: THEN }
    ]
  },
  {
    id: "saas",
    emoji: "🚀",
    name: { es: "SaaS", en: "SaaS" },
    description: {
      es: "Cuentas, suscripciones y panel de administración para un producto SaaS.",
      en: "Accounts, subscriptions and admin panel for a SaaS product."
    },
    epics: [
      { key: "product", text: { es: "📦 Producto", en: "📦 Product" }, x: 60, y: 0 },
      { key: "business", text: { es: "📦 Negocio", en: "📦 Business" }, x: 800, y: 0 }
    ],
    specs: [
      {
        key: "accounts",
        name: { es: "cuentas y autenticacion", en: "accounts and authentication" },
        x: 0,
        y: 220
      },
      { key: "onboarding", name: { es: "onboarding de usuarios", en: "user onboarding" }, x: 380, y: 220 },
      { key: "plans", name: { es: "planes y suscripciones", en: "plans and subscriptions" }, x: 760, y: 220 },
      { key: "billing", name: { es: "facturacion", en: "billing" }, x: 1140, y: 220 },
      { key: "admin", name: { es: "panel de administracion", en: "admin panel" }, x: 380, y: 460 }
    ],
    edges: [
      { from: "product", to: "onboarding", label: CONTAINS },
      { from: "business", to: "plans", label: CONTAINS },
      { from: "accounts", to: "onboarding", label: THEN },
      { from: "onboarding", to: "plans", label: THEN },
      { from: "plans", to: "billing", label: THEN },
      { from: "billing", to: "admin", label: THEN }
    ]
  }
];
