// Template gallery data (spec 007, R4). Pure data: each template describes
// epics (free text notes), specs (created for real via POST /api/spec, in
// order, so numbering is deterministic) and labeled edges referencing either
// a spec `key` or an epic `key`. Positions are pre-laid-out so the applied
// board looks tidy without any auto-layout code. Spec names avoid accented
// characters on purpose so their slugs stay clean (see sdd-core slugify).

import { EPIC_COLOR } from "./convert";

export interface TemplateEpic {
  key: string;
  text: string;
  x: number;
  y: number;
}

export interface TemplateSpec {
  key: string;
  /** Feature name sent to POST /api/spec (slugified server-side). */
  name: string;
  x: number;
  y: number;
}

export interface TemplateEdge {
  from: string;
  to: string;
  label?: string;
}

export interface BoardTemplate {
  id: string;
  emoji: string;
  /** Bilingual display name, "ES / EN". */
  name: string;
  description: string;
  epics: TemplateEpic[];
  specs: TemplateSpec[];
  edges: TemplateEdge[];
}

export const EPIC_NOTE = { width: 260, height: 110, color: EPIC_COLOR };

const THEN = "luego / then";
const CONTAINS = "contiene / contains";

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: "web-app",
    emoji: "🌐",
    name: "App web / Web App",
    description:
      "Registro, panel y perfil para una aplicación web clásica. / Sign-up, dashboard and profile for a classic web application.",
    epics: [
      { key: "frontend", text: "📦 Frontend\nPantallas y flujo de usuario / Screens and user flow", x: 60, y: 0 },
      { key: "backend", text: "📦 Backend\nDatos y sesiones / Data and sessions", x: 800, y: 0 }
    ],
    specs: [
      { key: "auth", name: "registro y login", x: 0, y: 220 },
      { key: "dashboard", name: "panel principal", x: 380, y: 220 },
      { key: "profile", name: "perfil de usuario", x: 760, y: 220 },
      { key: "deploy", name: "despliegue", x: 1140, y: 220 }
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
    name: "API / Backend",
    description:
      "Modelo de datos, CRUD y autenticación para un servicio API. / Data model, CRUD and authentication for an API service.",
    epics: [{ key: "core", text: "📦 Nucleo del servicio / Service core", x: 400, y: 0 }],
    specs: [
      { key: "model", name: "modelo de datos", x: 0, y: 200 },
      { key: "crud", name: "endpoints crud", x: 380, y: 200 },
      { key: "auth", name: "autenticacion de api", x: 760, y: 200 },
      { key: "docs", name: "documentacion y tests", x: 380, y: 440 }
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
    name: "E-commerce",
    description:
      "Catálogo, carrito, checkout y pedidos para una tienda online. / Catalog, cart, checkout and orders for an online store.",
    epics: [
      { key: "store", text: "📦 Tienda / Store\nLo que ve el cliente / What the customer sees", x: 60, y: 0 },
      { key: "ops", text: "📦 Operaciones / Operations\nDetrás del mostrador / Behind the counter", x: 800, y: 0 }
    ],
    specs: [
      { key: "catalog", name: "catalogo de productos", x: 0, y: 220 },
      { key: "cart", name: "carrito de compra", x: 380, y: 220 },
      { key: "checkout", name: "checkout y pagos", x: 760, y: 220 },
      { key: "orders", name: "gestion de pedidos", x: 1140, y: 220 }
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
    name: "SaaS",
    description:
      "Cuentas, suscripciones y panel de administración para un producto SaaS. / Accounts, subscriptions and admin panel for a SaaS product.",
    epics: [
      { key: "product", text: "📦 Producto / Product", x: 60, y: 0 },
      { key: "business", text: "📦 Negocio / Business", x: 800, y: 0 }
    ],
    specs: [
      { key: "accounts", name: "cuentas y autenticacion", x: 0, y: 220 },
      { key: "onboarding", name: "onboarding de usuarios", x: 380, y: 220 },
      { key: "plans", name: "planes y suscripciones", x: 760, y: 220 },
      { key: "billing", name: "facturacion", x: 1140, y: 220 },
      { key: "admin", name: "panel de administracion", x: 380, y: 460 }
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
