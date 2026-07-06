import { forwardRef } from "react";
import { cn } from "../lib/cn";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  size?: "sm" | "md";
}

/** A single keyboard key cap (03_DRD §4.3). */
export const Kbd = forwardRef<HTMLElement, KbdProps>(function Kbd(
  { size = "md", className, children, ...props },
  ref,
) {
  return (
    <kbd
      ref={ref}
      className={cn(
        "border-border bg-inset text-fg-muted inline-flex items-center justify-center rounded-[4px] border font-mono font-medium",
        size === "sm" ? "h-4 min-w-4 px-1 text-[10px]" : "text-caption h-5 min-w-5 px-1.5",
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  );
});

export interface ShortcutBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Keys to render, e.g. ["⌘", "K"]. */
  keys: string[];
  size?: "sm" | "md";
}

/** A sequence of key caps for a keyboard shortcut (03_DRD §4.2). */
export const ShortcutBadge = forwardRef<HTMLSpanElement, ShortcutBadgeProps>(function ShortcutBadge(
  { keys, size = "md", className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={`Keyboard shortcut ${keys.join(" ")}`}
      {...props}
    >
      {keys.map((key, index) => (
        <Kbd key={`${key}-${index}`} size={size} aria-hidden>
          {key}
        </Kbd>
      ))}
    </span>
  );
});
