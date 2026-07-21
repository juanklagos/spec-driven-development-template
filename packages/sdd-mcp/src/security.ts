// HTTP transport security policy. Single source of truth for "who may talk to
// this server and how much may they send": http.ts applies `guardRequest` once,
// before ANY route runs, so no route re-derives these rules.
//
// This is transport-level protection, not SDD business logic: nothing here
// duplicates @juanklagos/sdd-core.
//
// Threat model (local-first tool): the server exposes an unauthenticated REST
// API that creates and approves specs and can drive the user's authenticated
// `gh`. Two things must therefore hold by default:
//   1. It listens on loopback only, so nobody on the LAN can reach it.
//   2. A page the user merely visits cannot drive it (drive-by CSRF), which
//      means an Origin allowlist plus a JSON-only content type so browsers are
//      forced into a preflight the server never approves.

import http from "node:http";

/** Default bind address: loopback, never the wildcard. */
export const DEFAULT_HTTP_HOST = "127.0.0.1";

/**
 * Read a positive integer limit from the environment. A missing, malformed or
 * non-positive value falls back to the default: a limit that parses to NaN
 * would silently disable the very guard it configures.
 */
export function readPositiveIntEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

/** Ceiling for any request body the transport buffers (~2 MB). */
export const MAX_REQUEST_BODY_BYTES = readPositiveIntEnv("SDD_MCP_MAX_BODY_BYTES", 2 * 1024 * 1024);

/** The one wording for "too big", shared by the pre-read guard and readBody. */
export function payloadTooLargeMessage(limit: number = MAX_REQUEST_BODY_BYTES): string {
  return [
    `EN: request body too large. This server accepts at most ${limit} bytes.`,
    `ES: cuerpo de la petición demasiado grande. Este servidor acepta como máximo ${limit} bytes.`
  ].join("\n");
}

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "0000:0000:0000:0000:0000:0000:0000:0001"]);

/** `SDD_MCP_HTTP_HOST` wins; otherwise loopback. */
export function resolveBindHost(): string {
  const raw = process.env.SDD_MCP_HTTP_HOST?.trim();
  return raw ? raw : DEFAULT_HTTP_HOST;
}

/** True for localhost / 127.0.0.0/8 / ::1, in bare or bracketed IPv6 form. */
export function isLoopbackHost(host: string): boolean {
  const normalized = host.trim().toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  if (LOOPBACK_HOSTNAMES.has(normalized)) return true;
  return /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(normalized);
}

/** URL form of a bind host, so the printed URL matches what we bound to. */
export function hostForUrl(host: string): string {
  return host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
}

/** Methods that can change state and therefore need the full guard. */
export function isMutatingMethod(method: string | undefined): boolean {
  return method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
}

function extraAllowedOrigins(): string[] {
  return (process.env.SDD_MCP_HTTP_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * Loopback origins (any port, so the builder's Vite dev server keeps working),
 * the bind host itself when the operator opted out of loopback, and anything
 * listed in SDD_MCP_HTTP_ALLOWED_ORIGINS ("*" disables the check entirely).
 * An unparseable origin — including the literal "null" sent by sandboxed
 * iframes and file:// pages — is rejected.
 */
export function isAllowedOrigin(origin: string, bindHost: string): boolean {
  const extras = extraAllowedOrigins();
  if (extras.includes("*")) return true;
  if (extras.includes(origin)) return true;

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  if (isLoopbackHost(parsed.hostname)) return true;
  return !isLoopbackHost(bindHost) && parsed.hostname.toLowerCase() === bindHost.toLowerCase();
}

/**
 * A declared content type must be JSON. Absent header = a bodyless request from
 * a CLI/SDK client; browsers always declare one on form posts, and the three
 * types a form can declare are all rejected here, which forces a preflight.
 */
export function hasJsonContentType(req: http.IncomingMessage): boolean {
  const raw = req.headers["content-type"];
  if (raw === undefined) return true;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const media = value.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!media) return true;
  return media === "application/json" || media.endsWith("+json");
}

export interface GuardRejection {
  status: number;
  message: string;
}

/**
 * Returns null when the request may proceed, or the response to send instead.
 * Applied once in http.ts before routing, so every mutating route is covered.
 */
export function guardRequest(req: http.IncomingMessage, bindHost: string): GuardRejection | null {
  // Declared oversize is refused here, before a byte is read, so a polite
  // client gets a real 413 instead of a destroyed socket. Undeclared/chunked
  // bodies are still counted per chunk in readBody — that is the hard stop.
  const declaredLength = Number(req.headers["content-length"]);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BODY_BYTES) {
    return { status: 413, message: payloadTooLargeMessage() };
  }

  if (!isMutatingMethod(req.method)) return null;

  const originHeader = req.headers.origin;
  const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
  if (origin !== undefined && !isAllowedOrigin(origin, bindHost)) {
    return {
      status: 403,
      message: [
        `EN: cross-origin request blocked. Origin "${origin}" is not allowed by this local SDD server.`,
        "Set SDD_MCP_HTTP_ALLOWED_ORIGINS to opt an origin in.",
        `ES: petición cross-origin bloqueada. El origen "${origin}" no está permitido en este servidor SDD local.`,
        "Usa SDD_MCP_HTTP_ALLOWED_ORIGINS para permitir un origen."
      ].join("\n")
    };
  }

  if (!hasJsonContentType(req)) {
    return {
      status: 415,
      message: [
        "EN: unsupported media type. Mutating requests must use content-type: application/json.",
        "ES: tipo de contenido no soportado. Las peticiones que modifican estado deben usar content-type: application/json."
      ].join("\n")
    };
  }

  return null;
}
