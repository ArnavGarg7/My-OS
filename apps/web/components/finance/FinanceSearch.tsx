"use client";

import { Search } from "lucide-react";
import { Input } from "@myos/ui";

/** FinanceSearch (Sprint 2.11). Controlled keyword search over transactions. */
export function FinanceSearch({
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
        placeholder="Search transactions…"
        aria-label="Search transactions"
        className="pl-8"
      />
    </div>
  );
}
