import { forwardRef, type ReactNode } from "react";
import { Slot } from "radix-ui";
import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/cn";

export interface NavigationItemProps extends React.HTMLAttributes<HTMLElement> {
  icon?: LucideIcon;
  active?: boolean;
  /** Trailing content, e.g. a count Badge. */
  trailing?: ReactNode;
  /** Icon-only rail mode. */
  collapsed?: boolean;
  /** Render as child (e.g. an <a> / Link). */
  asChild?: boolean;
}

/**
 * Sidebar navigation row (03_DRD §3.1). Active = accent-muted + accent icon +
 * a 2px accent left bar. Presentational only — no routing.
 */
export const NavigationItem = forwardRef<HTMLButtonElement, NavigationItemProps>(
  function NavigationItem(
    {
      icon: IconComponent,
      active = false,
      trailing,
      collapsed = false,
      asChild = false,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const classes = cn(
      "group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-body-m transition-colors outline-none",
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
      active ? "bg-accent-muted text-fg" : "text-fg-muted hover:bg-elevated hover:text-fg",
      collapsed && "w-8 justify-center px-0",
      className,
    );
    const content = (
      <>
        {active ? (
          <span
            aria-hidden
            className="bg-accent absolute bottom-1.5 left-0 top-1.5 w-0.5 rounded-full"
          />
        ) : null}
        {IconComponent ? (
          <IconComponent
            size={16}
            className={cn(
              "shrink-0",
              active ? "text-accent" : "text-fg-subtle group-hover:text-fg",
            )}
            aria-hidden
          />
        ) : null}
        {collapsed ? null : (
          <>
            <span className="min-w-0 flex-1 truncate text-left">{children}</span>
            {trailing}
          </>
        )}
      </>
    );

    const shared = {
      "data-active": active || undefined,
      "aria-current": active ? ("page" as const) : undefined,
      className: classes,
      ...props,
    };

    if (asChild) {
      return (
        <Slot.Root ref={ref} {...shared}>
          {content}
        </Slot.Root>
      );
    }
    return (
      <button ref={ref} type="button" {...shared}>
        {content}
      </button>
    );
  },
);
