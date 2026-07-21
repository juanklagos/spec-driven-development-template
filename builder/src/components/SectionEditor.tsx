// Guided spec.md editor (spec 007, R5): a form for the four guided sections
// (user story, scenarios, EARS criteria, out of scope) prefilled from the
// current document. Saving calls PUT /api/spec/:id/sections, whose surgical
// replace lives in sdd-core — the rest of spec.md (approval, requirements)
// is never touched.

import { useEffect, useMemo, useState } from "react";
import { api, errorMessage } from "../api";
import { lintEarsCriterion } from "../ears";
import { parseSpecSections } from "../sections";
import type { SpecSectionsInput } from "../types";

const EARS_PREFIX = "CUANDO ";
const EARS_PLACEHOLDER = "CUANDO ... EL SISTEMA DEBERÁ ...";

interface Props {
  specId: string;
  /** Current spec.md content (from the drawer's loaded detail). */
  specMarkdown: string;
  onSaved: () => void;
}

interface ListEditorProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel: string;
  /** Autocomplete the EARS prefix when focusing an empty row. */
  earsAutocomplete?: boolean;
  /** Live EARS lint per row (spec 008, R3): advisory only, never blocks saving. */
  earsLint?: boolean;
}

function ListEditor({ label, items, onChange, placeholder, addLabel, earsAutocomplete, earsLint }: ListEditorProps) {
  const setItem = (index: number, value: string) => {
    onChange(items.map((item, i) => (i === index ? value : item)));
  };
  return (
    <div className="editor-field">
      <span className="editor-label">{label}</span>
      {items.map((item, index) => {
        // Skip the lint on untouched rows (empty or the freshly autocompleted prefix).
        const value = item.trim();
        const lint =
          earsLint && value !== "" && value !== EARS_PREFIX.trim() ? lintEarsCriterion(item) : null;
        return (
          // Index keys are fine here: rows are only appended/removed in place.
          <div className="editor-item" key={index}>
            <div className="editor-row">
              <input
                value={item}
                className={lint ? (lint.level === "ok" ? "lint-ok" : "lint-warn") : undefined}
                placeholder={placeholder}
                onChange={(e) => setItem(index, e.target.value)}
                onFocus={(e) => {
                  if (earsAutocomplete && e.currentTarget.value === "") setItem(index, EARS_PREFIX);
                }}
              />
              <button
                type="button"
                className="icon-btn"
                aria-label="Quitar / Remove"
                title="Quitar / Remove"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                ✕
              </button>
            </div>
            {lint && lint.hints.length > 0 ? (
              <p className="lint-hint">💡 {lint.hints.join(" · ")}</p>
            ) : null}
          </div>
        );
      })}
      <button type="button" className="btn small" onClick={() => onChange([...items, ""])}>
        + {addLabel}
      </button>
    </div>
  );
}

export function SectionEditor({ specId, specMarkdown, onSaved }: Props) {
  const parsed = useMemo(() => parseSpecSections(specMarkdown), [specMarkdown]);

  const [story, setStory] = useState(parsed.story);
  const [scenarios, setScenarios] = useState<string[]>(parsed.scenarios);
  const [criteria, setCriteria] = useState<string[]>(parsed.criteria);
  const [outOfScope, setOutOfScope] = useState(parsed.outOfScope);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  // Re-prime the form when another spec is selected.
  useEffect(() => {
    setStory(parsed.story);
    setScenarios(parsed.scenarios);
    setCriteria(parsed.criteria);
    setOutOfScope(parsed.outOfScope);
    setError(null);
    setSavedNote(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specId]);

  const save = async () => {
    if (busy) return;
    const cleanScenarios = scenarios.map((s) => s.trim()).filter(Boolean);
    const cleanCriteria = criteria
      .map((c) => c.trim())
      .filter((c) => c.length > 0 && c !== EARS_PREFIX.trim());

    // Send a section when it has content now, or had a heading before
    // (so clearing an existing section is possible); never create empty ones.
    const payload: SpecSectionsInput = {};
    if (story.trim() || parsed.present.story) payload.story = story.trim();
    if (cleanScenarios.length > 0 || parsed.present.scenarios) payload.scenarios = cleanScenarios;
    if (cleanCriteria.length > 0 || parsed.present.criteria) payload.criteria = cleanCriteria;
    if (outOfScope.trim() || parsed.present.outOfScope) payload.outOfScope = outOfScope.trim();
    if (Object.keys(payload).length === 0) {
      setError("Escribe al menos una sección / Write at least one section");
      return;
    }

    setBusy(true);
    setError(null);
    setSavedNote(null);
    try {
      const result = await api.putSections(specId, payload);
      const touched = [...result.updated, ...result.created];
      setSavedNote(
        `Guardado en spec.md (${touched.length} ${touched.length === 1 ? "sección" : "secciones"}) / ` +
          `Saved into spec.md (${touched.length} ${touched.length === 1 ? "section" : "sections"})`
      );
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="section-editor">
      <p className="drawer-note">
        Escribe en lenguaje natural; el builder reemplaza solo estas secciones en spec.md. / Write in
        plain language; the builder replaces only these sections inside spec.md.
      </p>
      <label className="editor-field">
        <span className="editor-label">Historia de usuario / User story</span>
        <textarea
          value={story}
          rows={3}
          placeholder="Como [rol], quiero [acción], para [beneficio]. / As a [role], I want [action], so that [benefit]."
          onChange={(e) => setStory(e.target.value)}
        />
      </label>
      <ListEditor
        label="Escenarios de aceptación / Acceptance scenarios"
        items={scenarios}
        onChange={setScenarios}
        placeholder="Dado ..., cuando ..., entonces ... / Given ..., when ..., then ..."
        addLabel="Añadir escenario / Add scenario"
      />
      <ListEditor
        label="Criterios EARS / EARS criteria"
        items={criteria}
        onChange={setCriteria}
        placeholder={EARS_PLACEHOLDER}
        addLabel="Añadir criterio / Add criterion"
        earsAutocomplete
        earsLint
      />
      <label className="editor-field">
        <span className="editor-label">Fuera de alcance / Out of scope</span>
        <textarea
          value={outOfScope}
          rows={2}
          placeholder="Lo que esta spec NO cubre / What this spec does NOT cover"
          onChange={(e) => setOutOfScope(e.target.value)}
        />
      </label>
      {error ? <p className="drawer-error">⚠ {error}</p> : null}
      {savedNote ? <p className="editor-saved">✓ {savedNote}</p> : null}
      <button className="btn primary" onClick={() => void save()} disabled={busy}>
        {busy ? "Guardando… / Saving…" : "💾 Guardar secciones / Save sections"}
      </button>
    </div>
  );
}
