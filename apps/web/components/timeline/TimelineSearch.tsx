"use client";

import { Search } from "lucide-react";
import { Input } from "@myos/ui";

/** TimelineSearch (Sprint 2.13). Controlled keyword search over the history. */
export function TimelineSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
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
        placeholder="Search your history…"
        aria-label="Search timeline"
        className="pl-8"
      />
    </div>
  );
}
