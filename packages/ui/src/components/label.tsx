"use client";

import { forwardRef } from "react";
import { Label as LabelPrimitive } from "radix-ui";
import { cn } from "../lib/cn";

export interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  required?: boolean;
}

/** Form label (03_DRD §4.2). Associates via `htmlFor`. */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { required = false, className, children, ...props },
  ref,
) {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        "text-label text-fg inline-flex select-none items-center gap-0.5 font-medium",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        <span className="text-danger" aria-hidden>
          *
        </span>
      ) : null}
    </LabelPrimitive.Root>
  );
});
