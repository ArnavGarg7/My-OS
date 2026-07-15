"use client";

import { SearchInput } from "@myos/ui";

/** Deterministic inbox search box (Sprint 2.4). Title + content + keywords. */
export function InboxSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <SearchInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClear={() => onChange("")}
      placeholder="Search the inbox…"
      aria-label="Search inbox"
      className="w-full"
    />
  );
}
