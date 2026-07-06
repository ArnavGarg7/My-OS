import { forwardRef, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface SectionHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  /** Trailing actions. */
  actions?: ReactNode;
}

/** Section heading with optional description + actions (03_DRD §4.3). */
export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(function SectionHeader(
  { title, description, actions, className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn("flex items-start justify-between gap-4", className)} {...props}>
      <div className="min-w-0 space-y-0.5">
        <h2 className="text-heading-m text-fg">{title}</h2>
        {description ? <p className="text-body-s text-fg-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
});
