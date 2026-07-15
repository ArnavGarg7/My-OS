"use client";

import { SearchInput } from "@myos/ui";

/** Deterministic task search box (Sprint 2.5). Title + description. */
export function TaskSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <SearchInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClear={() => onChange("")}
      placeholder="Search tasks…"
      aria-label="Search tasks"
      className="w-full"
    />
  );
}
