// Shared copy-first prompt box (spec 008, R1/R2): read-only textarea + a
// "Copy prompt" button with honest feedback. When the Clipboard API is
// unavailable (restricted embeds, old browsers) the text is left selected
// and the button says so, so a manual ⌘C/Ctrl+C always works.

import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n";
import { copyToClipboard } from "../prompts";
import { Button } from "@/components/ui/button";

type CopyState = "idle" | "copied" | "manual";

const COPY_KEYS: Record<CopyState, string> = {
  idle: "prompt.copy",
  copied: "prompt.copied",
  manual: "prompt.manual"
};

interface Props {
  prompt: string;
  rows?: number;
}

export function PromptBox({ prompt, rows = 10 }: Props) {
  const { t } = useT();
  const [state, setState] = useState<CopyState>("idle");
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const copy = async () => {
    const ok = await copyToClipboard(prompt);
    if (!ok) {
      // Leave the text selected so the user can copy it by hand.
      areaRef.current?.focus();
      areaRef.current?.select();
    }
    setState(ok ? "copied" : "manual");
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setState("idle"), ok ? 2000 : 4000);
  };

  return (
    <div className="flex flex-col gap-2">
      <textarea
        ref={areaRef}
        readOnly
        rows={rows}
        value={prompt}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full resize-y rounded-md border bg-muted px-3 py-2 font-mono text-xs leading-relaxed outline-none"
      />
      <Button size="sm" className="self-start" onClick={() => void copy()}>
        {t(COPY_KEYS[state])}
      </Button>
    </div>
  );
}
