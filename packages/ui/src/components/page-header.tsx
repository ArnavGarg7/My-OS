import { forwardRef, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  /** Above the title, e.g. a Breadcrumb. */
  breadcrumb?: ReactNode;
  /** Trailing primary actions. */
  actions?: ReactNode;
}

/** Top-of-page header (03_DRD §5). Stacks its actions on small screens. */
export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(function PageHeader(
  { title, description, breadcrumb, actions, className, ...props },
  ref,
) {
  return (
    <div ref={ref} className={cn("flex flex-col gap-3", className)} {...props}>
      {breadcrumb}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-heading-l text-fg">{title}</h1>
          {description ? <p className="text-body-m text-fg-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
});
