"use client";

import { Button, Text } from "@myos/ui";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useToaster } from "@/lib/framework";
import { useShellStore } from "@/lib/shell/store";
import { useInbox } from "./use-inbox";
import { InboxViewer } from "./InboxViewer";
import { InboxMetadata } from "./InboxMetadata";
import { InboxSuggestions } from "./InboxSuggestions";
import { InboxProjectAttach } from "./InboxProjectAttach";

/**
 * Inbox context panel (Sprint 2.4). When an item is selected it shows the full
 * content, metadata, capture source, suggested destinations, and any related
 * decisions. Otherwise a hint to select something.
 */
function PanelSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <Text variant="label" tone="subtle">
        {label}
      </Text>
      {children}
    </section>
  );
}

export function InboxContextPanel() {
  const inbox = useInbox();
  const router = useRouter();
  const toaster = useToaster();
  const utils = trpc.useUtils();
  const setSelectedTaskId = useShellStore((s) => s.setSelectedTaskId);
  const item = inbox.selected;

  const convert = trpc.task.convertInbox.useMutation({
    onSuccess: (task) => {
      utils.inbox.list.invalidate();
      utils.task.list.invalidate();
      utils.task.counts.invalidate();
      toaster.success("Created task", task.title);
    },
    onError: (e) => toaster.error("Couldn't create task", e.message),
  });

  // Related decisions = anything the engine raised about the inbox.
  const decisions = trpc.today.listDecisions.useQuery({});
  const related = (decisions.data ?? []).filter((d) => d.ruleId === "inbox-overflow");

  const linkedTaskId =
    item && typeof item.metadata["organizedToTaskId"] === "string"
      ? (item.metadata["organizedToTaskId"] as string)
      : null;

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <Text variant="body-s" tone="subtle">
          Select an item to see its content, metadata, and where it might belong.
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <PanelSection label="Content">
        <InboxViewer
          item={item}
          onArchive={() => inbox.archive(item.id)}
          onDelete={() => inbox.remove(item.id)}
          onRestore={() => inbox.restore(item.id)}
          onConvert={() => convert.mutate({ inboxId: item.id })}
          converted={linkedTaskId !== null}
          pending={inbox.pending || convert.isPending}
        />
      </PanelSection>

      {linkedTaskId ? (
        <PanelSection label="Linked task">
          <div className="flex items-center justify-between gap-2">
            <Text variant="body-s" tone="muted">
              Created from this capture.
            </Text>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSelectedTaskId(linkedTaskId);
                router.push("/tasks");
              }}
            >
              Jump to Task
            </Button>
          </div>
          <InboxProjectAttach taskId={linkedTaskId} />
        </PanelSection>
      ) : null}

      <PanelSection label="Metadata">
        <InboxMetadata item={item} />
      </PanelSection>

      <PanelSection label="Suggested destination">
        <InboxSuggestions
          itemId={item.id}
          onOrganize={(destination) => inbox.organize(item.id, destination)}
          onConvert={() => convert.mutate({ inboxId: item.id })}
          converted={linkedTaskId !== null}
          pending={inbox.pending || convert.isPending}
        />
      </PanelSection>

      <PanelSection label="Related decisions">
        {related.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {related.map((d) => (
              <li key={d.id} className="text-body-s text-fg-muted">
                {d.title}
              </li>
            ))}
          </ul>
        ) : (
          <Text variant="body-s" tone="subtle">
            No decisions reference the inbox right now.
          </Text>
        )}
      </PanelSection>
    </div>
  );
}
