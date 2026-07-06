"use client";

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Label } from "./label";

export interface FieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** A single form control. It is wired with id + aria-invalid + aria-describedby. */
  children: ReactNode;
}

type InjectableProps = {
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
};

/**
 * Form field wrapper (03_DRD §4.2). Owns label/hint/error layout and wires
 * accessibility ids onto the child control automatically.
 */
export function Field({ label, hint, error, required, className, children, ...props }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<InjectableProps>, {
        id,
        ...(error ? { "aria-invalid": true } : {}),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-1.5", className)} {...props}>
      {label ? (
        <Label htmlFor={id} required={required ?? false}>
          {label}
        </Label>
      ) : null}
      {control}
      {error ? (
        <p id={errorId} className="text-body-s text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-body-s text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
