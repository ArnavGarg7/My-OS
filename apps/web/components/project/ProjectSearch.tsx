"use client";

import { Search } from "lucide-react";
import { Input } from "@myos/ui";

/**
 * ProjectSearch (Sprint 2.8). A controlled search box filtering the project
 * list by name/description (matching happens in the pure engine/hook).
 */
export function ProjectSearch({
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
        placeholder="Search projects…"
        aria-label="Search projects"
        className="pl-8"
      />
    </div>
  );
}
