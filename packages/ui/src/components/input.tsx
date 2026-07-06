"use client";

import { forwardRef, useState, type ReactNode } from "react";
import { Eye, EyeOff, Search, X } from "lucide-react";
import { cn } from "../lib/cn";

const INPUT_SIZES = {
  sm: "h-8 text-body-s",
  md: "h-9 text-body-m",
  lg: "h-10 text-body-m",
} as const;

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  inputSize?: keyof typeof INPUT_SIZES;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

/** Text input (03_DRD §4.2). Supports adornments, invalid state, sizes. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, inputSize = "md", startIcon, endIcon, className, disabled, ...props },
  ref,
) {
  return (
    <div
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      className={cn(
        "bg-inset group flex items-center gap-2 rounded-md border px-3 transition-colors",
        "focus-within:border-accent focus-within:ring-accent-muted focus-within:ring-2",
        invalid
          ? "border-danger focus-within:ring-danger/20"
          : "border-border hover:border-border-strong",
        disabled && "pointer-events-none opacity-50",
        INPUT_SIZES[inputSize],
        className,
      )}
    >
      {startIcon ? <span className="text-fg-subtle shrink-0">{startIcon}</span> : null}
      <input
        ref={ref}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className="text-fg placeholder:text-fg-subtle min-w-0 flex-1 bg-transparent outline-none disabled:cursor-not-allowed"
        {...props}
      />
      {endIcon ? <span className="text-fg-subtle shrink-0">{endIcon}</span> : null}
    </div>
  );
});

export type PasswordInputProps = Omit<InputProps, "type" | "endIcon">;

/** Password input with a show/hide toggle (03_DRD §4.2). */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ ...props }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        endIcon={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="text-fg-subtle hover:text-fg focus-visible:ring-ring flex items-center rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
          >
            {visible ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
          </button>
        }
        {...props}
      />
    );
  },
);

export interface SearchInputProps extends Omit<InputProps, "type" | "startIcon"> {
  onClear?: () => void;
}

/** Search input with leading icon + optional clear (03_DRD §4.2). */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { onClear, value, className, ...props },
  ref,
) {
  const showClear = onClear && typeof value === "string" && value.length > 0;
  return (
    <Input
      ref={ref}
      type="search"
      role="searchbox"
      value={value}
      startIcon={<Search size={15} aria-hidden />}
      endIcon={
        showClear ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search"
            className="text-fg-subtle hover:text-fg focus-visible:ring-ring flex items-center rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2"
          >
            <X size={15} aria-hidden />
          </button>
        ) : undefined
      }
      className={cn("[&_input::-webkit-search-cancel-button]:hidden", className)}
      {...props}
    />
  );
});
