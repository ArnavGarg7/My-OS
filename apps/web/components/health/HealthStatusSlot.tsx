"use client";

import { useHealth } from "@/lib/health";

/**
 * Status-bar Health slot (Sprint 2.8.5). Renders nothing until Sprint 2.9 marks
 * the Health summary available, then shows "Health · <energy>".
 */
export function HealthStatusSlot() {
  const health = useHealth();
  if (!health.available) return null;
  const label = health.energy ? health.energy[0]!.toUpperCase() + health.energy.slice(1) : "OK";
  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${health.energy === "low" ? "bg-warning" : "bg-success"}`}
      />
      <span className="text-fg-subtle">Health</span>
      <span className="text-fg-muted font-medium">{label}</span>
    </div>
  );
}
