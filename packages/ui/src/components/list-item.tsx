import { forwardRef, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Leading slot: control, icon, avatar. */
  leading?: ReactNode;
  /** Trailing slot: meta, actions. */
  trailing?: ReactNode;
  selected?: boolean;
  /** Enables hover affordance + pointer cursor. */
  interactive?: boolean;
  density?: "compact" | "default" | "comfortable";
}

const DENSITY = {
  compact: "min-h-8 py-1",
  default: "min-h-9 py-1.5",
  comfortable: "min-h-10 py-2",
} as const;

/** Universal list row (03_DRD §4.3). Grid: [leading][content 1fr][trailing]. */
export const ListItem = forwardRef<HTMLDivElement, ListItemProps>(function ListItem(
  {
    leading,
    trailing,
    selected = false,
    interactive = false,
    density = "default",
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <div
      ref={ref}
      data-selected={selected || undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-2 transition-colors",
        DENSITY[density],
        interactive && "hover:bg-elevated cursor-pointer",
        selected && "bg-accent-muted",
        className,
      )}
      {...props}
    >
      {leading ? <div className="flex shrink-0 items-center">{leading}</div> : null}
      <div className="min-w-0 flex-1">{children}</div>
      {trailing ? <div className="flex shrink-0 items-center gap-2">{trailing}</div> : null}
    </div>
  );
});
