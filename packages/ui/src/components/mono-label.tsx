import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const monoLabelVariants = cva(
  "inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.08em] tabular-nums leading-none",
  {
    variants: {
      size: {
        sm: "text-[10px]",
        md: "text-caption",
      },
      tone: {
        subtle: "text-fg-subtle",
        muted: "text-fg-muted",
        accent: "text-accent-fg",
        success: "text-success",
        warning: "text-warning",
        danger: "text-danger",
        info: "text-info",
      },
    },
    defaultVariants: { size: "md", tone: "subtle" },
  },
);

export interface MonoLabelProps
  extends
    Omit<React.HTMLAttributes<HTMLSpanElement>, "color">,
    VariantProps<typeof monoLabelVariants> {
  /** Optional leading status bead. */
  bead?: boolean;
}

/**
 * Machine-state label (V2 "Kinetic Obsidian"): the uppercase JetBrains-Mono
 * micro-caption used for section headers, state tokens and telemetry —
 * "NEXT ACTION", "CHIEF OF STAFF", "24:15 LEFT". Prose stays in `Text`.
 */
export const MonoLabel = forwardRef<HTMLSpanElement, MonoLabelProps>(function MonoLabel(
  { size, tone, bead = false, className, children, ...props },
  ref,
) {
  return (
    <span ref={ref} className={cn(monoLabelVariants({ size, tone }), className)} {...props}>
      {bead ? <span aria-hidden className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
});

export { monoLabelVariants };
