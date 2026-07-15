"use client";

import { Sparkles } from "lucide-react";
import { Badge, Checkbox, EmptyState, Text, cn } from "@myos/ui";
import type { CarryForwardList } from "@myos/core/tomorrow";

/**
 * CarryForward (Sprint 3.1). Step 2 — unfinished work the user can explicitly
 * carry into tomorrow. Nothing moves unless it is checked. Read-only otherwise.
 */
export function CarryForward({
  list,
  accepted,
  onToggle,
}: {
  list: CarryForwardList;
  accepted: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (list.total === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Nothing to carry forward"
        description="A clean close — nothing unfinished is waiting on tomorrow."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {list.overloaded ? (
        <Text variant="body-s" tone="danger">
          {list.total} items are unfinished — carry only the vital few.
        </Text>
      ) : (
        <Text variant="body-s" tone="subtle">
          {list.total} items could move to tomorrow. You choose what carries.
        </Text>
      )}
      <ul className="flex flex-col gap-1.5">
        {list.items.map((c) => (
          <li key={c.id}>
            <label
              className={cn(
                "border-border flex cursor-pointer items-start gap-2.5 rounded-md border p-2.5",
                accepted.has(c.id) && "border-accent bg-accent/5",
              )}
            >
              <Checkbox checked={accepted.has(c.id)} onCheckedChange={() => onToggle(c.id)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Text variant="body-s" className="truncate">
                    {c.title}
                  </Text>
                  <Badge size="sm" variant="neutral" className="capitalize">
                    {c.kind.replace("_", " ")}
                  </Badge>
                </div>
                <Text variant="caption" tone="subtle">
                  {c.reason}
                </Text>
              </div>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
