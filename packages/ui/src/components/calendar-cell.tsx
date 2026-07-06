import { forwardRef } from "react";
import { cn } from "../lib/cn";

export interface CalendarCellProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Day-of-month number. */
  day: number;
  today?: boolean;
  selected?: boolean;
  /** Dimmed (adjacent month). */
  outside?: boolean;
  /** Up to three event dots (any CSS colors). */
  events?: string[];
}

/** A single day cell for calendar grids (03_DRD §4.3 / §5.3). */
export const CalendarCell = forwardRef<HTMLButtonElement, CalendarCellProps>(function CalendarCell(
  {
    day,
    today = false,
    selected = false,
    outside = false,
    events = [],
    disabled,
    className,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      aria-current={today ? "date" : undefined}
      data-today={today || undefined}
      data-selected={selected || undefined}
      className={cn(
        "group relative flex aspect-square w-full flex-col items-center justify-start gap-1 rounded-md p-1.5 outline-none transition-colors",
        "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2",
        "hover:bg-elevated disabled:pointer-events-none disabled:opacity-40",
        selected && "bg-accent-muted",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "text-body-s flex size-6 items-center justify-center rounded-full font-mono tabular-nums",
          outside ? "text-fg-subtle" : "text-fg",
          today && "bg-accent text-on-accent",
          selected && !today && "text-accent",
        )}
      >
        {day}
      </span>
      {events.length > 0 ? (
        <span className="flex items-center gap-0.5" aria-hidden>
          {events.slice(0, 3).map((color, index) => (
            <span key={index} className="size-1 rounded-full" style={{ backgroundColor: color }} />
          ))}
        </span>
      ) : null}
    </button>
  );
});
