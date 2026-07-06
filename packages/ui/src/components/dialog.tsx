"use client";

import { forwardRef } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

export const DialogOverlay = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        "bg-scrim data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50 backdrop-blur-[2px]",
        className,
      )}
      {...props}
    />
  );
});

const DIALOG_SIZES = {
  sm: "max-w-sm",
  md: "max-w-[480px]",
  lg: "max-w-[640px]",
  xl: "max-w-[720px]",
} as const;

export interface DialogContentProps extends React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  size?: keyof typeof DIALOG_SIZES;
  hideClose?: boolean;
}

/** Centered modal (03_DRD §4.4). Focus-trapped; Esc/overlay close. */
export const DialogContent = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent({ className, children, size = "md", hideClose = false, ...props }, ref) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "border-border bg-surface shadow-e3 fixed left-1/2 top-1/2 z-50 grid max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-auto rounded-xl border p-5 outline-none",
          "data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out",
          DIALOG_SIZES[size],
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
    </DialogPortal>
  );
});

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 pr-8", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

export const DialogTitle = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("text-heading-m text-fg", className)}
      {...props}
    />
  );
});

export const DialogDescription = forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn("text-body-m text-fg-muted", className)}
      {...props}
    />
  );
});
