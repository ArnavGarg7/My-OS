"use client";

import { Award, CalendarRange, Clock, Pin } from "lucide-react";
import { Text } from "@myos/ui";
import type { TimelineEvent } from "@myos/core/timeline";
import { TimelineMiniCalendar } from "./TimelineMiniCalendar";
import { TimelineHighlights } from "./TimelineHighlights";
import { TimelineMemories } from "./TimelineMemories";
import { TimelineSnapshots } from "./TimelineSnapshots";

/**
 * TimelineSidebar (Sprint 2.13). The right rail on the Timeline page — mini
 * activity calendar, highlights, memories and period snapshots stacked
 * editorially.
 */
function SidebarSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Award;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <span className="inline-flex items-center gap-1.5">
        <Icon size={14} aria-hidden className="text-fg-subtle" />
        <Text variant="label" tone="subtle">
          {title}
        </Text>
      </span>
      {children}
    </section>
  );
}

export function TimelineSidebar({
  events,
  onPickDate,
}: {
  events: TimelineEvent[];
  onPickDate?: (date: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <SidebarSection icon={Clock} title="Activity">
        <TimelineMiniCalendar events={events} {...(onPickDate ? { onPickDate } : {})} />
      </SidebarSection>
      <SidebarSection icon={Award} title="Highlights">
        <TimelineHighlights />
      </SidebarSection>
      <SidebarSection icon={Pin} title="Memories">
        <TimelineMemories />
      </SidebarSection>
      <SidebarSection icon={CalendarRange} title="Reviews">
        <TimelineSnapshots />
      </SidebarSection>
    </div>
  );
}
