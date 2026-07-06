"use client";

import { forwardRef } from "react";
import { cn } from "../lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

/** Multi-line text input (03_DRD §4.2). */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, className, disabled, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      className={cn(
        "bg-inset text-body-m text-fg placeholder:text-fg-subtle min-h-20 w-full resize-y rounded-md border px-3 py-2 outline-none transition-colors",
        "focus:border-accent focus:ring-accent-muted focus:ring-2",
        invalid ? "border-danger focus:ring-danger/20" : "border-border hover:border-border-strong",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      {...props}
    />
  );
});
