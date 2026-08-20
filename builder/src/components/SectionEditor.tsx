// Full guided spec.md editor (spec 007, R5 → spec 010, R2 → spec 030).
// One form per template section in an ordered accordion, prefilled from the
// current document. Saving calls PUT /api/spec/:id/sections, whose surgical
// replace lives in sdd-core — the rest of spec.md (the approval block
// included) is never touched.
//
// Spec 030: EARS lint rows get a 3px colored spine and the reason names the
// vague word; the save button moves to a fixed bottom bar with a dirty count.

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { api, errorMessage } from "../api";
import { AiAssistButton } from "./AiAssistButton";
import { lintEarsCriterion } from "../ears";
import { docsUrl } from "../help";
import { useT, type TFunction } from "../i18n";
import { parseSpecSections } from "../sections";
import { buildSpecContext } from "../speccontext";
import { useBuilderStore } from "../store";
import type { SpecSectionsInput } from "../types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const EARS_PREFIX_ES = "CUANDO ";
const EARS_PREFIX_EN = "WHEN ";
const EARS_PLACEHOLDER_ES = "CUANDO ... EL SISTEMA DEBERÁ ...";
const EARS_PLACEHOLDER_EN = "WHEN ... THE SYSTEM SHALL ...";

interface Props {
  specId: string;
  /** Current spec.md content (from the sheet's loaded detail). */
  specMarkdown: string;
  /** Current plan.md, same source (spec 039): background for the AI drafts. */
  planMarkdown?: string;
  onSaved: () => void;
}

const inputClass =
  "w-full rounded-[7px] border border-input bg-muted/50 px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40";

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
  const iconBtn = "size-[26px] shrink-0";
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => {
        // Skip the lint on untouched rows (empty or the freshly autocompleted prefix).
        const value = item.trim();
        const lint =
          earsLint && value !== "" && value !== earsPrefix.trim() ? lintEarsCriterion(item) : null;
        const spine =
          lint == null ? null : lint.level === "ok" ? "bg-primary" : "bg-[var(--amber)]";
        const hints: string[] = [];
        if (lint && lint.vagueWords.length > 0) {
          // Nombra la palabra en lugar de citar la regla (spec 030).
          hints.push(t("drawer.ears.vague", { words: lint.vagueWords.join("», «") }));
        } else if (lint && !lint.matchesPattern) {
          hints.push(t("ears.pattern"));
        }
        return (
          // Index keys are fine here: rows are only appended/removed/swapped in place.
          <div className="flex flex-col gap-1" key={index}>
            <div className="flex items-center gap-1.5">
              {spine ? (
                <span className={`w-[3px] self-stretch rounded-[2px] ${spine}`} aria-hidden />
              ) : null}
              <input
                value={item}
                className={inputClass + (earsLint ? " font-mono text-xs" : "")}
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
                className={iconBtn}
                aria-label={t("common.moveUp")}
                title={t("common.moveUp")}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ChevronUp className="size-[13px]" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={iconBtn}
                aria-label={t("common.moveDown")}
                title={t("common.moveDown")}
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                <ChevronDown className="size-[13px]" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={iconBtn}
                aria-label={t("common.remove")}
                title={t("common.remove")}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <X className="size-[13px]" />
              </Button>
            </div>
            {hints.length > 0 ? (
              <p className="m-0 text-[12.5px] leading-[1.5] text-[var(--amber-text)]">
                {hints.join(" · ")}
              </p>
            ) : null}
          </div>
        );
      })}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 self-start border-dashed"
        onClick={() => onChange([...items, ""])}
      >
        <Plus className="size-3" />
        {addLabel}
      </Button>
    </div>
  );
}

/**
 * Unsaved edits, kept per spec id while the app is open. The draft travels
 * with the spec — switch away and back and your text is still there.
 * Module scope, not the store: transient UI state that must not be persisted,
 * replayed by undo, or shipped over the wire.
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

export function SectionEditor({ specId, specMarkdown, planMarkdown, onSaved }: Props) {
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
  /** Secciones desplegadas. Controlado desde la spec 036 (R9): un hallazgo de
   *  la revisión tiene que poder abrir la suya. */
  const [openSections, setOpenSections] = useState<string[]>(["story", "criteria"]);

  const aiPrefill = useBuilderStore((s) => s.aiPrefill);
  useEffect(() => {
    if (!aiPrefill || aiPrefill.specId !== specId) return;
    setOpenSections((prev) => (prev.includes(aiPrefill.refId) ? prev : [...prev, aiPrefill.refId]));
  }, [aiPrefill, specId]);

  const earsPrefix = lang === "es" ? EARS_PREFIX_ES : EARS_PREFIX_EN;
  const earsPlaceholder = lang === "es" ? EARS_PLACEHOLDER_ES : EARS_PLACEHOLDER_EN;

  // Re-prime the form when another spec is selected — WITHOUT discarding what
  // was typed. The outgoing draft is stashed under its own spec id first.
  const previousSpecId = useRef(specId);
  const current = { story, scenarios, criteria, requirements, properties, successCriteria, outOfScope };
  const currentRef = useRef(current);
  currentRef.current = current;

  const primeFrom = (next: SectionDraft) => {
    setStory(next.story);
    setScenarios(next.scenarios);
    setCriteria(next.criteria);
    setRequirements(next.requirements);
    setProperties(next.properties);
    setSuccessCriteria(next.successCriteria);
    setOutOfScope(next.outOfScope);
  };

  useEffect(() => {
    const leaving = previousSpecId.current;
    if (leaving && leaving !== specId) {
      drafts.set(leaving, currentRef.current);
    }
    previousSpecId.current = specId;

    primeFrom(
      drafts.get(specId) ?? {
        story: parsed.story,
        scenarios: parsed.scenarios,
        criteria: parsed.criteria,
        requirements: parsed.requirements,
        properties: parsed.properties,
        successCriteria: parsed.successCriteria,
        outOfScope: parsed.outOfScope
      }
    );
    setError(null);
    setSavedNote(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specId]);

  // Cuántas secciones difieren de lo parseado: alimenta la barra inferior.
  const cleanList = (items: string[]) => items.map((item) => item.trim()).filter(Boolean);
  const dirtyCount = useMemo(() => {
    let n = 0;
    if (story.trim() !== parsed.story.trim()) n++;
    const listChanged = (a: string[], b: string[]) =>
      JSON.stringify(cleanList(a)) !== JSON.stringify(cleanList(b));
    if (listChanged(scenarios, parsed.scenarios)) n++;
    if (listChanged(criteria, parsed.criteria)) n++;
    if (listChanged(requirements, parsed.requirements)) n++;
    if (listChanged(properties, parsed.properties)) n++;
    if (listChanged(successCriteria, parsed.successCriteria)) n++;
    if (outOfScope.trim() !== parsed.outOfScope.trim()) n++;
    return n;
  }, [story, scenarios, criteria, requirements, properties, successCriteria, outOfScope, parsed]);

  const discard = () => {
    drafts.delete(specId);
    primeFrom({
      story: parsed.story,
      scenarios: parsed.scenarios,
      criteria: parsed.criteria,
      requirements: parsed.requirements,
      properties: parsed.properties,
      successCriteria: parsed.successCriteria,
      outOfScope: parsed.outOfScope
    });
    setError(null);
    setSavedNote(null);
  };

  const save = async () => {
    if (busy) return;
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

  // --- Ampliar con IA por sección (spec 031, R4) ---------------------------
  // Accepting a proposal writes ONLY that section through the existing
  // sections route, and mirrors it into the local draft so the form agrees
  // with the disk.
  const listFromProposal = (proposal: string): string[] =>
    proposal
      .split("\n")
      .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
      .filter(Boolean);

  const aiText = (refId: string, current: string, setLocal: (v: string) => void, key: "story" | "outOfScope") => (
    <div className="flex justify-end">
      <AiAssistButton
        kind="section"
        specId={specId}
        refId={refId}
        currentText={current}
        context={buildSpecContext({ specMarkdown, planMarkdown, exclude: key })}
        onAccept={async (proposal) => {
          const value = proposal.trim();
          setLocal(value);
          await api.putSections(specId, { [key]: value });
          onSaved();
        }}
      />
    </div>
  );

  const aiList = (
    refId: string,
    current: string[],
    setLocal: (v: string[]) => void,
    key: "scenarios" | "criteria" | "requirements" | "properties" | "successCriteria"
  ) => (
    <div className="flex justify-end">
      <AiAssistButton
        kind="section"
        specId={specId}
        refId={refId}
        currentText={cleanList(current).join("\n")}
        context={buildSpecContext({ specMarkdown, planMarkdown, exclude: key })}
        onAccept={async (proposal) => {
          const items = listFromProposal(proposal);
          setLocal(items);
          await api.putSections(specId, { [key]: items });
          onSaved();
        }}
      />
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScrollArea className="min-h-0 flex-1 px-4">
        <div className="flex flex-col gap-3 pt-3 pb-3 pr-3">
          <p className="m-0 text-[13px] leading-[1.55] text-muted-foreground">
            {t("drawer.sections.intro")}
          </p>
          <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="w-full">
            <AccordionItem value="story">
              <AccordionTrigger className="py-2.5 text-sm">{t("editor.story")}</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-1.5 pb-3">
                {aiText("story", story, setStory, "story")}
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
              <AccordionContent className="flex flex-col gap-1.5 pb-3">
                {aiList("scenarios", scenarios, setScenarios, "scenarios")}
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
                {/* Recordatorio del patrón en una fila, con la guía a un clic. */}
                <p className="m-0 flex items-center gap-2 rounded-[7px] border bg-muted p-[8px_11px]">
                  <span className="min-w-0 flex-1 font-mono text-[11.5px]">
                    {lang === "es"
                      ? "CUANDO/SI/MIENTRAS … EL SISTEMA DEBERÁ …"
                      : "WHEN/IF/WHILE … THE SYSTEM SHALL …"}
                  </span>
                  <a
                    className="shrink-0 text-xs font-semibold text-[var(--blue)] hover:underline"
                    href={docsUrl("ears", lang)}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {t("drawer.ears.what")}
                  </a>
                </p>
                {aiList("criteria", criteria, setCriteria, "criteria")}
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
              <AccordionContent className="flex flex-col gap-1.5 pb-3">
                {aiList("requirements", requirements, setRequirements, "requirements")}
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
                {aiList("properties", properties, setProperties, "properties")}
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
              <AccordionContent className="flex flex-col gap-1.5 pb-3">
                {aiList("successCriteria", successCriteria, setSuccessCriteria, "successCriteria")}
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
              <AccordionContent className="flex flex-col gap-1.5 pb-3">
                {aiText("outOfScope", outOfScope, setOutOfScope, "outOfScope")}
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
            <p className="m-0 rounded-[7px] bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {savedNote ? (
            <p className="m-0 rounded-[7px] bg-[var(--primary-soft)] px-3 py-2 text-sm text-primary">
              ✓ {savedNote}
            </p>
          ) : null}
        </div>
      </ScrollArea>
      {/* Barra inferior fija (spec 030): el guardado ya no se esconde al final
          del scroll. */}
      <div className="flex shrink-0 items-center gap-2.5 border-t bg-muted p-[12px_16px]">
        <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-muted-foreground">
          {t("drawer.sections.dirty", { n: dirtyCount })}
        </span>
        <Button variant="outline" size="sm" onClick={discard} disabled={busy || dirtyCount === 0}>
          {t("drawer.sections.discard")}
        </Button>
        <Button size="sm" onClick={() => void save()} disabled={busy}>
          {busy ? t("editor.saving") : t("drawer.sections.save")}
        </Button>
      </div>
    </div>
  );
}
