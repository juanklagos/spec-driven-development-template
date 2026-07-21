// MCP App view for the SDD board (spec 006, R5 / SEP-1865).
//
// Self-contained HTML template: no CDNs, no external requests. The host
// renders it in a sandboxed iframe; the inlined ext-apps bridge (App class,
// injected by app.ts) talks JSON-RPC over postMessage with the host to
// receive the sdd_board_app tool result and to re-invoke it on refresh.
//
// The embedded script deliberately avoids template literals (`${`) so it can
// live inside this TypeScript template string, and never emits the sequence
// "</script" (the bridge is additionally escaped in renderBoardAppHtml).

export const BOARD_APP_RESOURCE_URI = "ui://sdd/board.html";

const STYLES = `
  :root {
    --bg: #f6f7f9; --panel: #ffffff; --text: #1f2430; --muted: #667085;
    --border: #e3e6eb; --accent: #4f6df5;
    --ok: #1a7f4b; --ok-bg: #e5f5ec;
    --warn: #9a6700; --warn-bg: #fdf3d7;
    --err: #b42318; --err-bg: #fdecea;
    --done: #175cd3; --done-bg: #e7f0fe;
    --edge: #98a2b3; --node-note: #eef0f4;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #12141a; --panel: #1b1e27; --text: #e6e8ee; --muted: #98a2b3;
      --border: #2c3140; --accent: #7c94ff;
      --ok: #4ccb8f; --ok-bg: #10301f;
      --warn: #e8b93f; --warn-bg: #32270b;
      --err: #f28b82; --err-bg: #3a1512;
      --done: #82aaff; --done-bg: #14243d;
      --edge: #5b6478; --node-note: #232735;
    }
  }
  :root[data-theme="light"] {
    --bg: #f6f7f9; --panel: #ffffff; --text: #1f2430; --muted: #667085;
    --border: #e3e6eb; --accent: #4f6df5;
    --ok: #1a7f4b; --ok-bg: #e5f5ec;
    --warn: #9a6700; --warn-bg: #fdf3d7;
    --err: #b42318; --err-bg: #fdecea;
    --done: #175cd3; --done-bg: #e7f0fe;
    --edge: #98a2b3; --node-note: #eef0f4;
  }
  :root[data-theme="dark"] {
    --bg: #12141a; --panel: #1b1e27; --text: #e6e8ee; --muted: #98a2b3;
    --border: #2c3140; --accent: #7c94ff;
    --ok: #4ccb8f; --ok-bg: #10301f;
    --warn: #e8b93f; --warn-bg: #32270b;
    --err: #f28b82; --err-bg: #3a1512;
    --done: #82aaff; --done-bg: #14243d;
    --edge: #5b6478; --node-note: #232735;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 12px; background: var(--bg); color: var(--text);
    font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  #board-app { display: flex; flex-direction: column; gap: 12px; max-width: 960px; margin: 0 auto; }
  header { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  header h1 { font-size: 16px; margin: 0 auto 0 0; display: flex; align-items: center; gap: 6px; }
  .chip {
    display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px;
    border-radius: 999px; border: 1px solid var(--border); background: var(--panel);
    font-size: 12px; color: var(--muted); max-width: 260px; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis;
  }
  .chip.ok { color: var(--ok); background: var(--ok-bg); border-color: transparent; }
  .chip.warn { color: var(--warn); background: var(--warn-bg); border-color: transparent; }
  .chip.err { color: var(--err); background: var(--err-bg); border-color: transparent; }
  #refresh-btn {
    border: 1px solid var(--border); background: var(--panel); color: var(--text);
    border-radius: 8px; padding: 4px 12px; font-size: 12px; cursor: pointer;
  }
  #refresh-btn:hover { border-color: var(--accent); color: var(--accent); }
  #refresh-btn[disabled] { opacity: 0.5; cursor: wait; }
  section { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 12px; }
  section h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); margin: 0 0 8px; }
  #app-message { text-align: center; color: var(--muted); }
  #app-message.err { color: var(--err); }
  #dep-warnings ul { margin: 0; padding-left: 18px; color: var(--warn); }
  #dep-warnings li { margin: 2px 0; font-size: 13px; }
  #board-graph svg { display: block; width: 100%; height: auto; max-height: 300px; }
  #spec-cards .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 10px; }
  .card { border: 1px solid var(--border); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
  .card .id { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  .card .row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
  .badge.ok { color: var(--ok); background: var(--ok-bg); }
  .badge.warn { color: var(--warn); background: var(--warn-bg); }
  .badge.err { color: var(--err); background: var(--err-bg); }
  .badge.done { color: var(--done); background: var(--done-bg); }
  .bar { height: 6px; border-radius: 999px; background: var(--border); overflow: hidden; }
  .bar > div { height: 100%; border-radius: 999px; background: var(--accent); }
  .tasks-label { font-size: 11px; color: var(--muted); }
  footer { text-align: center; font-size: 11px; color: var(--muted); }
`;

// Vanilla-JS view logic. Runs after the bridge module (document order).
const APP_SCRIPT = `
  "use strict";
  var bridge = globalThis.__MCP_EXT_APPS__ || {};
  var App = bridge.App;
  var app = null;
  var state = { projectRoot: null, data: null };

  function $(id) { return document.getElementById(id); }
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function show(id, visible) { $(id).hidden = !visible; }
  function message(text, isError) {
    var el = $("app-message");
    el.textContent = text;
    el.className = isError ? "err" : "";
    show("status-panel", Boolean(text));
  }

  // The spec tone is computed ONCE by sdd-core (specTone) and travels in the
  // payload as spec.tone. This view only paints it.
  //
  // It used to re-derive the tone locally and checked task completion BEFORE
  // approval, inverting the golden rule: a spec at {Pendiente, 3/3} rendered a
  // green "Hecha / Done" badge — the exact "we shipped it, we never approved
  // it" anti-pattern this template exists to surface.
  var TONE_CLASS = { done: "done", ok: "ok", pending: "warn" };
  function specToneOf(spec) { return (spec && spec.tone) || "pending"; }
  function toneClass(tone) { return TONE_CLASS[tone] || "warn"; }
  function toneLabel(tone, status) {
    if (tone === "done") { return "Hecha / Done"; }
    return status ? status : (tone === "ok" ? "Aprobada / Approved" : "Pendiente / Pending");
  }

  var EDGE_COLORS = { "1": "var(--err)", "2": "#e8590c", "3": "var(--warn)", "4": "var(--ok)", "5": "#0ca678", "6": "#845ef7" };
  function edgeColor(color) {
    if (!color) { return "var(--edge)"; }
    if (EDGE_COLORS[color]) { return EDGE_COLORS[color]; }
    return /^#/.test(color) ? color : "var(--edge)";
  }
  function nodeFill(node, specsById) {
    var spec = specsById[node.id];
    if (!spec) { return "var(--node-note)"; }
    return "var(--" + toneClass(specToneOf(spec)) + "-bg)";
  }
  function nodeStroke(node, specsById) {
    var spec = specsById[node.id];
    if (!spec) { return "var(--border)"; }
    return "var(--" + toneClass(specToneOf(spec)) + ")";
  }
  function nodeLabel(node) {
    if (node.type === "text" && node.text) {
      var line = String(node.text).split(/\\r?\\n/)[0];
      return line.length > 24 ? line.slice(0, 23) + "\\u2026" : line;
    }
    return node.id;
  }
  function nodeCenter(node) { return { x: node.x + node.width / 2, y: node.y + node.height / 2 }; }

  function renderGraph(canvas, specsById) {
    var svg = $("board-svg");
    if (!canvas || !canvas.nodes || canvas.nodes.length === 0) { show("board-graph", false); return; }
    var pad = 24;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    canvas.nodes.forEach(function (node) {
      minX = Math.min(minX, node.x); minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width); maxY = Math.max(maxY, node.y + node.height);
    });
    var parts = [];
    canvas.edges.forEach(function (edge) {
      var from = null, to = null;
      canvas.nodes.forEach(function (node) {
        if (node.id === edge.fromNode) { from = node; }
        if (node.id === edge.toNode) { to = node; }
      });
      if (!from || !to) { return; }
      var a = nodeCenter(from), b = nodeCenter(to);
      var color = edgeColor(edge.color);
      parts.push('<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y +
        '" stroke="' + color + '" stroke-width="2" stroke-dasharray="6 4" />');
      if (edge.label) {
        parts.push('<text x="' + ((a.x + b.x) / 2) + '" y="' + ((a.y + b.y) / 2 - 6) +
          '" text-anchor="middle" font-size="12" fill="' + color + '">' + esc(edge.label) + "</text>");
      }
    });
    canvas.nodes.forEach(function (node) {
      parts.push('<rect x="' + node.x + '" y="' + node.y + '" width="' + node.width + '" height="' + node.height +
        '" rx="10" fill="' + nodeFill(node, specsById) + '" stroke="' + nodeStroke(node, specsById) + '" stroke-width="1.5" />');
      var center = nodeCenter(node);
      parts.push('<text x="' + center.x + '" y="' + (center.y + 4) +
        '" text-anchor="middle" font-size="13" font-family="ui-monospace, Menlo, monospace" fill="var(--text)">' +
        esc(nodeLabel(node)) + "</text>");
    });
    svg.setAttribute("viewBox", (minX - pad) + " " + (minY - pad) + " " + (maxX - minX + pad * 2) + " " + (maxY - minY + pad * 2));
    svg.innerHTML = parts.join("");
    show("board-graph", true);
  }

  function renderCards(specs, gate) {
    var grid = $("spec-cards").querySelector(".grid");
    var issues = (gate && gate.specIssues) || {};
    var html = specs.map(function (spec) {
      var tone = specToneOf(spec);
      var total = spec.tasks ? spec.tasks.total : 0;
      var done = spec.tasks ? spec.tasks.done : 0;
      var pct = total > 0 ? Math.round((done / total) * 100) : 0;
      var specErrors = (issues[spec.id] || []).filter(function (m) { return m.level === "error"; }).length;
      var errBadge = specErrors > 0
        ? '<span class="badge err" title="Errores del gate / Gate errors">\\u26a0 ' + specErrors + "</span>"
        : "";
      return '<div class="card">' +
        '<div class="row"><span class="id">' + esc(spec.id) + "</span>" + errBadge + "</div>" +
        '<div class="row"><span class="badge ' + toneClass(tone) + '">' + esc(toneLabel(tone, spec.status)) + "</span>" +
        '<span class="tasks-label">' + done + "/" + total + " tareas / tasks</span></div>" +
        '<div class="bar"><div style="width:' + pct + '%"></div></div>' +
        "</div>";
    }).join("");
    grid.innerHTML = html || '<p class="tasks-label">Sin specs todav\\u00eda / No specs yet.</p>';
    show("spec-cards", true);
  }

  function renderGate(gate) {
    var chip = $("gate-chip");
    if (!gate) { chip.hidden = true; return; }
    chip.hidden = false;
    if (gate.ok) {
      chip.className = "chip ok";
      chip.textContent = "\\ud83d\\udfe2 Gate abierto / open \\u00b7 " + gate.approvedSpecs + "/" + gate.totalSpecs;
    } else {
      chip.className = "chip err";
      chip.textContent = "\\ud83d\\udd34 Gate cerrado / closed \\u00b7 " + gate.errors + " errores / errors";
    }
    var dep = $("dep-chip");
    var warnings = gate.dependencyWarnings || [];
    dep.hidden = warnings.length === 0;
    if (warnings.length > 0) {
      dep.className = "chip warn";
      dep.textContent = "\\u26a0 " + warnings.length + " dep";
    }
    var list = $("dep-warnings").querySelector("ul");
    list.innerHTML = warnings.map(function (w) { return "<li>" + esc(w.message) + "</li>"; }).join("");
    show("dep-warnings", warnings.length > 0);
  }

  function render(data) {
    if (!data || !data.board) { message("Respuesta sin datos del board / Response carried no board data.", true); return; }
    state.data = data;
    if (data.projectRoot) { state.projectRoot = data.projectRoot; }
    var chip = $("workspace-chip");
    if (state.projectRoot) {
      var segments = String(state.projectRoot).split(/[\\\\/]/).filter(Boolean);
      chip.textContent = "\\ud83d\\udcc1 " + (segments[segments.length - 1] || state.projectRoot);
      chip.title = state.projectRoot;
      chip.hidden = false;
    }
    var specsById = {};
    (data.board.specs || []).forEach(function (spec) { specsById[spec.id] = spec; });
    message("");
    renderGate(data.gate);
    renderGraph(data.board.canvas, specsById);
    renderCards(data.board.specs || [], data.gate);
    $("board-footer").textContent =
      "Solo lectura / Read-only \\u00b7 " + (data.board.specs || []).length + " specs \\u00b7 " +
      ((data.board.canvas && data.board.canvas.edges) || []).length + " uniones / connections \\u00b7 " +
      new Date().toLocaleTimeString();
  }

  function applyHostContext(context) {
    if (context && (context.theme === "dark" || context.theme === "light")) {
      document.documentElement.dataset.theme = context.theme;
    }
    if (context && context.locale) { document.documentElement.lang = String(context.locale).slice(0, 2); }
  }

  async function refresh() {
    if (!app || !state.projectRoot) { return; }
    var button = $("refresh-btn");
    button.disabled = true;
    try {
      var result = await app.callServerTool({ name: "sdd_board_app", arguments: { projectRoot: state.projectRoot } });
      if (result && result.structuredContent) {
        render(result.structuredContent);
      } else if (result && result.isError) {
        message("La tool devolvi\\u00f3 un error / The tool returned an error.", true);
      }
    } catch (error) {
      message("No se pudo refrescar / Could not refresh: " + (error && error.message ? error.message : error), true);
    } finally {
      button.disabled = false;
    }
  }

  $("refresh-btn").addEventListener("click", refresh);

  // Debug hook for standalone smoke checks (harmless inside the sandbox).
  globalThis.__SDD_BOARD_DEBUG__ = { render: render, state: state };

  if (!App) {
    message("Este recurso necesita un cliente compatible con MCP Apps / This resource needs an MCP Apps-capable host.", true);
  } else {
    app = new App({ name: "sdd-board", version: "1.0.0" });
    app.ontoolinput = function (params) {
      var root = params && params.arguments && params.arguments.projectRoot;
      if (root) { state.projectRoot = String(root); }
    };
    app.ontoolresult = function (params) {
      if (params && params.structuredContent) { render(params.structuredContent); }
      else if (params && params.isError) { message("La tool devolvi\\u00f3 un error / The tool returned an error.", true); }
    };
    app.onhostcontextchanged = function (params) { applyHostContext(params); };
    message("Esperando datos del board / Waiting for board data\\u2026", false);
    app.connect().then(function () {
      applyHostContext(app.getHostContext());
    }).catch(function (error) {
      message("No se pudo conectar con el host / Could not connect to the host: " +
        (error && error.message ? error.message : error), true);
    });
  }
`;

/**
 * Compose the full self-contained MCP App HTML.
 *
 * @param bridgeScript Inlined ext-apps bridge (see app.ts): a module script
 * that defines globalThis.__MCP_EXT_APPS__ with the official App class.
 */
export function renderBoardAppHtml(bridgeScript: string): string {
  // Defense in depth: a "</script" inside the inlined code would end the tag
  // early. "<\/" and "</" are identical inside JS string/regex literals.
  const safeBridge = bridgeScript.replace(/<\/script/gi, "<\\/script");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SDD Board</title>
<style>${STYLES}</style>
</head>
<body>
<main id="board-app">
  <header>
    <h1>\u{1F5FA}\u{FE0F} SDD Board</h1>
    <span id="workspace-chip" class="chip" hidden></span>
    <span id="gate-chip" class="chip" hidden></span>
    <span id="dep-chip" class="chip" hidden></span>
    <button id="refresh-btn" type="button" title="Vuelve a leer el board del workspace / Re-reads the workspace board">↻ Actualizar / Refresh</button>
  </header>
  <section id="status-panel"><p id="app-message"></p></section>
  <section id="dep-warnings" hidden>
    <h2>⚠ Dependencias / Dependencies</h2>
    <ul></ul>
  </section>
  <section id="board-graph" hidden>
    <h2>Lienzo / Canvas</h2>
    <svg id="board-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SDD board graph"></svg>
  </section>
  <section id="spec-cards" hidden>
    <h2>Specs</h2>
    <div class="grid"></div>
  </section>
  <footer id="board-footer"></footer>
</main>
<script type="module">${safeBridge}</script>
<script type="module">${APP_SCRIPT}</script>
</body>
</html>
`;
}
