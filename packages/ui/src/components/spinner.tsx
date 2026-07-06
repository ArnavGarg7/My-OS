import { forwardRef } from "react";
import { cn } from "../lib/cn";

const SPINNER_SIZES = {
  sm: "size-3.5 border",
  md: "size-4 border-2",
  lg: "size-5 border-2",
} as const;

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: keyof typeof SPINNER_SIZES;
  /** Screen-reader label. */
  label?: string;
}

/** Indeterminate loading spinner (03_DRD §4.3). Inherits `currentColor`. */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { size = "md", label = "Loading", className, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn("inline-flex", className)}
      {...props}
    >
      <span
        className={cn(
          "animate-spin rounded-full border-current border-t-transparent opacity-70",
          SPINNER_SIZES[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
});
