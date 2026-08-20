import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

// forwardRef obligatorio en React 18: Radix compone estas refs vía Slot/Presence.
// El porqué largo está en button.tsx. El trigger es además el ancla del Popper:
// sin ref el contenido no sabe dónde colocarse. Root no pinta DOM: no lleva ref.

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

const PopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(function PopoverTrigger({ ...props }, ref) {
  return (
    <PopoverPrimitive.Trigger ref={ref} data-slot="popover-trigger" {...props} />
  )
})

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(function PopoverContent(
  { className, align = "start", sideOffset = 6, children, ...props },
  ref
) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(
          "z-50 w-72 origin-(--radix-popover-content-transform-origin) animate-in rounded-lg border bg-popover p-3.5 text-popover-foreground shadow-md outline-none fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  )
})

const PopoverAnchor = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Anchor>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Anchor>
>(function PopoverAnchor({ ...props }, ref) {
  return (
    <PopoverPrimitive.Anchor ref={ref} data-slot="popover-anchor" {...props} />
  )
})

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
