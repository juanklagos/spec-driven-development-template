// Teaching layer: contextual "?" help next to the concept it explains.
//
// The template is a school as much as a tool, so every SDD concept the UI shows
// must be explainable in place — without leaving for a guide first. Rules:
//   - icon-only, quiet, and only next to section headings / status badges;
//   - one language at a time (spec 010): strings come from i18n, never inline;
//   - every hint ends in a link to the guide that covers the concept in full
//     (help.ts → sdd-core DOC_GUIDES), so curiosity has somewhere to go.
//
// A topic renders `help.<topic>.title` + `help.<topic>.body`; `extra` carries
// live, state-dependent teaching (what the gate is actually missing right now).

import type { ReactNode } from "react";
import { CircleHelp } from "lucide-react";
import { docsUrl, type DocGuide } from "../help";
import { useT } from "../i18n";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface HelpHintProps {
  /** Dictionary prefix: `help.<topic>.title` and `help.<topic>.body`. */
  topic: string;
  /** Guide the "full guide →" link opens. */
  guide: DocGuide;
  /** Optional live detail rendered between the body and the link. */
  extra?: ReactNode;
  className?: string;
}

export function HelpHint({ topic, guide, extra, className }: HelpHintProps) {
  const { t, lang } = useT();
  const title = t(`help.${topic}.title`);
  return (
    <Popover>
      <PopoverTrigger
        className={`inline-flex size-4 shrink-0 cursor-help items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-primary focus-visible:text-primary ${className ?? ""}`}
        aria-label={t("help.aria", { topic: title })}
        title={t("help.aria", { topic: title })}
        onClick={(e) => e.stopPropagation()}
      >
        <CircleHelp size={14} aria-hidden />
      </PopoverTrigger>
      <PopoverContent className="text-sm" onClick={(e) => e.stopPropagation()}>
        <p className="m-0 mb-1.5 font-semibold">{title}</p>
        <p className="m-0 text-xs leading-relaxed text-muted-foreground">{t(`help.${topic}.body`)}</p>
        {extra}
        <a
          className="mt-2.5 inline-block text-xs font-semibold text-[var(--blue)] hover:underline"
          href={docsUrl(guide, lang)}
          target="_blank"
          rel="noreferrer noopener"
        >
          {t("help.learnMore")}
        </a>
      </PopoverContent>
    </Popover>
  );
}
