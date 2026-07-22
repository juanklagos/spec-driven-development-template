// Full guided spec.md editor (spec 007, R5 → spec 010, R2): one form per
// template section — user story, scenarios, EARS criteria, requirements,
// spec properties, success criteria and out of scope — in an ordered
// accordion, prefilled from the current document. List sections support
// add/remove/reorder. Saving calls PUT /api/spec/:id/sections, whose
// surgical replace lives in sdd-core — the rest of spec.md (the approval
// block included) is never touched.

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { api, errorMessage } from "../api";
import { lintEarsCriterion } from "../ears";
import { useT, type TFunction } from "../i18n";
import { parseSpecSections } from "../sections";
import { HelpHint } from "./HelpHint";
import type { SpecSectionsInput } from "../types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const EARS_PREFIX_ES = "CUANDO ";
const EARS_PREFIX_EN = "WHEN ";
const EARS_PLACEHOLDER_ES = "CUANDO ... EL SISTEMA DEBERÁ ...";
const EARS_PLACEHOLDER_EN = "WHEN ... THE SYSTEM SHALL ...";

interface Props {
  specId: string;
  /** Current spec.md content (from the sheet's loaded detail). */
  specMarkdown: string;
  onSaved: () => void;
}

const inputClass =
  "w-full rounded-md border border-input bg-muted/50 px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40";

interface ListEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel: string;
  /** Autocomplete the EARS prefix when focusing an empty row. */
  earsAutocomplete?: boolean;
  /** Live EARS lint per row (spec 008, R3): advisory only, never blocks saving. */
  earsLint?: boolean;
  t: TFunction;
  earsPrefix: string;
}

function ListEditor({ items, onChange, placeholder, addLabel, earsAutocomplete, earsLint, t, earsPrefix }: ListEditorProps) {
  const setItem = (index: number, value: string) => {
    onChange(items.map((item, i) => (i === index ? value : item)));
  };
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => {
        // Skip the lint on untouched rows (empty or the freshly autocompleted prefix).
        const value = item.trim();
        const lint =
          earsLint && value !== "" && value !== earsPrefix.trim() ? lintEarsCriterion(item) : null;
        const lintClass =
          lint == null ? "" : lint.level === "ok" ? " !border-primary" : " !border-[var(--amber)]";
        const hints: string[] = [];
        if (lint && !lint.matchesPattern) hints.push(t("ears.pattern"));
        if (lint && lint.vagueWords.length > 0) {
          hints.push(t("ears.vague", { words: lint.vagueWords.join(", ") }));
        }
        return (
          // Index keys are fine here: rows are only appended/removed/swapped in place.
          <div className="flex flex-col gap-1" key={index}>
            <div className="flex items-center gap-1">
              <input
                value={item}
                className={inputClass + lintClass}
                placeholder={placeholder}
                onChange={(e) => setItem(index, e.target.value)}
                onFocus={(e) => {
                  if (earsAutocomplete && e.currentTarget.value === "") setItem(index, earsPrefix);
                }}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7 shrink-0"
                aria-label={t("common.moveUp")}
                title={t("common.moveUp")}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ChevronUp />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7 shrink-0"
                aria-label={t("common.moveDown")}
                title={t("common.moveDown")}
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                <ChevronDown />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7 shrink-0"
                aria-label={t("common.remove")}
                title={t("common.remove")}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <X />
              </Button>
            </div>
            {hints.length > 0 ? (
              <p className="m-0 text-xs text-[var(--amber)]">💡 {hints.join(" · ")}</p>
            ) : null}
          </div>
        );
      })}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="self-start"
        onClick={() => onChange([...items, ""])}
      >
        + {addLabel}
      </Button>
    </div>
  );
}

/**
 * Unsaved edits, kept per spec id while the app is open.
 *
 * The effect below re-primes every field when another spec is selected. Without
 * this it overwrote whatever you had typed and there was no warning, no dirty
 * marker and no undo: click another card mid-sentence and the sentence was
 * gone. Rather than block the switch with a dialog, the draft travels with the
 * spec — switch away and back and your text is still there.
 *
 * Module scope, not the store: this is transient UI state that must not be
 * persisted, replayed by undo, or shipped over the wire.
 */
type SectionDraft = {
  story: string;
  scenarios: string[];
  criteria: string[];
  requirements: string[];
  properties: string[];
  successCriteria: string[];
  outOfScope: string;
};
const drafts = new Map<string, SectionDraft>();

/** Exposed so a workspace switch can drop drafts that belong to another project. */
export function clearSectionDrafts(): void {
  drafts.clear();
}

export function SectionEditor({ specId, specMarkdown, onSaved }: Props) {
  const { t, lang } = useT();
  const parsed = useMemo(() => parseSpecSections(specMarkdown), [specMarkdown]);

  const [story, setStory] = useState(parsed.story);
  const [scenarios, setScenarios] = useState<string[]>(parsed.scenarios);
  const [criteria, setCriteria] = useState<string[]>(parsed.criteria);
  const [requirements, setRequirements] = useState<string[]>(parsed.requirements);
  const [properties, setProperties] = useState<string[]>(parsed.properties);
  const [successCriteria, setSuccessCriteria] = useState<string[]>(parsed.successCriteria);
  const [outOfScope, setOutOfScope] = useState(parsed.outOfScope);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const earsPrefix = lang === "es" ? EARS_PREFIX_ES : EARS_PREFIX_EN;
  const earsPlaceholder = lang === "es" ? EARS_PLACEHOLDER_ES : EARS_PLACEHOLDER_EN;

  // Re-prime the form when another spec is selected — WITHOUT discarding what
  // was typed. The outgoing draft is stashed under its own spec id first.
  const previousSpecId = useRef(specId);
  const current = { story, scenarios, criteria, requirements, properties, successCriteria, outOfScope };
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    const leaving = previousSpecId.current;
    if (leaving && leaving !== specId) {
      drafts.set(leaving, currentRef.current);
    }
    previousSpecId.current = specId;

    const restored = drafts.get(specId);
    const next = restored ?? {
      story: parsed.story,
      scenarios: parsed.scenarios,
      criteria: parsed.criteria,
      requirements: parsed.requirements,
      properties: parsed.properties,
      successCriteria: parsed.successCriteria,
      outOfScope: parsed.outOfScope
    };
    setStory(next.story);
    setScenarios(next.scenarios);
    setCriteria(next.criteria);
    setRequirements(next.requirements);
    setProperties(next.properties);
    setSuccessCriteria(next.successCriteria);
    setOutOfScope(next.outOfScope);
    setError(null);
    setSavedNote(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specId]);

  const save = async () => {
    if (busy) return;
    const cleanList = (items: string[]) => items.map((item) => item.trim()).filter(Boolean);
    const cleanScenarios = cleanList(scenarios);
    const cleanCriteria = cleanList(criteria).filter(
      (c) => c !== EARS_PREFIX_ES.trim() && c !== EARS_PREFIX_EN.trim()
    );
    const cleanRequirements = cleanList(requirements);
    const cleanProperties = cleanList(properties);
    const cleanSuccess = cleanList(successCriteria);

    // Send a section when it has content now, or had a heading before
    // (so clearing an existing section is possible); never create empty ones.
    const payload: SpecSectionsInput = {};
    if (story.trim() || parsed.present.story) payload.story = story.trim();
    if (cleanScenarios.length > 0 || parsed.present.scenarios) payload.scenarios = cleanScenarios;
    if (cleanCriteria.length > 0 || parsed.present.criteria) payload.criteria = cleanCriteria;
    if (cleanRequirements.length > 0 || parsed.present.requirements) payload.requirements = cleanRequirements;
    if (cleanProperties.length > 0 || parsed.present.properties) payload.properties = cleanProperties;
    if (cleanSuccess.length > 0 || parsed.present.successCriteria) payload.successCriteria = cleanSuccess;
    if (outOfScope.trim() || parsed.present.outOfScope) payload.outOfScope = outOfScope.trim();
    if (Object.keys(payload).length === 0) {
      setError(t("editor.atLeastOne"));
      return;
    }

    setBusy(true);
    setError(null);
    setSavedNote(null);
    try {
      const result = await api.putSections(specId, payload);
      const touched = [...result.updated, ...result.created];
      setSavedNote(
        touched.length === 1 ? t("editor.saved.one") : t("editor.saved.many", { n: touched.length })
      );
      drafts.delete(specId);
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const sectionCount = (items: string[]) => {
    const n = items.filter((item) => item.trim()).length;
    return n > 0 ? ` (${n})` : "";
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      <p className="m-0 text-xs text-muted-foreground">{t("editor.note")}</p>
      <Accordion type="multiple" defaultValue={["story", "criteria"]} className="w-full">
        <AccordionItem value="story">
          <AccordionTrigger className="py-2.5 text-sm">{t("editor.story")}</AccordionTrigger>
          <AccordionContent className="pb-3">
            <textarea
              className={inputClass + " resize-y"}
              value={story}
              rows={3}
              placeholder={t("editor.story.ph")}
              onChange={(e) => setStory(e.target.value)}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="scenarios">
          <AccordionTrigger className="py-2.5 text-sm">
            {t("editor.scenarios")}
            {sectionCount(scenarios)}
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <ListEditor
              items={scenarios}
              onChange={setScenarios}
              placeholder={t("editor.scenarios.ph")}
              addLabel={t("editor.scenarios.add")}
              t={t}
              earsPrefix={earsPrefix}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="criteria">
          <AccordionTrigger className="py-2.5 text-sm">
            {t("editor.criteria")}
            {sectionCount(criteria)}
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2 pb-3">
            {/* The pattern in one line + the "why it maps to a test" behind ?. */}
            <p className="m-0 flex items-start gap-1.5 text-xs text-muted-foreground">
              <span className="min-w-0 flex-1">{t("ears.pattern")}</span>
              <HelpHint topic="ears" guide="ears" />
            </p>
            <ListEditor
              items={criteria}
              onChange={setCriteria}
              placeholder={earsPlaceholder}
              addLabel={t("editor.criteria.add")}
              earsAutocomplete
              earsLint
              t={t}
              earsPrefix={earsPrefix}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="requirements">
          <AccordionTrigger className="py-2.5 text-sm">
            {t("editor.requirements")}
            {sectionCount(requirements)}
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <ListEditor
              items={requirements}
              onChange={setRequirements}
              placeholder={t("editor.requirements.ph")}
              addLabel={t("editor.requirements.add")}
              t={t}
              earsPrefix={earsPrefix}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="properties">
          <AccordionTrigger className="py-2.5 text-sm">
            {t("editor.properties")}
            {sectionCount(properties)}
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2 pb-3">
            <p className="m-0 text-xs text-muted-foreground">{t("editor.properties.hint")}</p>
            <ListEditor
              items={properties}
              onChange={setProperties}
              placeholder={t("editor.properties.ph")}
              addLabel={t("editor.properties.add")}
              t={t}
              earsPrefix={earsPrefix}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="success">
          <AccordionTrigger className="py-2.5 text-sm">
            {t("editor.success")}
            {sectionCount(successCriteria)}
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <ListEditor
              items={successCriteria}
              onChange={setSuccessCriteria}
              placeholder={t("editor.success.ph")}
              addLabel={t("editor.success.add")}
              t={t}
              earsPrefix={earsPrefix}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="outOfScope">
          <AccordionTrigger className="py-2.5 text-sm">{t("editor.outOfScope")}</AccordionTrigger>
          <AccordionContent className="pb-3">
            <textarea
              className={inputClass + " resize-y"}
              value={outOfScope}
              rows={2}
              placeholder={t("editor.outOfScope.ph")}
              onChange={(e) => setOutOfScope(e.target.value)}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {error ? (
        <p className="m-0 rounded-md bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
          ⚠ {error}
        </p>
      ) : null}
      {savedNote ? (
        <p className="m-0 rounded-md bg-[var(--primary-soft)] px-3 py-2 text-sm text-primary">
          ✓ {savedNote}
        </p>
      ) : null}
      <Button onClick={() => void save()} disabled={busy}>
        {busy ? t("editor.saving") : t("editor.save")}
      </Button>
    </div>
  );
}
