"use client";

import { forwardRef } from "react";
import { Progress as ProgressPrimitive } from "radix-ui";
import { cn } from "../lib/cn";

export interface ProgressProps extends React.ComponentPropsWithoutRef<
  typeof ProgressPrimitive.Root
> {
  /** 0–100. Pass `null` for an indeterminate bar. */
  value?: number | null;
  tone?: "accent" | "success" | "warning" | "danger";
  size?: "sm" | "md";
}

const TONE = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
} as const;

/** Linear progress bar (03_DRD §4.2). Determinate or indeterminate. */
export const Progress = forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(function Progress({ value = null, tone = "accent", size = "md", className, ...props }, ref) {
  const indeterminate = value === null;
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      className={cn(
        "bg-inset relative w-full overflow-hidden rounded-full",
        size === "sm" ? "h-1" : "h-2",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "size-full rounded-full transition-transform duration-500",
          TONE[tone],
          indeterminate && "animate-indeterminate origin-left",
        )}
        style={indeterminate ? undefined : { transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
