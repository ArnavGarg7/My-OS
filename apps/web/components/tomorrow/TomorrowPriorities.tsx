"use client";

import { LayoutDashboard } from "lucide-react";
import { Badge, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { ATTENTION_TONE } from "@/components/intelligence/intelligence-icons";

/**
 * Tomorrow Studio priorities slot (Sprint 4.4). The top things to act on tomorrow, taken from
 * the dashboard's importance × urgency matrix — do-now items first. Read-only; the Intelligence
 * dashboard derives these deterministically from the attention engine.
 */
export function TomorrowPriorities() {
  const priorities = trpc.intelligence.tomorrowPriorities.useQuery();
  const items = priorities.data ?? [];

  if (items.length === 0) return null;

  return (
    <div className="border-border-subtle flex flex-col gap-2 rounded-md border px-3 py-2">
      <span className="inline-flex items-center gap-2">
        <LayoutDashboard size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="body-s">Tomorrow&apos;s priorities</Text>
      </span>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2">
            <Text variant="caption">{item.title}</Text>
            <Badge size="sm" variant={ATTENTION_TONE[item.level]}>
              {item.area}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
