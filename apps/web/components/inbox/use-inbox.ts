"use client";

import { useMemo, useState } from "react";
import {
  inboxEngine,
  type CaptureType,
  type CaptureSource,
  type Destination,
  type InboxSort,
} from "@myos/core/inbox";
import { useToaster } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import { trpc } from "@/lib/trpc/client";

/**
 * Client inbox controller (Sprint 2.4). Fetches the full inbox once and derives
 * the current view deterministically with the pure engine (filter + search +
 * sort). Exposes the capture + lifecycle mutations. Selection is shared with the
 * context panel via the shell store.
 */
export function useInbox() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const selectedId = useShellStore((s) => s.selectedInboxId);
  const setSelectedId = useShellStore((s) => s.setSelectedInboxId);

  const [status, setStatus] = useState<"new" | "archived">("new");
  const [type, setType] = useState<CaptureType | null>(null);
  const [sort, setSort] = useState<InboxSort>("newest");
  const [text, setText] = useState("");

  const list = trpc.inbox.list.useQuery({ limit: 500 });
  const items = useMemo(() => list.data ?? [], [list.data]);

  const view = useMemo(() => {
    const trimmed = text.trim();
    if (trimmed) {
      return inboxEngine.search(items, {
        text: trimmed,
        status,
        ...(type ? { type } : {}),
      });
    }
    return inboxEngine.filter(items, { status, ...(type ? { type } : {}) }, sort);
  }, [items, text, status, type, sort]);

  const counts = useMemo(() => {
    let newCount = 0;
    let archived = 0;
    for (const item of items) {
      if (item.status === "new") newCount += 1;
      else if (item.status === "archived") archived += 1;
    }
    return { new: newCount, archived };
  }, [items]);

  const refresh = () => {
    utils.inbox.list.invalidate();
    utils.inbox.countNew.invalidate();
  };

  const captureM = trpc.inbox.capture.useMutation({
    onSuccess: (result) => {
      refresh();
      if (result.duplicates.length > 0) {
        toaster.info(
          "Captured — possible duplicate",
          `Matched ${result.duplicates.length} recent item(s).`,
        );
      } else {
        toaster.success("Captured to Inbox");
      }
    },
    onError: (e) => toaster.error("Couldn't capture", e.message),
  });

  const action = {
    onSuccess: () => refresh(),
    onError: (e: { message: string }) => toaster.error("Couldn't update item", e.message),
  };
  const archiveM = trpc.inbox.archive.useMutation(action);
  const deleteM = trpc.inbox.delete.useMutation(action);
  const restoreM = trpc.inbox.restore.useMutation(action);
  const organizeM = trpc.inbox.organize.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Organized");
    },
    onError: (e) => toaster.error("Couldn't organize", e.message),
  });

  return {
    items,
    view,
    isLoading: list.isLoading,
    counts,
    selected:
      view.find((i) => i.id === selectedId) ?? items.find((i) => i.id === selectedId) ?? null,
    selectedId,
    select: (id: string | null) => setSelectedId(id),
    // filter/search/sort state
    status,
    setStatus,
    type,
    setType,
    sort,
    setSort,
    text,
    setText,
    // mutations
    capture: (input: {
      type: CaptureType;
      content: string;
      title?: string;
      source?: CaptureSource;
    }) => captureM.mutate({ source: "quick_add", ...input }),
    archive: (id: string) => archiveM.mutate({ id }),
    remove: (id: string) => deleteM.mutate({ id }),
    restore: (id: string) => restoreM.mutate({ id }),
    organize: (id: string, destination: Destination) => organizeM.mutate({ id, destination }),
    capturePending: captureM.isPending,
    pending:
      captureM.isPending ||
      archiveM.isPending ||
      deleteM.isPending ||
      restoreM.isPending ||
      organizeM.isPending,
  };
}
