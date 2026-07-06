import { forwardRef, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";

export interface TimelineItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: LucideIcon;
  title: ReactNode;
  meta?: ReactNode;
  /** Icon ring color token, e.g. "var(--accent)". */
  color?: string;
  /** Hide the connector below (last item). */
  last?: boolean;
}

/** A single timeline/activity entry (03_DRD §5.15). */
export const TimelineItem = forwardRef<HTMLDivElement, TimelineItemProps>(function TimelineItem(
  { icon: IconComponent, title, meta, color, last = false, className, children, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn("flex gap-3", className)} {...props}>
      <div className="flex flex-col items-center">
        <span
          className="border-border bg-elevated flex size-7 shrink-0 items-center justify-center rounded-full border"
          style={color ? { color } : undefined}
        >
          {IconComponent ? (
            <IconComponent size={14} className={color ? "" : "text-fg-subtle"} aria-hidden />
          ) : (
            <span className="size-1.5 rounded-full bg-current" aria-hidden />
          )}
        </span>
        {last ? null : <span aria-hidden className="bg-border mt-1 w-px flex-1" />}
      </div>
      <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-5")}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-body-m text-fg font-medium">{title}</p>
          {meta ? <span className="text-caption text-fg-subtle shrink-0">{meta}</span> : null}
        </div>
        {children ? <div className="text-body-s text-fg-muted mt-0.5">{children}</div> : null}
      </div>
    </div>
  );
});
