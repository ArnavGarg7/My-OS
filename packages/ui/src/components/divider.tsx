import { forwardRef } from "react";
import { cn } from "../lib/cn";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  /** Optional centered label (horizontal only). */
  label?: string;
}

/** Hairline separator (03_DRD §2.1 border-subtle). */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(function Divider(
  { orientation = "horizontal", label, className, ...props },
  ref,
) {
  if (orientation === "vertical") {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="vertical"
        className={cn("bg-border h-full w-px shrink-0", className)}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation="horizontal"
        className={cn("flex items-center gap-3", className)}
        {...props}
      >
        <span className="bg-border h-px flex-1" />
        <span className="text-caption text-fg-subtle font-medium uppercase tracking-wide">
          {label}
        </span>
        <span className="bg-border h-px flex-1" />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="horizontal"
      className={cn("bg-border h-px w-full", className)}
      {...props}
    />
  );
});
