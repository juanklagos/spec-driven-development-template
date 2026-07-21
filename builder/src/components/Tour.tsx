// Welcome tour (spec 007, R3): five anchored steps with a homemade overlay —
// a highlight ring around the target (data-tour attributes) plus a tooltip
// card. No dependency; dismissable and re-launchable from the "?" button.
// Localized (one language at a time) since spec 010, R1.

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useT } from "../i18n";
import { useBuilderStore } from "../store";
import { Button } from "@/components/ui/button";

interface TourStep {
  target: string;
  titleKey: string;
  bodyKey: string;
}

const STEPS: TourStep[] = [
  { target: "palette", titleKey: "tour.1.title", bodyKey: "tour.1.body" },
  { target: "palette-spec", titleKey: "tour.2.title", bodyKey: "tour.2.body" },
  { target: "canvas", titleKey: "tour.3.title", bodyKey: "tour.3.body" },
  { target: "canvas", titleKey: "tour.4.title", bodyKey: "tour.4.body" },
  { target: "gate", titleKey: "tour.5.title", bodyKey: "tour.5.body" }
];

const RING_PADDING = 6;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function targetRect(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

export function Tour() {
  const { t } = useT();
  const closeTour = useBuilderStore((s) => s.closeTour);
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);

  const current = STEPS[step];

  const measure = useCallback(() => {
    setRect(targetRect(current.target));
  }, [current.target]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTour(dontShowAgain);
      if (e.key === "ArrowRight" && step < STEPS.length - 1) setStep(step + 1);
      if (e.key === "ArrowLeft" && step > 0) setStep(step - 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeTour, dontShowAgain, step]);

  const isLast = step === STEPS.length - 1;

  // Tooltip placement: to the right of narrow targets, below wide ones,
  // clamped to the viewport.
  const cardStyle: React.CSSProperties = {};
  if (rect) {
    const preferRight = rect.width < 420 && rect.left + rect.width + 340 < window.innerWidth;
    if (preferRight) {
      cardStyle.left = rect.left + rect.width + 18;
      cardStyle.top = Math.min(Math.max(12, rect.top), window.innerHeight - 240);
    } else {
      cardStyle.left = Math.min(Math.max(12, rect.left + rect.width / 2 - 160), window.innerWidth - 340);
      const below = rect.top + rect.height + 16;
      cardStyle.top = below + 220 < window.innerHeight ? below : Math.max(12, rect.top - 236);
    }
  } else {
    cardStyle.left = "50%";
    cardStyle.top = "40%";
    cardStyle.transform = "translate(-50%, -50%)";
  }

  return (
    <div className="tour-layer" role="dialog" aria-label={t("tour.aria")}>
      {rect ? (
        <div
          className="tour-ring"
          style={{
            top: rect.top - RING_PADDING,
            left: rect.left - RING_PADDING,
            width: rect.width + RING_PADDING * 2,
            height: rect.height + RING_PADDING * 2
          }}
        />
      ) : (
        <div className="tour-backdrop" />
      )}
      <div className="tour-card" style={cardStyle}>
        <header className="flex items-center justify-between gap-2">
          <strong>{t(current.titleKey)}</strong>
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            onClick={() => closeTour(dontShowAgain)}
            aria-label={t("tour.close")}
          >
            <X />
          </Button>
        </header>
        <p className="m-0 text-sm text-muted-foreground">{t(current.bodyKey)}</p>
        <div className="flex gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <span
              key={`${s.target}-${i}`}
              className={`size-[7px] rounded-full ${i === step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            className="accent-[var(--primary)]"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />
          {t("tour.dontShow")}
        </label>
        <div className="flex justify-between gap-2">
          <Button size="sm" variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
            {t("tour.back")}
          </Button>
          {isLast ? (
            <Button size="sm" onClick={() => closeTour(dontShowAgain)}>
              {t("tour.finish")}
            </Button>
          ) : (
            <Button size="sm" onClick={() => setStep(step + 1)}>
              {t("tour.next")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
