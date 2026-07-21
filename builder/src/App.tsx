import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type XYPosition
} from "@xyflow/react";
import { api } from "./api";
import { startLive } from "./live";
import { AssistantWizard } from "./components/AssistantWizard";
import { LabeledEdge } from "./components/LabeledEdge";
import { NewSpecModal } from "./components/NewSpecModal";
import { NoteNode } from "./components/NoteNode";
import { Palette, PALETTE_ITEMS } from "./components/Palette";
import { SpecDrawer } from "./components/SpecDrawer";
import { SpecNode } from "./components/SpecNode";
import { TemplateGallery } from "./components/TemplateGallery";
import { TopBar } from "./components/TopBar";
import { Tour } from "./components/Tour";
import { useBuilderStore } from "./store";
import type { AppEdge, AppNode, PaletteKind } from "./types";

const nodeTypes = { spec: SpecNode, note: NoteNode };
const edgeTypes = { labeled: LabeledEdge };

function EmptyOverlay({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="empty-overlay">
      <div className="empty-card">
        <p className="empty-emoji" aria-hidden>
          🪴
        </p>
        <h2>Tu lienzo está vacío / Your canvas is empty</h2>
        <p>
          Arrastra 💡 Idea o 📦 Épica para pensar, o 📋 Spec para crear tu primera spec real. / Drag 💡
          Idea or 📦 Epic to think, or 📋 Spec to create your first real spec.
        </p>
        <button className="btn primary" onClick={onCreate}>
          📋 Crear la primera spec / Create the first spec
        </button>
      </div>
    </div>
  );
}

function LoadErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="center-screen">
      <div className="empty-card">
        <p className="empty-emoji" aria-hidden>
          🔌
        </p>
        <h2>No se pudo cargar el tablero / Could not load the board</h2>
        <p className="load-error-detail">{message}</p>
        <p>
          ¿Está corriendo el servidor? / Is the server running?{" "}
          <code>SDD_PROJECT_ROOT=/ruta/a/tu/proyecto npm run mcp:http:start</code>
        </p>
        <button className="btn primary" onClick={onRetry}>
          Reintentar / Retry
        </button>
      </div>
    </div>
  );
}

function Shell() {
  const loading = useBuilderStore((s) => s.loading);
  const loadError = useBuilderStore((s) => s.loadError);
  const workspaceChanged = useBuilderStore((s) => s.workspaceChanged);
  const nodes = useBuilderStore((s) => s.nodes);
  const edges = useBuilderStore((s) => s.edges);
  const saveState = useBuilderStore((s) => s.saveState);
  const saveError = useBuilderStore((s) => s.saveError);
  const load = useBuilderStore((s) => s.load);
  const onNodesChange = useBuilderStore((s) => s.onNodesChange);
  const onEdgesChange = useBuilderStore((s) => s.onEdgesChange);
  const onConnect = useBuilderStore((s) => s.onConnect);
  const addNote = useBuilderStore((s) => s.addNote);
  const addSpecNode = useBuilderStore((s) => s.addSpecNode);
  const refreshSpecs = useBuilderStore((s) => s.refreshSpecs);
  const selectSpec = useBuilderStore((s) => s.selectSpec);
  const setEditingEdge = useBuilderStore((s) => s.setEditingEdge);
  const flushSave = useBuilderStore((s) => s.flushSave);
  const tourOpen = useBuilderStore((s) => s.tourOpen);
  const galleryOpen = useBuilderStore((s) => s.galleryOpen);
  const assistantOpen = useBuilderStore((s) => s.assistantOpen);
  const maybeStartTour = useBuilderStore((s) => s.maybeStartTour);

  const { screenToFlowPosition, fitView } = useReactFlow();
  const { setNodeRef: setDropRef } = useDroppable({ id: "canvas" });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const [dragKind, setDragKind] = useState<PaletteKind | null>(null);
  const [specModalPos, setSpecModalPos] = useState<XYPosition | null>(null);
  const fitted = useRef(false);
  const canvasEl = useRef<HTMLDivElement | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    void load();
    startLive();
  }, [load]);

  // Fit the view once the board has loaded (nodes arrive after mount).
  useEffect(() => {
    if (!loading && !loadError && !fitted.current) {
      fitted.current = true;
      const t = setTimeout(() => void fitView({ padding: 0.15, maxZoom: 1 }), 80);
      return () => clearTimeout(t);
    }
  }, [loading, loadError, fitView]);

  // First visit: offer the welcome tour once the board is on screen.
  useEffect(() => {
    if (!loading && !loadError) maybeStartTour();
  }, [loading, loadError, maybeStartTour]);

  // Undo/redo keyboard shortcuts (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z), skipped
  // while typing in inputs/textareas so text editing keeps its own undo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      e.preventDefault();
      const store = useBuilderStore.getState();
      if (e.shiftKey) store.redo();
      else store.undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const state = useBuilderStore.getState().saveState;
      if (state === "dirty" || state === "saving") e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const onDragStart = (event: DragStartEvent) => {
    const kind = event.active.data.current?.kind as PaletteKind | undefined;
    setDragKind(kind ?? null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setDragKind(null);
    // A drag that ends over the source button would also fire a click; skip it.
    suppressClick.current = true;
    setTimeout(() => {
      suppressClick.current = false;
    }, 0);
    if (event.over?.id !== "canvas") return;
    const rect = event.active.rect.current.translated;
    if (!rect) return;
    const position = screenToFlowPosition({ x: rect.left, y: rect.top });
    const kind = event.active.data.current?.kind as PaletteKind | undefined;
    if (kind === "idea" || kind === "epic") addNote(kind, position);
    else if (kind === "spec") setSpecModalPos(position);
  };

  // Click fallback on palette items: add at the center of the visible canvas.
  const handleQuickAdd = (kind: PaletteKind) => {
    if (suppressClick.current) return;
    const rect = canvasEl.current?.getBoundingClientRect();
    const center = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const jitter = () => Math.round((Math.random() - 0.5) * 60);
    const position = screenToFlowPosition({ x: center.x + jitter(), y: center.y + jitter() });
    if (kind === "idea" || kind === "epic") addNote(kind, position);
    else setSpecModalPos(position);
  };

  const handleCreateSpec = async (name: string, owner: string) => {
    const result = await api.createSpec(name, owner || undefined);
    addSpecNode(result.specId, specModalPos ?? { x: 80, y: 80 });
    setSpecModalPos(null);
    void refreshSpecs();
  };

  if (loadError) {
    return (
      <div className="app">
        <TopBar />
        <LoadErrorScreen message={loadError} onRetry={() => void load()} />
      </div>
    );
  }

  const dragItem = dragKind ? PALETTE_ITEMS.find((i) => i.kind === dragKind) : undefined;
  const showEmpty = !loading && nodes.length === 0;

  return (
    <div className="app">
      <TopBar />
      {workspaceChanged ? (
        <div className="workspace-banner" role="alert">
          ⚠ El workspace del servidor cambió — recarga / Server workspace changed — reload
          <button className="btn small" onClick={() => window.location.reload()}>
            Recargar / Reload
          </button>
        </div>
      ) : null}
      {saveState === "error" && saveError ? (
        <div className="save-banner" role="alert">
          ⚠ {saveError}
          <button className="btn small" onClick={() => void flushSave()}>
            Reintentar / Retry
          </button>
        </div>
      ) : null}
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <main className="main">
          <Palette onQuickAdd={handleQuickAdd} />
          <div
            className="canvas-area"
            data-tour="canvas"
            ref={(el) => {
              setDropRef(el);
              canvasEl.current = el;
            }}
          >
            <ReactFlow<AppNode, AppEdge>
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodeClick={(_, node) => {
                if (node.type === "spec") selectSpec(node.data.specId);
              }}
              onPaneClick={() => {
                selectSpec(null);
                setEditingEdge(null);
              }}
              colorMode="system"
              minZoom={0.2}
              deleteKeyCode={["Backspace", "Delete"]}
              isValidConnection={(c) => c.source !== c.target}
            >
              <Background gap={22} />
              <Controls />
              <MiniMap pannable zoomable />
            </ReactFlow>
            {loading ? <div className="loading-overlay">Cargando el tablero… / Loading the board…</div> : null}
            {showEmpty ? <EmptyOverlay onCreate={() => setSpecModalPos({ x: 120, y: 120 })} /> : null}
          </div>
          <SpecDrawer />
        </main>
        <DragOverlay dropAnimation={null}>
          {dragItem ? (
            <div className="palette-ghost">
              {dragItem.emoji} {dragItem.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {specModalPos ? (
        <NewSpecModal onClose={() => setSpecModalPos(null)} onCreate={handleCreateSpec} />
      ) : null}
      {galleryOpen ? <TemplateGallery /> : null}
      {assistantOpen ? <AssistantWizard /> : null}
      {tourOpen ? <Tour /> : null}
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <Shell />
    </ReactFlowProvider>
  );
}
