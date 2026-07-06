import { forwardRef } from "react";
import { cn } from "../lib/cn";

const STATUS_COLORS = {
  online: "bg-success",
  busy: "bg-danger",
  away: "bg-warning",
  offline: "bg-fg-subtle",
  info: "bg-info",
  accent: "bg-accent",
} as const;

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: keyof typeof STATUS_COLORS;
  /** Pulsing ring for live/active states. */
  pulse?: boolean;
  label?: string;
}

/** Colored status dot with optional pulse + text label (03_DRD §4.3 / §7). */
export const StatusIndicator = forwardRef<HTMLSpanElement, StatusIndicatorProps>(
  function StatusIndicator({ status = "offline", pulse = false, label, className, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn("inline-flex items-center gap-2", className)}
        {...props}
        {...(label ? {} : { role: "status", "aria-label": status })}
      >
        <span className="relative flex size-2.5 items-center justify-center">
          {pulse ? (
            <span
              aria-hidden
              className={cn(
                "animate-pulse-soft absolute inline-flex size-full rounded-full opacity-60",
                STATUS_COLORS[status],
              )}
            />
          ) : null}
          <span aria-hidden className={cn("relative size-2 rounded-full", STATUS_COLORS[status])} />
        </span>
        {label ? <span className="text-body-s text-fg-muted">{label}</span> : null}
      </span>
    );
  },
);
