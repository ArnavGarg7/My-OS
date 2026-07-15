"use client";

import { Pin, PinOff } from "lucide-react";
import { Button, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { useToaster } from "@/lib/framework";
import { MEMORY_ICON } from "./timeline-icons";

/**
 * TimelineMemories (Sprint 2.13). Pinned / promoted memories, driven by
 * `timeline.memories`. Memories are rule-promoted; the user can unpin them.
 */
export function TimelineMemories() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const memories = trpc.timeline.memories.useQuery();
  const unpin = trpc.timeline.unpinMemory.useMutation({
    onSuccess: () => {
      utils.timeline.memories.invalidate();
      toaster.success("Memory unpinned");
    },
  });

  const data = memories.data ?? [];
  if (data.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        No memories yet — your milestones are promoted here automatically.
      </Text>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {data.map((m) => {
        const Icon = MEMORY_ICON[m.memoryType];
        return (
          <li key={m.id} className="border-border flex items-start gap-2 rounded-md border p-2">
            <Icon size={14} aria-hidden className="text-accent mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <Text variant="body-s" className="truncate">
                {m.title}
              </Text>
              <Text variant="caption" tone="subtle" className="capitalize">
                {m.memoryType} · {new Date(m.at).toLocaleDateString()}
              </Text>
            </div>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Unpin memory"
              onClick={() => unpin.mutate({ id: m.id })}
            >
              {m.pinned ? <Pin size={13} aria-hidden /> : <PinOff size={13} aria-hidden />}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
