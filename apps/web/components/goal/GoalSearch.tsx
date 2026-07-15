"use client";

import { Search } from "lucide-react";
import { Input } from "@myos/ui";

/** GoalSearch (Sprint 2.12). Controlled keyword search over goals. */
export function GoalSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
        placeholder="Search goals…"
        aria-label="Search goals"
        className="pl-8"
      />
    </div>
  );
}
