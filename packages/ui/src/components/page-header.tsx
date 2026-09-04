import { forwardRef, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { MonoLabel } from "./mono-label";

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  /** Above the title, e.g. a Breadcrumb. */
  breadcrumb?: ReactNode;
  /** A mono micro-label above the title — the module / operating context. */
  eyebrow?: ReactNode;
  /** Trailing primary actions. */
  actions?: ReactNode;
  /** Right-aligned mono state line (telemetry, status) shown under the actions. */
  meta?: ReactNode;
}

/**
 * Top-of-page header (03_DRD §5; V2 "Kinetic Obsidian" pass). An optional mono
 * `eyebrow` carries the operating context; `meta` carries machine state. Stacks
 * its actions on small screens.
 */
export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(function PageHeader(
  { title, description, breadcrumb, eyebrow, actions, meta, className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn("flex flex-col gap-3", className)} {...props}>
      {breadcrumb}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          {eyebrow ? (
            typeof eyebrow === "string" ? (
              <MonoLabel tone="subtle">{eyebrow}</MonoLabel>
            ) : (
              eyebrow
            )
          ) : null}
          <h1 className="text-heading-xl text-fg tracking-tight">{title}</h1>
          {description ? (
            <p className="text-body-m text-fg-muted max-w-2xl">{description}</p>
          ) : null}
        </div>
        {actions || meta ? (
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            {meta ? <div className="flex items-center gap-2">{meta}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
});
