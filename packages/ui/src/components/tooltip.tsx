"use client";

import { forwardRef } from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "../lib/cn";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

/** Tooltip content (03_DRD §4.4). Wrap the app in a single TooltipProvider. */
export const TooltipContent = forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(function TooltipContent({ className, sideOffset = 6, children, ...props }, ref) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "border-border bg-overlay text-caption text-fg shadow-e2 z-50 max-w-64 rounded-md border px-2.5 py-1.5",
          "data-[state=delayed-open]:animate-slide-up-fade data-[state=instant-open]:animate-slide-up-fade",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-[var(--bg-overlay)]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});

export interface SimpleTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
}

/** Convenience wrapper: `<SimpleTooltip content="…">{trigger}</SimpleTooltip>`. */
export function SimpleTooltip({
  content,
  children,
  side = "top",
  delayDuration = 400,
}: SimpleTooltipProps) {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </Tooltip>
  );
}
