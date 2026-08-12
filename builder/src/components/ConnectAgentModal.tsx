// Spec 032, R10 — "Conectar agente". Un usuario que ve "sin agente" en un
// botón de IA necesita saber QUÉ ejecutar, no leerse una guía. Este panel da
// el comando automático arriba y, por si su cliente no está o prefiere
// hacerlo a mano, la config exacta de cada uno debajo.
//
// El catálogo NO se duplica aquí: llega de GET /api/connect, que lo sirve
// desde el mismo módulo del núcleo que escribe el CLI. Si mañana cambia la
// ruta de config de un cliente, cambia en un sitio y este panel la refleja.

import { useEffect, useState } from "react";
import { Plug, X } from "lucide-react";
import { api, errorMessage } from "../api";
import { useT } from "../i18n";
import { CommandRow } from "./CommandRow";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ConnectInfo } from "../types";

export function ConnectAgentModal({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const [info, setInfo] = useState<ConnectInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .getConnectInfo()
      .then((data) => {
        if (!alive) return;
        setInfo(data);
        setSelected(data.clients[0]?.id ?? null);
      })
      .catch((err) => alive && setError(errorMessage(err)));
    return () => {
      alive = false;
    };
  }, []);

  const client = info?.clients.find((c) => c.id === selected) ?? null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[720px]" showCloseButton={false}>
        <div className="flex h-[38px] items-center gap-2 border-b bg-muted px-4">
          <Plug className="size-[15px] text-primary" aria-hidden />
          <span className="font-mono text-[11.5px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {t("connect.tag")}
          </span>
          <Button size="icon" variant="ghost" className="ml-auto size-6" aria-label={t("common.close")} onClick={onClose}>
            <X className="size-[13px]" />
          </Button>
        </div>

        <div className="flex flex-col gap-3.5 p-5">
          <DialogTitle className="text-[20px] leading-tight font-semibold tracking-[-0.015em]">
            {t("connect.title")}
          </DialogTitle>
          <DialogDescription className="m-0 text-sm text-muted-foreground">
            {t("connect.body")}
          </DialogDescription>

          {error ? (
            <p className="m-0 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">{error}</p>
          ) : null}

          {info ? (
            <>
              {/* Paso 1: el comando que lo hace todo. */}
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  {t("connect.step1")}
                </span>
                <CommandRow command={`${info.command} --project-root ${info.projectRoot}`} />
                <p className="m-0 text-xs text-muted-foreground">{t("connect.step1.hint")}</p>
              </div>

              {/* Paso 2: cómo se atiende la cola en cada cliente. */}
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  {t("connect.step2")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {info.clients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c.id)}
                      className={
                        "cursor-pointer rounded-[6px] border px-2.5 py-1 font-mono text-[11.5px] transition-colors " +
                        (c.id === selected
                          ? "border-primary/50 bg-[var(--primary-soft)] text-[var(--primary-text)]"
                          : "hover:border-primary/40")
                      }
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                {client ? (
                  <div className="flex flex-col gap-1.5 pt-1">
                    <CommandRow command={client.serveHint} />
                    <p className="m-0 text-xs text-muted-foreground">
                      {t("connect.manual", { file: client.configFile })}
                    </p>
                    <CommandRow command={client.snippet} multiline />
                  </div>
                ) : null}
              </div>

              <p className="m-0 rounded-lg border bg-muted p-[10px_12px] text-xs leading-relaxed text-muted-foreground">
                {t("connect.footer")}
              </p>
            </>
          ) : !error ? (
            <p className="m-0 text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
