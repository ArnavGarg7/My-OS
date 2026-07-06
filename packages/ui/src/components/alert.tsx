import { forwardRef, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

const alertVariants = cva("flex gap-3 rounded-lg border p-3.5", {
  variants: {
    variant: {
      info: "border-info/30 bg-info-subtle text-fg",
      success: "border-success/30 bg-success-subtle text-fg",
      warning: "border-warning/30 bg-warning-subtle text-fg",
      danger: "border-danger/30 bg-danger-subtle text-fg",
      neutral: "border-border bg-elevated text-fg",
    },
  },
  defaultVariants: { variant: "info" },
});

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  danger: XCircle,
  neutral: Info,
} as const;

const ICON_TONE = {
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-fg-muted",
} as const;

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">, VariantProps<typeof alertVariants> {
  title?: ReactNode;
  /** Hide the leading status icon. */
  hideIcon?: boolean;
  action?: ReactNode;
}

/** Inline contextual message (03_DRD §4.4). Assertive for danger, else polite. */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  { variant = "info", title, hideIcon = false, action, className, children, ...props },
  ref,
) {
  const resolved = variant ?? "info";
  const IconComponent = ICONS[resolved];
  return (
    <div
      ref={ref}
      role="alert"
      aria-live={resolved === "danger" ? "assertive" : "polite"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {hideIcon ? null : (
        <IconComponent
          size={18}
          className={cn("mt-0.5 shrink-0", ICON_TONE[resolved])}
          aria-hidden
        />
      )}
      <div className="flex-1 space-y-1">
        {title ? <p className="text-heading-s text-fg">{title}</p> : null}
        {children ? <div className="text-body-m text-fg-muted">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
});

export { alertVariants };
