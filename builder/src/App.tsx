import { useEffect, useMemo, useRef, useState } from "react";
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
import { Plug, Plus } from "lucide-react";
import { api } from "./api";
import { useT } from "./i18n";
import { startLive } from "./live";
import { AssistantWizard } from "./components/AssistantWizard";
import { CommandPalette } from "./components/CommandPalette";
import { CommandRow } from "./components/CommandRow";
import { ConnectAgentModal } from "./components/ConnectAgentModal";
import { ContextStrip } from "./components/ContextStrip";
import { GateStatusBar } from "./components/GateStatusBar";
import { IdentityBar } from "./components/IdentityBar";
import { KanbanBoard } from "./components/KanbanBoard";
import { LabeledEdge } from "./components/LabeledEdge";
import { NewSpecModal } from "./components/NewSpecModal";
import { NoteNode } from "./components/NoteNode";
import { Rail, PALETTE_ITEMS } from "./components/Rail";
import { SpecDrawer } from "./components/SpecDrawer";
import { SpecNode } from "./components/SpecNode";
import { TemplateGallery } from "./components/TemplateGallery";
import { Tour } from "./components/Tour";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBuilderStore } from "./store";
import type { AppEdge, AppNode, PaletteKind } from "./types";

const nodeTypes = { spec: SpecNode, note: NoteNode };
const edgeTypes = { labeled: LabeledEdge };

// Estado vacío (spec 030, R7): panel con cabecera de terminal. Sin 🪴.
function EmptyOverlay({ onCreate }: { onCreate: () => void }) {
  const { t } = useT();
  const setAssistantOpen = useBuilderStore((s) => s.setAssistantOpen);
  const setGalleryOpen = useBuilderStore((s) => s.setGalleryOpen);
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] grid place-items-center">
      <div className="pointer-events-auto w-[560px] max-w-[calc(100vw-32px)] overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="flex h-[34px] items-center gap-2 border-b bg-muted px-4">
          <span className="size-[7px] rounded-[2px] bg-[var(--disabled-foreground)]" aria-hidden />
          <span className="font-mono text-[11.5px] tracking-[0.1em] text-muted-foreground uppercase">
            specs/ {t("kanban.empty").replace(/—/g, "").trim()}
          </span>
        </div>
        <div className="flex flex-col gap-4 p-[24px_26px_26px]">
          <h2 className="m-0 text-[21px] leading-tight font-semibold tracking-[-0.015em]">
            {t("empty.title")}
          </h2>
          <p className="m-0 text-sm leading-[1.6] text-muted-foreground">{t("empty.body")}</p>
          <div className="flex flex-wrap gap-2">
            <Button className="h-9" onClick={onCreate}>
              <Plus className="size-3.5" />
              {t("empty.cta")}
            </Button>
            <Button variant="outline" className="h-9" onClick={() => setAssistantOpen(true)}>
              {t("empty.describe")}
            </Button>
            <Button variant="outline" className="h-9" onClick={() => setGalleryOpen(true)}>
              {t("empty.template")}
            </Button>
          </div>
          <div className="flex flex-col gap-2 border-t border-dashed pt-4">
            <span className="font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">
              {t("empty.terminal")}
            </span>
            <CommandRow command="npm run spec:new -- checkout" />
            {/* Spec 032: conectar el agente es parte de "empezar", no una
                opción escondida en un menú. */}
            <Button
              variant="ghost"
              className="h-7 self-start px-2 text-xs text-muted-foreground"
              onClick={() => useBuilderStore.getState().setConnectOpen(true)}
            >
              <Plug className="size-3" aria-hidden />
              {t("empty.connect")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sin conexión (spec 030, R7). Decir que no se perdió nada es la mitad del
// trabajo de esta pantalla.
function LoadErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useT();
  return (
    <div className="grid flex-1 place-items-center p-8">
      <div className="w-[600px] max-w-full overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="flex h-[34px] items-center gap-2 border-b bg-[var(--danger-soft)] px-4">
          <span className="size-[7px] rounded-[2px] bg-destructive" aria-hidden />
          <span className="font-mono text-[11.5px] tracking-[0.1em] text-[var(--destructive-text)] uppercase">
            {t("loadError.apiTag")}
          </span>
        </div>
        <div className="flex flex-col gap-3.5 p-[22px_26px_26px]">
          <h2 className="m-0 text-[20px] leading-tight font-semibold tracking-[-0.015em]">
            {t("loadError.newTitle")}
          </h2>
          <p className="m-0 text-[13.5px] leading-[1.55] text-muted-foreground">
            {t("loadError.nothingLost")}
          </p>
          <pre className="m-0 overflow-x-auto rounded-lg border bg-muted p-[10px_12px] font-mono text-xs break-words whitespace-pre-wrap text-[var(--destructive-text)]">
            {message}
          </pre>
          <span className="font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">
            {t("loadError.startIt")}
          </span>
          <CommandRow command="SDD_PROJECT_ROOT=. npm run mcp:http:start" />
          <Button className="h-[34px] self-start" onClick={onRetry}>
            {t("common.retry")}
          </Button>
        </div>
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
  const specs = useBuilderStore((s) => s.specs);
  const gate = useBuilderStore((s) => s.gate);
  const filters = useBuilderStore((s) => s.filters);
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
  const setZoom = useBuilderStore((s) => s.setZoom);
  const tourOpen = useBuilderStore((s) => s.tourOpen);
  const galleryOpen = useBuilderStore((s) => s.galleryOpen);
  const assistantOpen = useBuilderStore((s) => s.assistantOpen);
  const maybeStartTour = useBuilderStore((s) => s.maybeStartTour);
  const viewMode = useBuilderStore((s) => s.viewMode);
  const paletteOpen = useBuilderStore((s) => s.paletteOpen);
  const connectOpen = useBuilderStore((s) => s.connectOpen);
  const setConnectOpen = useBuilderStore((s) => s.setConnectOpen);
  const setPaletteOpen = useBuilderStore((s) => s.setPaletteOpen);

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

  // Cmd+K / Ctrl+K opens the palette. Unlike undo below, it fires from inside
  // inputs too: wanting to jump somewhere while typing is the normal case.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const { paletteOpen: open, setPaletteOpen: setOpen } = useBuilderStore.getState();
        setOpen(!open);
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

  // Click fallback on rail items (and the I/E/S shortcuts): add at the center
  // of the visible graph. From the kanban the graph is not mounted, so jump to
  // it first and use a safe default position.
  const handleQuickAdd = (kind: PaletteKind) => {
    if (suppressClick.current) return;
    if (viewMode === "board") {
      useBuilderStore.getState().setViewMode("canvas");
      if (kind === "idea" || kind === "epic") addNote(kind, { x: 120, y: 120 });
      else setSpecModalPos({ x: 120, y: 120 });
      return;
    }
    const rect = canvasEl.current?.getBoundingClientRect();
    const center = rect
      ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const jitter = () => Math.round((Math.random() - 0.5) * 60);
    const position = screenToFlowPosition({ x: center.x + jitter(), y: center.y + jitter() });
    if (kind === "idea" || kind === "epic") addNote(kind, position);
    else setSpecModalPos(position);
  };

  // Atajos I / E / S (spec 030, R8): colocan Idea/Épica/Spec en el centro.
  // Ignorados dentro de inputs, igual que el handler de undo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key !== "i" && key !== "e" && key !== "s") return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      const state = useBuilderStore.getState();
      if (state.paletteOpen || state.tourOpen || state.galleryOpen || state.assistantOpen) return;
      e.preventDefault();
      handleQuickAdd(key === "i" ? "idea" : key === "e" ? "epic" : "spec");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const handleCreateSpec = async (name: string, owner: string) => {
    const result = await api.createSpec(name, owner || undefined);
    addSpecNode(result.specId, specModalPos ?? { x: 80, y: 80 });
    setSpecModalPos(null);
    void refreshSpecs();
  };

  // Chips de filtro (spec 030, R8): atenúan los nodos que no cumplen; nunca
  // los ocultan, para no romper el mapa mental del grafo.
  const anyFilter = filters.pending || filters.warnings || filters.drift;
  const displayNodes = useMemo(() => {
    if (!anyFilter) return nodes;
    const depWarnings = gate?.dependencyWarnings ?? [];
    return nodes.map((node) => {
      if (node.type !== "spec") return node;
      const spec = specs[node.data.specId];
      const issues = gate?.specIssues[node.data.specId] ?? [];
      const hasWarnings =
        issues.length > 0 || depWarnings.some((w) => w.dependent === node.data.specId);
      const matches =
        (filters.pending && spec?.tone === "pending") ||
        (filters.warnings && hasWarnings) ||
        (filters.drift && spec?.drift?.state === "drifted");
      return matches ? node : { ...node, className: "filter-dimmed" };
    });
  }, [nodes, anyFilter, filters, specs, gate]);

  if (loadError) {
    return (
      <div className="app">
        <IdentityBar />
        <LoadErrorScreen message={loadError} onRetry={() => void load()} />
        <GateStatusBar />
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
    );
  }

  const dragItem = dragKind ? PALETTE_ITEMS.find((i) => i.kind === dragKind) : undefined;
  const DragIcon = dragItem?.icon;
  const showEmpty = !loading && nodes.length === 0;

  return (
    <div className="app">
      <IdentityBar />
      <ContextStrip />
      {workspaceChanged ? (
        <div
          className="flex items-center gap-3 border-b bg-[var(--amber-soft)] px-4 py-2 text-sm font-semibold text-[var(--amber-text)]"
          role="alert"
        >
          {t("banner.workspaceChanged")}
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
          {saveError}
          <Button size="sm" variant="outline" onClick={() => void flushSave()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : null}
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <main className="main">
          <Rail onQuickAdd={handleQuickAdd} />
          {viewMode === "board" ? (
            // Kanban projection (spec 009, R1): same specs, same detail sheet.
            <KanbanBoard />
          ) : (
            <div
              className="canvas-area"
              data-tour="canvas"
              ref={(el) => {
                setDropRef(el);
                canvasEl.current = el;
              }}
            >
              <ReactFlow<AppNode, AppEdge>
                nodes={displayNodes}
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
                onMove={(_, viewport) => setZoom(viewport.zoom)}
                colorMode="system"
                minZoom={0.2}
                deleteKeyCode={["Backspace", "Delete"]}
                // Spec cards carry `deletable: false`, so React Flow already
                // refuses them. This only explains WHY, once, instead of letting
                // the key press do nothing and look broken.
                onBeforeDelete={async ({ nodes: toDelete, edges: edgesToDelete }) => {
                  const specsToDelete = toDelete.filter((n) => n.type === "spec");
                  if (specsToDelete.length > 0) {
                    toast(t("canvas.specNotDeletable"), {
                      description: t("canvas.specNotDeletableWhy")
                    });
                  }
                  return { nodes: toDelete.filter((n) => n.type !== "spec"), edges: edgesToDelete };
                }}
                isValidConnection={(c) => c.source !== c.target}
              >
                <Background gap={24} color="var(--dot-grid)" />
                <Controls />
                <MiniMap pannable zoomable />
              </ReactFlow>
              {loading ? (
                <div className="absolute inset-0 z-[5] grid place-items-center bg-background/70 text-sm text-muted-foreground">
                  {t("app.loading")}
                </div>
              ) : null}
              {showEmpty ? (
                <EmptyOverlay onCreate={() => setSpecModalPos({ x: 120, y: 120 })} />
              ) : null}
            </div>
          )}
          <SpecDrawer />
        </main>
        <DragOverlay dropAnimation={null}>
          {dragItem && DragIcon ? (
            <div className="palette-ghost">
              <DragIcon className={`size-3.5 ${dragItem.iconClass}`} aria-hidden />
              {t(dragItem.labelKey)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <GateStatusBar />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      {specModalPos ? (
        <NewSpecModal onClose={() => setSpecModalPos(null)} onCreate={handleCreateSpec} />
      ) : null}
      {galleryOpen ? <TemplateGallery /> : null}
      {assistantOpen ? <AssistantWizard /> : null}
      {connectOpen ? <ConnectAgentModal onClose={() => setConnectOpen(false)} /> : null}
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
