"use client";

import { HeartPulse } from "lucide-react";
import { Text } from "@myos/ui";
import { useHealth } from "@/lib/health";

/**
 * Morning Briefing Health slot (Sprint 2.8.5). A reserved section that stays
 * hidden until Sprint 2.9 provides a summary — then it shows the day's headline.
 */
export function HealthMorningSlot() {
  const health = useHealth();
  if (!health.available) return null;
  return (
    <section className="border-border flex items-start gap-3 rounded-lg border p-4">
      <HeartPulse size={18} aria-hidden className="text-fg-subtle mt-0.5" />
      <div>
        <Text variant="heading-s">Health</Text>
        <Text variant="body-s" tone="subtle">
          {health.headline ?? "No health signal yet."}
        </Text>
      </div>
    </section>
  );
}
