"use client";

import { Link2, Pin } from "lucide-react";
import { Badge, Button, Text } from "@myos/ui";
import type { TimelineEvent } from "@myos/core/timeline";
import { SOURCE_LABEL, clockTime, eventIcon, relativeTime } from "./timeline-icons";

/**
 * TimelineInspector (Sprint 2.13). Details for the selected event — its title,
 * source, importance, metadata, plus neighbouring + entity-related events. Pin
 * promotes it to a memory. Pure presentational; data comes from the page.
 */
export function TimelineInspector({
  event,
  neighbors,
  related,
  onSelect,
  onPin,
  pinning,
}: {
  event: TimelineEvent;
  neighbors: { previous: TimelineEvent | null; next: TimelineEvent | null };
  related: TimelineEvent[];
  onSelect: (id: string) => void;
  onPin: (eventId: string) => void;
  pinning?: boolean;
}) {
  const Icon = eventIcon(event);
  const metaEntries = Object.entries(event.metadata).filter(
    ([, v]) => typeof v === "string" || typeof v === "number" || typeof v === "boolean",
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-start gap-2">
        <Icon size={18} aria-hidden className="text-accent mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <Text variant="heading-s">{event.title}</Text>
          <Text variant="caption" tone="subtle">
            {SOURCE_LABEL[event.source]} · {clockTime(event.timestamp)} ·{" "}
            {relativeTime(event.timestamp)}
          </Text>
        </div>
        <Badge size="sm" variant={event.importance >= 85 ? "accent" : "neutral"}>
          {event.importance}
        </Badge>
      </div>

      {event.summary && event.summary !== event.title ? (
        <Text variant="body-s" tone="subtle">
          {event.summary}
        </Text>
      ) : null}

      <Button
        size="sm"
        variant="secondary"
        onClick={() => onPin(event.id)}
        loading={pinning ?? false}
      >
        <Pin size={13} aria-hidden />
        Pin as memory
      </Button>

      {metaEntries.length > 0 && (
        <div className="flex flex-col gap-1">
          <Text variant="label" tone="subtle">
            Details
          </Text>
          <dl className="text-caption grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            {metaEntries.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-fg-subtle">{k}</dt>
                <dd className="text-fg-muted truncate">{String(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {related.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5">
            <Link2 size={13} aria-hidden className="text-fg-subtle" />
            <Text variant="label" tone="subtle">
              Related to this entity
            </Text>
          </span>
          <ul className="flex flex-col gap-1">
            {related.slice(0, 6).map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onSelect(r.id)}
                  className="hover:text-fg text-body-s text-fg-muted text-left"
                >
                  {r.title} · {relativeTime(r.timestamp)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-border flex items-center justify-between border-t pt-2">
        <Button
          size="sm"
          variant="ghost"
          disabled={!neighbors.previous}
          onClick={() => neighbors.previous && onSelect(neighbors.previous.id)}
        >
          ← Newer
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={!neighbors.next}
          onClick={() => neighbors.next && onSelect(neighbors.next.id)}
        >
          Older →
        </Button>
      </div>
    </div>
  );
}
