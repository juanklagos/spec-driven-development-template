// Spec 036 — aplicar un plan de board (asistente o plantilla) sobre el
// workspace. Tres responsabilidades que antes estaban fundidas dentro de
// `applyBoardPlan` y ahora viven separadas:
//
//   planToCanvas   plan + ids reales -> nodos y aristas        (puro)
//   appendToCanvas lienzo previo + entrante -> unión sin pisar (puro)
//   applyPlan      orquesta las escrituras contra un PUERTO    (inyectable)
//
// El puerto es lo que permite probar la orquestación —incluido el fallo a
// mitad de lote— sin servidor, sin React y sin `fetch`. El store se limita a
// pasarle `api`.

import { SPEC_CARD } from "./convert";
import { appendOffset, translate } from "./layout";
import type { BoardPlan } from "./templates";
import type { BoardCanvas, BoardResponse, CanvasEdge, CanvasNode, CreateSpecResult } from "./types";

/** Aire entre lo que ya había y lo que se añade, en px. */
export const APPEND_GAP = 80;

export interface BoardPort {
  getBoard(): Promise<BoardResponse>;
  createSpec(name: string): Promise<CreateSpecResult>;
  putBoard(canvas: BoardCanvas): Promise<unknown>;
}

/**
 * `empty-only` conserva la regla de la galería de plantillas: una plantilla es
 * un board de arranque y no se aplica encima de nada. `append` es la del
 * asistente desde la spec 036: añade y no toca lo anterior.
 */
export type ApplyMode = "append" | "empty-only";

export type PlanErrorCode = "board-not-empty" | "partial";

/** Error con forma, para que la traducción viva en la UI y no aquí. */
export class PlanError extends Error {
  readonly code: PlanErrorCode;
  readonly createdCount: number;
  readonly failedName?: string;
  /** Error original que abortó el lote. `cause` nativo no está en este target. */
  readonly reason?: unknown;

  constructor(code: PlanErrorCode, createdCount: number, failedName?: string, reason?: unknown) {
    super(`plan ${code}`);
    this.name = "PlanError";
    this.code = code;
    this.createdCount = createdCount;
    if (failedName !== undefined) this.failedName = failedName;
    if (reason !== undefined) this.reason = reason;
  }
}

export interface ApplyPlanResult {
  /** Ids de spec creados, en orden de creación. */
  createdIds: string[];
  /** Lienzo enviado al servidor. */
  canvas: BoardCanvas;
}

/**
 * `runId` hace únicos los ids de nota y arista. Sin él, aplicar el asistente
 * dos veces produciría dos `note-assistant-idea` en el mismo lienzo — invisible
 * mientras la operación exigía workspace vacío, roto en cuanto añade.
 */
export function planToCanvas(plan: BoardPlan, idByKey: ReadonlyMap<string, string>, runId: string): BoardCanvas {
  const noteId = (key: string): string => `note-${runId}-${key}`;
  const nodes: CanvasNode[] = [
    ...plan.notes.map(
      (note): CanvasNode => ({
        id: noteId(note.key),
        type: "text",
        text: note.text,
        color: note.color,
        x: note.x,
        y: note.y,
        width: note.width,
        height: note.height
      })
    ),
    ...plan.specs.flatMap((spec): CanvasNode[] => {
      const id = idByKey.get(spec.key);
      if (!id) return [];
      return [
        {
          id,
          type: "file",
          file: `specs/${id}/spec.md`,
          x: spec.x,
          y: spec.y,
          width: SPEC_CARD.width,
          height: SPEC_CARD.height
        }
      ];
    })
  ];

  const resolve = (key: string): string | undefined => {
    const specId = idByKey.get(key);
    if (specId) return specId;
    return plan.notes.some((note) => note.key === key) ? noteId(key) : undefined;
  };

  const edges: CanvasEdge[] = plan.edges.flatMap((edge): CanvasEdge[] => {
    const fromNode = resolve(edge.from);
    const toNode = resolve(edge.to);
    if (!fromNode || !toNode) return [];
    return [
      {
        id: `edge-${runId}-${edge.from}-${edge.to}`,
        fromNode,
        toNode,
        fromSide: "right",
        toSide: "left",
        ...(edge.label ? { label: edge.label } : {})
      }
    ];
  });

  return { nodes, edges };
}

/** Unión de los dos lienzos, con el entrante desplazado por debajo del previo. */
export function appendToCanvas(existing: BoardCanvas, incoming: BoardCanvas, gap = APPEND_GAP): BoardCanvas {
  const { dx, dy } = appendOffset(existing.nodes, incoming.nodes, gap);
  return {
    nodes: [...existing.nodes, ...incoming.nodes.map((node) => translate(node, dx, dy))],
    edges: [...existing.edges, ...incoming.edges]
  };
}

export interface ApplyPlanOptions {
  mode: ApplyMode;
  /** Semilla de unicidad para ids de nota y arista. */
  runId: string;
  gap?: number;
}

export async function applyPlan(
  port: BoardPort,
  plan: BoardPlan,
  { mode, runId, gap = APPEND_GAP }: ApplyPlanOptions
): Promise<ApplyPlanResult> {
  const board = await port.getBoard();
  if (mode === "empty-only" && board.specs.length > 0) {
    throw new PlanError("board-not-empty", 0);
  }

  const base: BoardCanvas = mode === "append" ? board.canvas : { nodes: [], edges: [] };
  const idByKey = new Map<string, string>();
  let failedName: string | undefined;
  let reason: unknown;

  for (const spec of plan.specs) {
    try {
      const created = await port.createSpec(spec.name);
      idByKey.set(spec.key, created.specId);
    } catch (error) {
      // R4: no se aborta en seco. Lo creado ya está en disco, así que el
      // lienzo tiene que reflejarlo antes de contar lo que salió mal.
      failedName = spec.name;
      reason = error;
      break;
    }
  }

  if (failedName !== undefined && idByKey.size === 0) {
    // Nada se creó: escribir el lienzo solo dejaría la nota de idea y las
    // épicas flotando en el tablero de alguien que no consiguió ni una spec.
    throw new PlanError("partial", 0, failedName, reason);
  }

  const canvas = appendToCanvas(base, planToCanvas(plan, idByKey, runId), gap);
  await port.putBoard(canvas);

  if (failedName !== undefined) {
    throw new PlanError("partial", idByKey.size, failedName, reason);
  }
  return { createdIds: [...idByKey.values()], canvas };
}
