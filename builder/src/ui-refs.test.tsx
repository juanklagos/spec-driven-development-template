// @vitest-environment jsdom
//
// Guarda de regresión para el defecto que arregló d4e2060: los componentes que
// shadcn vende hoy son funciones planas, sin `React.forwardRef`, porque asumen
// React 19 (donde `ref` viaja como una prop más). Este proyecto va con React 18
// y ahí la ref se cae en silencio: Radix la usa para anclar el Popper, mover el
// foco y bloquear el scroll. Si alguien vuelve a vendorizar `ui/` con
// `npx shadcn add`, este test se pone rojo antes de que el menú vuelva a
// abrirse fuera de pantalla.
//
// El montaje abre a la vez todas las superficies (portal, popper, overlay) y
// falla ante cualquier `console.error` de React, no solo el aviso de refs.
import { describe, expect, it, vi } from "vitest"
import * as React from "react"
import { createRoot } from "react-dom/client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

globalThis.IS_REACT_ACT_ENVIRONMENT = true

// jsdom no trae lo que Radix necesita para medir anclas y mover el foco.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver
Element.prototype.scrollIntoView ??= () => {}
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.releasePointerCapture ??= () => {}

function EveryOpenSurface() {
  return (
    <TooltipProvider>
      <Badge asChild>
        <a href="#badge">badge</a>
      </Badge>
      <Separator />
      <ScrollArea>
        <p>scroll</p>
      </ScrollArea>
      <Accordion type="single" collapsible defaultValue="a">
        <AccordionItem value="a">
          <AccordionTrigger>trigger</AccordionTrigger>
          <AccordionContent>content</AccordionContent>
        </AccordionItem>
      </Accordion>
      <Tabs defaultValue="one">
        <TabsList>
          <TabsTrigger value="one">one</TabsTrigger>
        </TabsList>
        <TabsContent value="one">tab content</TabsContent>
      </Tabs>
      <Tooltip open>
        <TooltipTrigger>tip</TooltipTrigger>
        <TooltipContent>tip body</TooltipContent>
      </Tooltip>
      <Popover open>
        <PopoverTrigger>pop</PopoverTrigger>
        <PopoverContent>pop body</PopoverContent>
      </Popover>
      <Select open defaultValue="v1">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="v1">v1</SelectItem>
        </SelectContent>
      </Select>
      <Dialog open>
        <DialogContent>
          <DialogTitle>dialog</DialogTitle>
          <DialogDescription>desc</DialogDescription>
        </DialogContent>
      </Dialog>
      <Sheet open>
        <SheetContent>
          <SheetTitle>sheet</SheetTitle>
          <SheetDescription>desc</SheetDescription>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}

describe("componentes ui bajo React 18", () => {
  it("monta todas las superficies sin avisos de React", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const host = document.createElement("div")
    document.body.appendChild(host)
    const root = createRoot(host)

    React.act(() => {
      root.render(<EveryOpenSurface />)
    })
    React.act(() => {
      root.unmount()
    })

    const messages = spy.mock.calls.map((call) => call.map(String).join(" "))
    spy.mockRestore()
    host.remove()

    expect(messages).toEqual([])
  })
})
