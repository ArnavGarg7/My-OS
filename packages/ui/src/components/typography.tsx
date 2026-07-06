import { forwardRef } from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const textVariants = cva("", {
  variants: {
    variant: {
      "display-xl": "font-sans text-display-xl",
      "display-l": "font-sans text-display-l",
      "display-m": "font-sans text-display-m",
      "heading-xl": "font-sans text-heading-xl",
      "heading-l": "font-sans text-heading-l",
      "heading-m": "font-sans text-heading-m",
      "heading-s": "font-sans text-heading-s",
      "body-l": "font-sans text-body-l",
      "body-m": "font-sans text-body-m",
      "body-s": "font-sans text-body-s",
      caption: "font-sans text-caption",
      label: "font-sans text-label",
      mono: "font-mono text-mono tabular-nums",
    },
    tone: {
      default: "text-fg",
      muted: "text-fg-muted",
      subtle: "text-fg-subtle",
      accent: "text-accent",
      success: "text-success",
      warning: "text-warning",
      danger: "text-danger",
      info: "text-info",
    },
    truncate: {
      true: "truncate",
      false: "",
    },
  },
  defaultVariants: {
    variant: "body-m",
    tone: "default",
    truncate: false,
  },
});

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color">, VariantProps<typeof textVariants> {
  /** Render as the child element (polymorphic) instead of a `span`. */
  asChild?: boolean;
}

/**
 * The single typography primitive (03_DRD §2.2). Every text style in the app
 * comes from a `variant` here — no ad-hoc font sizes elsewhere.
 */
export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  { variant, tone, truncate, asChild = false, className, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : "span";
  return (
    <Comp
      ref={ref}
      className={cn(textVariants({ variant, tone, truncate }), className)}
      {...props}
    />
  );
});

export { textVariants };
