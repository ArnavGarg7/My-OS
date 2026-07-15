"use client";

import { Lock, LockOpen, ChevronUp, ChevronDown } from "lucide-react";
import { Button, Text, Spinner } from "@myos/ui";
import type { PlannerBlock } from "@myos/core/planner";
import { trpc } from "@/lib/trpc/client";
import { BLOCK_LABEL } from "./planner-icons";
import { PlannerBlockProject } from "./PlannerBlockProject";

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Block inspector (Sprint 2.6). Details + lock/move controls + the deterministic
 * explanation of why the block was placed where it is.
 */
export function PlannerInspector({
  block,
  onLock,
  onUnlock,
  onMove,
  pending,
}: {
  block: PlannerBlock;
  onLock: () => void;
  onUnlock: () => void;
  onMove: (direction: "earlier" | "later") => void;
  pending: boolean;
}) {
  const explanation = trpc.planner.explain.useQuery({ id: block.id }, { enabled: !!block.id });

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Text variant="heading-s">{block.title}</Text>
        <Text variant="caption" tone="subtle">
          {BLOCK_LABEL[block.type]} · {time(block.startTime)}–{time(block.endTime)}
        </Text>
        <div className="mt-1">
          <PlannerBlockProject taskId={block.taskId} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {block.locked ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={onUnlock}
            disabled={pending}
            leftIcon={<LockOpen size={13} aria-hidden />}
          >
            Unlock
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={onLock}
            disabled={pending}
            leftIcon={<Lock size={13} aria-hidden />}
          >
            Lock
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onMove("earlier")}
          disabled={pending}
          leftIcon={<ChevronUp size={13} aria-hidden />}
        >
          Earlier
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onMove("later")}
          disabled={pending}
          leftIcon={<ChevronDown size={13} aria-hidden />}
        >
          Later
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Text variant="label" tone="subtle">
          Why here?
        </Text>
        {explanation.isLoading ? (
          <Spinner size="sm" />
        ) : (
          <ul className="flex flex-col gap-1">
            {(explanation.data?.reasons ?? []).map((r, i) => (
              <li key={i} className="text-body-s text-fg-muted flex gap-2">
                <span aria-hidden className="text-fg-subtle">
                  ·
                </span>
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
