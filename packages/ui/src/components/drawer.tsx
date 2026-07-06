"use client";

import { forwardRef } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerPortal = DialogPrimitive.Portal;

export const DrawerOverlay = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DrawerOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "bg-scrim data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50",
        className,
      )}
      {...props}
    />
  );
});

const SIDE = {
  right:
    "inset-y-0 right-0 h-full w-[400px] max-w-[calc(100vw-3rem)] translate-x-full border-l data-[state=open]:translate-x-0",
  left: "inset-y-0 left-0 h-full w-[400px] max-w-[calc(100vw-3rem)] -translate-x-full border-r data-[state=open]:translate-x-0",
  bottom:
    "inset-x-0 bottom-0 max-h-[90vh] w-full translate-y-full rounded-t-2xl border-t data-[state=open]:translate-y-0",
} as const;

export interface DrawerContentProps extends React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  side?: keyof typeof SIDE;
  hideClose?: boolean;
}

/** Slide-in panel (03_DRD §4.4 / §3.1). Right by default; left / bottom sheet. */
export const DrawerContent = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(function DrawerContent(
  { className, children, side = "right", hideClose = false, ...props },
  ref,
) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "border-border bg-surface shadow-e3 fixed z-50 flex flex-col gap-4 p-5 outline-none",
          "transition-transform duration-[var(--dur-slow)] ease-[cubic-bezier(0.2,0,0,1)]",
          SIDE[side],
          className,
        )}
        {...props}
      >
        {children}
        {hideClose ? null : (
          <DialogPrimitive.Close
            className="text-fg-subtle hover:bg-elevated hover:text-fg focus-visible:ring-ring absolute right-4 top-4 flex size-7 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2"
            aria-label="Close"
          >
            <X size={16} aria-hidden />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DrawerPortal>
  );
});

export const DrawerTitle = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DrawerTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-heading-m text-fg", className)}
      {...props}
    />
  );
});

export const DrawerDescription = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DrawerDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-body-m text-fg-muted", className)}
      {...props}
    />
  );
});
