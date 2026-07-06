import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const cardVariants = cva("rounded-lg text-fg", {
  variants: {
    variant: {
      /** Standard: surface + hairline (03_DRD §4.3 e1). */
      standard: "border border-border bg-surface",
      /** Elevated: raised with shadow (e2). */
      elevated: "border border-border bg-elevated shadow-e2",
      /** Interactive: hover-raises, for clickable cards. */
      interactive:
        "border border-border bg-surface transition-[background-color,border-color,box-shadow] hover:border-border-strong hover:bg-elevated focus-within:border-accent-border",
      /** Section: flatter grouping container. */
      section: "border border-border bg-surface/60",
      /** Ghost: no chrome, padding only. */
      ghost: "bg-transparent",
    },
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    },
  },
  defaultVariants: {
    variant: "standard",
    padding: "md",
  },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

/** Container surface (03_DRD §4.3). Compose with the Card* subcomponents. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant, padding, className, ...props },
  ref,
) {
  return <div ref={ref} className={cn(cardVariants({ variant, padding }), className)} {...props} />;
});

export const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return <div ref={ref} className={cn("flex flex-col gap-1 pb-3", className)} {...props} />;
  },
);

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className, ...props }, ref) {
    return <h3 ref={ref} className={cn("text-heading-m text-fg", className)} {...props} />;
  },
);

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return <p ref={ref} className={cn("text-body-m text-fg-muted", className)} {...props} />;
});

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn("text-body-m", className)} {...props} />;
  },
);

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return <div ref={ref} className={cn("flex items-center gap-2 pt-3", className)} {...props} />;
  },
);

export { cardVariants };
