import { forwardRef, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Primary action, e.g. a Button. */
  action?: ReactNode;
  /** Optional keyboard hint, e.g. a ShortcutBadge. */
  hint?: ReactNode;
}

/** Teaching empty state (03_DRD §4.3): icon → message → action → hint. */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(function EmptyState(
  { icon: IconComponent, title, description, action, hint, className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      {IconComponent ? (
        <span className="bg-accent-muted text-accent flex size-11 items-center justify-center rounded-full">
          <IconComponent size={20} aria-hidden />
        </span>
      ) : null}
      <div className="space-y-1">
        <p className="text-heading-s text-fg">{title}</p>
        {description ? (
          <p className="text-body-m text-fg-muted mx-auto max-w-sm">{description}</p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
      {hint ? <div className="text-fg-subtle">{hint}</div> : null}
    </div>
  );
});
