import { forwardRef } from "react";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  selected?: boolean;
  /** When provided, renders a remove affordance. */
  onRemove?: () => void;
  removeLabel?: string;
}

/** Filter/token chip with an optional remove control (03_DRD §4.3). */
export const Chip = forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  { selected = false, onRemove, removeLabel = "Remove", className, children, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      data-selected={selected || undefined}
      className={cn(
        "text-body-s inline-flex h-6 items-center gap-1 rounded-full border px-2.5 transition-colors",
        selected
          ? "border-accent-border bg-accent-muted text-accent"
          : "border-border bg-elevated text-fg-muted",
        className,
      )}
      {...props}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          className="text-current/70 focus-visible:ring-ring -mr-1 flex size-4 items-center justify-center rounded-full transition-colors hover:bg-black/10 hover:text-current focus-visible:outline-none focus-visible:ring-2"
        >
          <X size={12} strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </span>
  );
});
