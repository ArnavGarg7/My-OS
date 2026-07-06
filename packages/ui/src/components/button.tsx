import { forwardRef, type ReactNode } from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap select-none",
    "transition-[background-color,color,border-color,box-shadow,transform] duration-[var(--dur-fast)]",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-base",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary: "bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-active",
        secondary: "border border-border bg-elevated text-fg hover:bg-overlay",
        ghost: "bg-transparent text-fg-muted hover:bg-elevated hover:text-fg",
        danger: "bg-danger text-on-accent hover:brightness-110 active:brightness-95",
        subtle: "bg-accent-muted text-accent hover:bg-accent-muted hover:brightness-125",
      },
      size: {
        sm: "h-8 px-3 text-body-s",
        md: "h-9 px-3.5 text-body-m",
        lg: "h-10 px-4 text-body-m",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

/**
 * The button primitive (03_DRD §4.1): primary · secondary · ghost · danger ·
 * subtle, with loading state. Keyboard-focusable with a visible ring; press,
 * hover, disabled and loading are all handled.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant,
    size,
    asChild = false,
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    className,
    children,
    ...props
  },
  ref,
) {
  if (asChild) {
    return (
      <Slot.Root ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {children}
      </Slot.Root>
    );
  }

  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : leftIcon}
      {children}
      {loading ? null : rightIcon}
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonProps, "leftIcon" | "rightIcon" | "asChild"> {
  /** Required for accessibility — icon buttons have no visible label. */
  "aria-label": string;
}

/** Square icon-only button (03_DRD §4.1). Requires an aria-label. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = "ghost", size = "icon", className, ...props },
  ref,
) {
  return <Button ref={ref} variant={variant} size={size} className={className} {...props} />;
});

export { buttonVariants };
