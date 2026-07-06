"use client";

import { forwardRef } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "../lib/cn";

/** Command list root (03_DRD §4.4 Command Center). Powered by cmdk. */
export const Command = forwardRef<
  React.ComponentRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(function Command({ className, ...props }, ref) {
  return (
    <CommandPrimitive
      ref={ref}
      className={cn(
        "bg-overlay text-fg flex h-full w-full flex-col overflow-hidden rounded-xl",
        className,
      )}
      {...props}
    />
  );
});

/** Command search input row. */
export const CommandInput = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(function CommandInput({ className, ...props }, ref) {
  return (
    <div className="border-border flex items-center gap-2 border-b px-3">
      <Search size={16} className="text-fg-subtle shrink-0" aria-hidden />
      <CommandPrimitive.Input
        ref={ref}
        className={cn(
          "text-body-m text-fg placeholder:text-fg-subtle h-11 w-full bg-transparent outline-none",
          className,
        )}
        {...props}
      />
    </div>
  );
});

export const CommandList = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(function CommandList({ className, ...props }, ref) {
  return (
    <CommandPrimitive.List
      ref={ref}
      className={cn("max-h-80 overflow-y-auto overflow-x-hidden p-1", className)}
      {...props}
    />
  );
});

export const CommandEmpty = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>(function CommandEmpty({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Empty
      ref={ref}
      className={cn("text-body-s text-fg-subtle py-6 text-center", className)}
      {...props}
    />
  );
});

export const CommandGroup = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(function CommandGroup({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Group
      ref={ref}
      className={cn(
        "text-fg [&_[cmdk-group-heading]]:text-label [&_[cmdk-group-heading]]:text-fg-subtle overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5",
        className,
      )}
      {...props}
    />
  );
});

export const CommandSeparator = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(function CommandSeparator({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Separator
      ref={ref}
      className={cn("bg-border my-1 h-px", className)}
      {...props}
    />
  );
});

/** Command list row (03_DRD §4.4). */
export const CommandItem = forwardRef<
  React.ComponentRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(function CommandItem({ className, ...props }, ref) {
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        "text-body-m text-fg flex h-9 cursor-pointer select-none items-center gap-2.5 rounded-md px-2 outline-none",
        "data-[selected=true]:bg-elevated data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

export function CommandShortcut({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("text-caption text-fg-subtle ml-auto tracking-wide", className)}
      {...props}
    />
  );
}
