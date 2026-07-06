import { forwardRef } from "react";
import { cn } from "../lib/cn";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Optional leading color dot (any CSS color / token var). */
  color?: string;
}

/** Free-form tag with an optional color dot (03_DRD §4.3). */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { color, className, children, ...props },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        "bg-inset text-body-s text-fg-muted inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5",
        className,
      )}
      {...props}
    >
      {color ? (
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      ) : null}
      {children}
    </span>
  );
});
