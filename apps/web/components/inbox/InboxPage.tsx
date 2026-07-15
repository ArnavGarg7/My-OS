"use client";

import { PageContainer, PageContent, PageLoading } from "@/components/framework";
import { useShellStore } from "@/lib/shell/store";
import { useInbox } from "./use-inbox";
import { InboxToolbar } from "./InboxToolbar";
import { InboxList } from "./InboxList";

/**
 * Inbox page (Sprint 2.4). Apple Mail–style editorial list: a fixed toolbar on
 * top (search · filter · sort · capture) and a scrollable list beneath.
 * Selecting a row opens it in the shared context panel.
 */
export function InboxPage() {
  const inbox = useInbox();
  const openContextPanel = useShellStore((s) => s.setContextPanelOpen);

  const select = (id: string) => {
    inbox.select(id);
    openContextPanel(true);
  };

  if (inbox.isLoading) return <PageLoading label="Loading your inbox…" />;

  const emptyLabel =
    inbox.status === "archived"
      ? "Nothing archived yet."
      : inbox.text.trim()
        ? "No items match your search."
        : "Your inbox is clear. Capture anything to get started.";

  return (
    <PageContainer width="full" className="p-0">
      <PageContent className="gap-0 p-0">
        <InboxToolbar inbox={inbox} />
        <InboxList
          items={inbox.view}
          selectedId={inbox.selectedId}
          onSelect={select}
          emptyLabel={emptyLabel}
        />
      </PageContent>
    </PageContainer>
  );
}
