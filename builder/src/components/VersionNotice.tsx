// Spec 029, R5 — el desfase de versión, visible en el lienzo.
//
// El marcador `.sdd/TEMPLATE_VERSION` existía desde siempre y nadie lo leía:
// un proyecto instalado seis releases atrás validaba contra una política
// vieja sin un solo aviso. Esta franja lo dice, con el comando al lado.
//
// Solo avisa: actualizar es un comando que ejecuta la persona. La spec pide
// aviso, no autonomía.

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { api } from "../api";
import { useT } from "../i18n";
import { CommandRow } from "./CommandRow";
import { Button } from "@/components/ui/button";
import type { VersionInfo } from "../types";

/** Se recuerda por versión: si mañana hay otra, vuelve a avisar. */
const DISMISSED_KEY = "sdd-builder-version-notice-dismissed";

export function VersionNotice() {
  const { t } = useT();
  const [info, setInfo] = useState<VersionInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .getVersionInfo()
      .then((data) => {
        if (!alive) return;
        setInfo(data);
        try {
          setDismissed(localStorage.getItem(DISMISSED_KEY) === data.serverVersion);
        } catch {
          // Modo privado: simplemente se vuelve a mostrar.
        }
      })
      .catch(() => {
        // Un servidor anterior a esta ruta no tiene desfase que contar.
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!info || info.upToDate || dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, info.serverVersion);
    } catch {
      // No pasa nada: reaparecerá en la próxima carga.
    }
    setDismissed(true);
  };

  const outdated = info.templateVersion !== null && info.templateVersion !== info.serverVersion;
  const detail = outdated
    ? t("version.behind", { installed: info.templateVersion ?? "?", server: info.serverVersion })
    : t("version.driftOnly", { server: info.serverVersion });

  const counts: string[] = [];
  if (info.staleFramework.length > 0) counts.push(t("version.stale", { n: info.staleFramework.length }));
  if (info.missing.length > 0) counts.push(t("version.missing", { n: info.missing.length }));
  if (info.divergedPreserved.length > 0) counts.push(t("version.yours", { n: info.divergedPreserved.length }));

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-[var(--amber)]/40 bg-[var(--amber-soft)] px-4 py-2.5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-[15px] shrink-0 text-[var(--amber-text)]" aria-hidden />
        <span className="text-[13px] font-semibold text-[var(--amber-text)]">{detail}</span>
        <Button
          size="icon"
          variant="ghost"
          className="ml-auto size-6"
          aria-label={t("common.close")}
          onClick={dismiss}
        >
          <X className="size-[13px]" />
        </Button>
      </div>
      {counts.length > 0 ? (
        <p className="m-0 pl-[23px] font-mono text-[11.5px] text-[var(--amber-text)]">{counts.join(" · ")}</p>
      ) : null}
      <div className="pl-[23px]">
        <CommandRow command={info.command} />
      </div>
      <p className="m-0 pl-[23px] text-[11.5px] text-muted-foreground">{t("version.safe")}</p>
    </div>
  );
}
