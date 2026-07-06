"use client";

import type { ReactNode } from "react";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@myos/ui";

export type Option = { value: string; label: string };

/** A labeled select over {value,label} options (or raw strings). */
export function LabeledSelect({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly Option[] | readonly string[];
  hint?: string;
}) {
  const normalized: Option[] = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {normalized.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hint ? <p className="text-body-s text-fg-subtle">{hint}</p> : null}
    </div>
  );
}

/** A labeled toggle row for boolean preferences. */
export function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-1">
      <span className="min-w-0">
        <span className="text-body-m text-fg block">{label}</span>
        {description ? (
          <span className="text-body-s text-fg-subtle block">{description}</span>
        ) : null}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

/** A read-only labeled value (identity facts sourced from the auth provider). */
export function ReadonlyRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-body-s text-fg-subtle">{label}</span>
      <span className="text-body-m text-fg min-w-0 truncate text-right">{value}</span>
    </div>
  );
}
