import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "bg-neutral-subtle text-fg-muted",
        accent: "bg-accent-muted text-accent",
        success: "bg-success-subtle text-success",
        warning: "bg-warning-subtle text-warning",
        danger: "bg-danger-subtle text-danger",
        info: "bg-info-subtle text-info",
        outline: "border border-border text-fg-muted",
      },
      size: {
        sm: "h-4 px-1.5 text-[10px]",
        md: "h-5 px-2 text-caption",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

/** Small status/label pill (03_DRD §4.3). */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant, size, className, ...props },
  ref,
) {
  return <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...props} />;
});

export { badgeVariants };
