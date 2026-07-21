// Small HTTP helpers shared by the REST API and the MCP transport handler.

import http from "node:http";
import { MAX_REQUEST_BODY_BYTES, payloadTooLargeMessage } from "./security.js";

/**
 * Thrown by `readBody` when a request exceeds the byte cap. Callers map it to
 * 413 (see `payloadTooLargeResponse`) instead of letting it become a 500 — or,
 * as before this guard existed, an unrecoverable RangeError that killed the
 * process on a single unauthenticated request.
 */
export class PayloadTooLargeError extends Error {
  readonly status = 413;

  constructor(limit: number) {
    super(payloadTooLargeMessage(limit));
    this.name = "PayloadTooLargeError";
  }
}

export function isPayloadTooLarge(error: unknown): error is PayloadTooLargeError {
  return error instanceof PayloadTooLargeError;
}

export function json(res: http.ServerResponse, status: number, body: unknown): void {
  if (res.headersSent) {
    res.end();
    return;
  }
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(payload, "utf8")
  });
  res.end(payload);
}

/**
 * Buffer and JSON-parse a request body, bounded by `maxBytes`.
 *
 * Bounded in three places, because any one of them alone leaks:
 *   - the declared content-length is refused before a byte is read;
 *   - bytes are counted per chunk and the socket is destroyed past the cap
 *     (chunked uploads never declare a length);
 *   - decoding + parsing run inside try/catch, so a RangeError surfaces as a
 *     rejected promise instead of escaping the Promise executor.
 */
export function readBody(req: http.IncomingMessage, maxBytes = MAX_REQUEST_BODY_BYTES): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const fail = (error: unknown): void => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const succeed = (value: unknown): void => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const declared = Number(req.headers["content-length"]);
    if (Number.isFinite(declared) && declared > maxBytes) {
      req.pause();
      fail(new PayloadTooLargeError(maxBytes));
      return;
    }

    const chunks: Buffer[] = [];
    let size = 0;

    req.on("data", (chunk: Buffer | string) => {
      if (settled) return;
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > maxBytes) {
        // Reject, but let the caller write its 413 first. Destroying the
        // request synchronously here killed the response too, so a chunked
        // oversize body answered with ECONNRESET instead of a status code
        // (the declared-content-length path did return a real 413).
        // pause() stops the flood without tearing the socket down; the
        // caller's error handler destroys it after responding.
        req.pause();
        fail(new PayloadTooLargeError(maxBytes));
        return;
      }
      chunks.push(buffer);
    });

    req.on("end", () => {
      if (settled) return;
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        if (!text.trim()) {
          succeed(undefined);
          return;
        }
        succeed(JSON.parse(text));
      } catch (error) {
        fail(error);
      }
    });

    req.on("aborted", () => fail(new Error("Request aborted")));
    req.on("error", fail);
  });
}

/** Shape of the JSON error body used for an over-cap request. */
export function payloadTooLargeResponse(error: PayloadTooLargeError): { status: number; body: { error: string } } {
  return { status: error.status, body: { error: error.message } };
}
