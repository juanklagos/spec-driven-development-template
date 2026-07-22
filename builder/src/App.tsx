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
import { docsUrl } from "./help";
import { useT } from "./i18n";
import { startLive } from "./live";
import { AssistantWizard } from "./components/AssistantWizard";
import { CommandPalette } from "./components/CommandPalette";
import { KanbanBoard } from "./components/KanbanBoard";
import { LabeledEdge } from "./components/LabeledEdge";
import { NewSpecModal } from "./components/NewSpecModal";
import { NoteNode } from "./components/NoteNode";
import { Palette, PALETTE_ITEMS } from "./components/Palette";
import { SpecDrawer } from "./components/SpecDrawer";
import { SpecNode } from "./components/SpecNode";
import { TemplateGallery } from "./components/TemplateGallery";
import { TopBar } from "./components/TopBar";
import { Tour } from "./components/Tour";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBuilderStore } from "./store";
import type { AppEdge, AppNode, PaletteKind } from "./types";

const nodeTypes = { spec: SpecNode, note: NoteNode };
const edgeTypes = { labeled: LabeledEdge };

function EmptyOverlay({ onCreate }: { onCreate: () => void }) {
  const { t, lang } = useT();
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] grid place-items-center">
      <div className="pointer-events-auto max-w-md rounded-2xl border bg-card p-8 text-center shadow-lg">
        <p className="m-0 text-4xl" aria-hidden>
          🪴
        </p>
        <h2 className="mt-2 mb-2 text-lg font-semibold">{t("empty.title")}</h2>
        <p className="mb-2 text-sm text-muted-foreground">{t("empty.body")}</p>
        {/* Educational empty state: what "no specs" means and where to learn. */}
        <p className="mb-4 text-xs text-muted-foreground">
          {t("empty.learn")}{" "}
          <a
            className="font-semibold text-[var(--blue)] hover:underline"
            href={docsUrl("flow", lang)}
            target="_blank"
            rel="noreferrer noopener"
          >
            {t("help.learnMore")}
          </a>
        </p>
        <Button onClick={onCreate}>{t("empty.cta")}</Button>
      </div>
    </div>
  );
}

function LoadErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useT();
  return (
    <div className="grid flex-1 place-items-center p-8">
      <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-lg">
        <p className="m-0 text-4xl" aria-hidden>
          🔌
        </p>
        <h2 className="mt-2 mb-2 text-lg font-semibold">{t("loadError.title")}</h2>
        <p className="mb-2 font-mono text-xs break-words text-destructive">{message}</p>
        <p className="mb-4 text-sm text-muted-foreground">
          {t("loadError.hint")}{" "}
          <code>SDD_PROJECT_ROOT=/path npm run mcp:http:start</code>
        </p>
        <Button onClick={onRetry}>{t("common.retry")}</Button>
      </div>
    </div>
  );
}

function Shell() {
  const { t } = useT();
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
  const viewMode = useBuilderStore((s) => s.viewMode);

  const { screenToFlowPosition, fitView } = useReactFlow();
  const { setNodeRef: setDropRef } = useDroppable({ id: "canvas" });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const [dragKind, setDragKind] = useState<PaletteKind | null>(null);
  const [specModalPos, setSpecModalPos] = useState<XYPosition | null>(null);
  const canvasEl = useRef<HTMLDivElement | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => {
    void load();
    startLive();
  }, [load]);

  // Fit the view once the board has loaded (nodes arrive after mount) and
  // again when returning from the kanban view (the canvas remounts, spec 009).
  useEffect(() => {
    if (loading || loadError || viewMode !== "canvas") return;
    const t = setTimeout(() => void fitView({ padding: 0.15, maxZoom: 1 }), 80);
    return () => clearTimeout(t);
  }, [loading, loadError, viewMode, fitView]);

  // First visit: offer the welcome tour once the board is on screen.
  useEffect(() => {
    if (!loading && !loadError) maybeStartTour();
  }, [loading, loadError, maybeStartTour]);

  // Undo/redo keyboard shortcuts (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z), skipped
  // while typing in inputs/textareas so text editing keeps its own undo.
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd+K / Ctrl+K opens the palette. Unlike undo below, it fires from inside
  // inputs too: wanting to jump somewhere while typing is the normal case.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
        <div
          className="flex items-center gap-3 border-b bg-[var(--amber-soft)] px-4 py-2 text-sm font-semibold text-[var(--amber)]"
          role="alert"
        >
          ⚠ {t("banner.workspaceChanged")}
          <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
            {t("banner.reload")}
          </Button>
        </div>
      ) : null}
      {saveState === "error" && saveError ? (
        <div
          className="flex items-center gap-3 border-b bg-[var(--danger-soft)] px-4 py-2 text-sm text-destructive"
          role="alert"
        >
          ⚠ {saveError}
          <Button size="sm" variant="outline" onClick={() => void flushSave()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : null}
      {viewMode === "board" ? (
        // Kanban projection (spec 009, R1): same specs, same detail sheet.
        <main className="main">
          <KanbanBoard />
          <SpecDrawer />
          <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </main>
      ) : (
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
              // Spec cards carry `deletable: false`, so React Flow already
              // refuses them. This only explains WHY, once, instead of letting
              // the key press do nothing and look broken.
              onBeforeDelete={async ({ nodes: toDelete, edges: edgesToDelete }) => {
                const specs = toDelete.filter((n) => n.type === "spec");
                if (specs.length > 0) {
                  toast(t("canvas.specNotDeletable"), {
                    description: t("canvas.specNotDeletableWhy")
                  });
                }
                return { nodes: toDelete.filter((n) => n.type !== "spec"), edges: edgesToDelete };
              }}
              isValidConnection={(c) => c.source !== c.target}
            >
              <Background gap={22} />
              <Controls />
              <MiniMap pannable zoomable />
            </ReactFlow>
            {loading ? (
              <div className="absolute inset-0 z-[5] grid place-items-center bg-background/70 text-sm text-muted-foreground">
                {t("app.loading")}
              </div>
            ) : null}
            {showEmpty ? <EmptyOverlay onCreate={() => setSpecModalPos({ x: 120, y: 120 })} /> : null}
          </div>
          <SpecDrawer />
        </main>
        <DragOverlay dropAnimation={null}>
          {dragItem ? (
            <div className="palette-ghost">
              {dragItem.emoji} {t(dragItem.labelKey)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      )}
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
      <TooltipProvider delayDuration={300}>
        <Shell />
        <Toaster />
      </TooltipProvider>
    </ReactFlowProvider>
  );
}
