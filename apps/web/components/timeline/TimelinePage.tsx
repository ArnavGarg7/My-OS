"use client";

import { Clock } from "lucide-react";
import { Text } from "@myos/ui";
import { PageContainer, PageContent, PageLoading } from "@/components/framework";
import { useShellStore } from "@/lib/shell/store";
import { useTimelinePage } from "./use-timeline-page";
import { TimelineFeed } from "./TimelineFeed";
import { TimelineFilters } from "./TimelineFilters";
import { TimelineSearch } from "./TimelineSearch";
import { TimelineSidebar } from "./TimelineSidebar";

/**
 * Timeline page (Sprint 2.13). The unified, immutable life history — a single
 * editorial vertical feed with source/grouping filters, keyword search and a
 * right rail of highlights, memories and reviews. Selecting an event feeds the
 * shared context panel.
 */
export function TimelinePage() {
  const tl = useTimelinePage();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);

  if (tl.isLoading) return <PageLoading label="Assembling your history…" />;

  const select = (id: string) => {
    tl.select(id);
    openContextPanel(true);
  };

  return (
    <PageContainer width="full" className="p-0">
      <PageContent className="gap-0 p-0">
        <div className="border-border flex flex-col gap-3 border-b p-3">
          <div className="flex items-center gap-2">
            <Clock size={16} aria-hidden className="text-fg-subtle" />
            <Text variant="heading-s">Timeline</Text>
            <span className="flex-1" />
            <div className="min-w-48 flex-1 sm:max-w-xs">
              <TimelineSearch value={tl.query} onChange={tl.setQuery} />
            </div>
          </div>
          <TimelineFilters
            sources={tl.sources}
            onToggleSource={tl.toggleSource}
            grouping={tl.grouping}
            onGrouping={tl.setGrouping}
            minImportance={tl.minImportance}
            onMinImportance={tl.setMinImportance}
            onClear={tl.clearFilters}
          />
        </div>

        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-y-auto p-4">
            <TimelineFeed
              groups={tl.groups}
              events={tl.events}
              searching={tl.searching}
              selectedId={tl.selectedId}
              onSelect={select}
            />
          </div>
          <aside className="border-border hidden w-80 shrink-0 overflow-y-auto border-l p-4 xl:block">
            <TimelineSidebar events={tl.events} onPickDate={(d) => tl.setQuery(d)} />
          </aside>
        </div>
      </PageContent>
    </PageContainer>
  );
}
