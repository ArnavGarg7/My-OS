"use client";

import { cn } from "@myos/ui";
import type { LucideIcon } from "lucide-react";

export interface TypeOption<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
}

/**
 * Guided type picker (Phase 1). A tappable row of icon+label tiles replacing the raw `<select>` in the
 * resource editors — same guided style as the finance/health flows. Generic over the enum value type so
 * assets, documents, insurance and vehicles all share one control.
 */
export function TypePicker<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
}: {
  ariaLabel: string;
  options: TypeOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const Icon = o.icon;
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm",
              active
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-fg-muted hover:border-accent hover:bg-elevated",
            )}
          >
            <Icon size={15} aria-hidden />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
