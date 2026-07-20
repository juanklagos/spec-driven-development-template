import type { BoardCanvas, BoardResponse, CreateSpecResult, SpecDetail, TaskItem } from "./types";

// Same-origin API served by packages/sdd-mcp (http://127.0.0.1:3334/builder).
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      headers: { "content-type": "application/json" },
      ...init
    });
  } catch {
    throw new Error(
      "No se pudo conectar con la API / Could not reach the API — arranca el servidor / start the server: " +
        "SDD_PROJECT_ROOT=/ruta/a/tu/proyecto npm run mcp:http:start"
    );
  }
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // keep the HTTP status message
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const api = {
  getBoard: (): Promise<BoardResponse> => request("/api/board"),

  putBoard: (canvas: BoardCanvas): Promise<{ ok: boolean }> =>
    request("/api/board", { method: "PUT", body: JSON.stringify(canvas) }),

  getSpec: (id: string): Promise<SpecDetail> => request(`/api/spec/${encodeURIComponent(id)}`),

  putTask: (id: string, line: number, done: boolean): Promise<{ tasks: TaskItem[] }> =>
    request(`/api/spec/${encodeURIComponent(id)}/tasks`, {
      method: "PUT",
      body: JSON.stringify({ line, done })
    }),

  createSpec: (name: string, owner?: string): Promise<CreateSpecResult> =>
    request("/api/spec", {
      method: "POST",
      body: JSON.stringify(owner ? { name, owner } : { name })
    })
};

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
