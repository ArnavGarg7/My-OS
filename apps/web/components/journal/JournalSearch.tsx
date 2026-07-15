"use client";

import { Search } from "lucide-react";
import { Input } from "@myos/ui";

/**
 * JournalSearch (Sprint 2.10). Controlled deterministic keyword search box.
 */
export function JournalSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <Search
        size={15}
        aria-hidden
        className="text-fg-subtle pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search your journal…"
        aria-label="Search journal"
        className="pl-8"
      />
    </div>
  );
}
