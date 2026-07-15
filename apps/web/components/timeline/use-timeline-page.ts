"use client";

import { useMemo, useState } from "react";
import type { Grouping, TimelineSource } from "@myos/core/timeline";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";

/**
 * Timeline page controller (Sprint 2.13). Owns the filter/grouping/search state,
 * fetches the feed (or search results) and exposes selection shared with the
 * context panel. The Timeline is read-only — no mutations except pin/unpin.
 */
export function useTimelinePage() {
  const selectedId = useShellStore((s) => s.selectedTimelineEventId);
  const setSelectedId = useShellStore((s) => s.setSelectedTimelineEventId);

  const [sources, setSources] = useState<TimelineSource[]>([]);
  const [grouping, setGrouping] = useState<Grouping>("day");
  const [minImportance, setMinImportance] = useState(0);
  const [query, setQuery] = useState("");

  const feedInput = useMemo(
    () => ({
      grouping,
      ...(sources.length ? { sources } : {}),
      ...(minImportance > 0 ? { minImportance } : {}),
    }),
    [grouping, sources, minImportance],
  );

  const feedQuery = trpc.timeline.feed.useQuery(feedInput);
  const searchQuery = trpc.timeline.search.useQuery(
    { query },
    { enabled: query.trim().length > 0 },
  );

  const searching = query.trim().length > 0;
  const groups = feedQuery.data?.groups ?? [];
  const events = searching ? (searchQuery.data ?? []) : (feedQuery.data?.events ?? []);

  const toggleSource = (source: TimelineSource) =>
    setSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source],
    );

  return {
    isLoading: feedQuery.isLoading,
    searching,
    groups,
    events,
    sources,
    setSources,
    toggleSource,
    grouping,
    setGrouping,
    minImportance,
    setMinImportance,
    query,
    setQuery,
    selectedId,
    select: (id: string | null) => setSelectedId(id),
    clearFilters: () => {
      setSources([]);
      setMinImportance(0);
      setQuery("");
    },
  };
}
