"use client";

import { Button } from "@myos/ui";
import type { AutomationView } from "./use-automation";

/** AutomationFilters (Sprint 3.4). Segmented control for the rule list view. */
const VIEWS: { key: AutomationView; label: string }[] = [
  { key: "all", label: "All" },
  { key: "enabled", label: "Enabled" },
  { key: "built-in", label: "Built-in" },
  { key: "custom", label: "Custom" },
];

export function AutomationFilters({
  view,
  onChange,
}: {
  view: AutomationView;
  onChange: (v: AutomationView) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {VIEWS.map((v) => (
        <Button
          key={v.key}
          size="sm"
          variant={view === v.key ? "primary" : "ghost"}
          onClick={() => onChange(v.key)}
        >
          {v.label}
        </Button>
      ))}
    </div>
  );
}
