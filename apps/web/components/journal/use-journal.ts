"use client";

import { useMemo, useState } from "react";
import {
  filterEntries,
  search as searchEntries,
  sortByRecent,
  type CreateEntrySchemaInput,
  type EntryType,
} from "@myos/core/journal";
import { useToaster } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";

/**
 * Client journal controller (Sprint 2.10). Fetches entries + summary, derives
 * the current view (filter/search) with the pure engine, and exposes the entry
 * lifecycle + reflection/review mutations. Emits timeline + analytics events.
 * Selection is shared with the context panel via the shell store.
 */
export function useJournal() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();
  const selectedId = useShellStore((s) => s.selectedJournalId);
  const setSelectedId = useShellStore((s) => s.setSelectedJournalId);

  const [typeFilter, setTypeFilter] = useState<EntryType | null>(null);
  const [query, setQuery] = useState("");

  const listQuery = trpc.journal.list.useQuery({ includeArchived: false });
  const summaryQuery = trpc.journal.summary.useQuery({});
  const promptsQuery = trpc.journal.prompts.useQuery({});

  const entries = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const view = useMemo(() => {
    if (query.trim()) return searchEntries(entries, query).map((r) => r.entry);
    return sortByRecent(filterEntries(entries, typeFilter ? { entryType: typeFilter } : {}));
  }, [entries, typeFilter, query]);

  const refresh = () => {
    utils.journal.list.invalidate();
    utils.journal.summary.invalidate();
    utils.journal.counts.invalidate();
  };

  const createM = trpc.journal.create.useMutation({
    onSuccess: (entry) => {
      refresh();
      toaster.success("Entry saved");
      setSelectedId(entry.id);
      timeline.emit({
        kind: "journal.created",
        source: "journal",
        title: entry.title || "Journal entry",
        meta: { id: entry.id },
      });
      analytics.track({ kind: "journal.created" });
    },
    onError: (e) => toaster.error("Couldn't save", e.message),
  });
  const updateM = trpc.journal.update.useMutation({ onSuccess: refresh });
  const archiveM = trpc.journal.archive.useMutation({
    onSuccess: () => {
      refresh();
      setSelectedId(null);
    },
  });
  const deleteM = trpc.journal.delete.useMutation({
    onSuccess: () => {
      refresh();
      setSelectedId(null);
    },
  });
  const reflectionM = trpc.journal.dailyReflection.useMutation({
    onSuccess: () => {
      refresh();
      utils.journal.reflections.invalidate();
      toaster.success("Reflection saved");
      timeline.emit({ kind: "reflection.completed", source: "journal", title: "Daily reflection" });
      analytics.track({ kind: "reflection.completed" });
    },
    onError: (e) => toaster.error("Couldn't save reflection", e.message),
  });
  const reviewM = trpc.journal.review.useMutation({
    onSuccess: () => {
      utils.journal.reviews.invalidate();
      toaster.success("Review created");
      timeline.emit({ kind: "review.completed", source: "journal", title: "Review" });
    },
  });

  return {
    entries,
    view,
    isLoading: listQuery.isLoading,
    summary: summaryQuery.data ?? null,
    prompts: promptsQuery.data ?? [],
    typeFilter,
    setTypeFilter,
    query,
    setQuery,
    selectedId,
    selected: entries.find((e) => e.id === selectedId) ?? null,
    select: (id: string | null) => setSelectedId(id),
    create: (input: CreateEntrySchemaInput) => createM.mutate(input),
    update: (input: Parameters<typeof updateM.mutate>[0]) => updateM.mutate(input),
    archive: (id: string) => archiveM.mutate({ id }),
    remove: (id: string) => deleteM.mutate({ id }),
    saveReflection: (input: Parameters<typeof reflectionM.mutate>[0]) => reflectionM.mutate(input),
    createReview: (period: "daily" | "weekly" | "monthly" | "yearly") => reviewM.mutate({ period }),
    pending: createM.isPending || updateM.isPending || archiveM.isPending || reflectionM.isPending,
  };
}
