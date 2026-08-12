// Fila de comando copiable. Vivía dentro de App.tsx (estado vacío + pantalla
// sin conexión); la spec 032 la necesita también en el panel "Conectar
// agente", así que se extrae tal cual — mismo aspecto, mismo feedback.

import { Clipboard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  command: string;
  /** Bloques de varias líneas (JSON/TOML de configuración) no se truncan. */
  multiline?: boolean;
}

export function CommandRow({ command, multiline }: Props) {
  const copy = () => {
    void navigator.clipboard
      .writeText(command)
      .then(() => toast("✓"))
      .catch(() => toast(command));
  };
  return (
    <div className="flex items-start gap-2 rounded-[7px] border bg-muted p-[9px_11px]">
      <code
        className={
          "min-w-0 flex-1 bg-transparent p-0 font-mono text-[12.5px] " +
          (multiline ? "whitespace-pre-wrap" : "truncate")
        }
      >
        {command}
      </code>
      <Button size="sm" variant="outline" className="h-6 shrink-0 px-2 text-xs" onClick={copy}>
        <Clipboard className="size-3" />
      </Button>
    </div>
  );
}
