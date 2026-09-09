"use client";

import Link from "next/link";
import { CalendarClock, Plug } from "lucide-react";
import { Badge, Button, MonoLabel, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";

const WRITE_REASON: Record<string, string> = {
  not_connected: "No calendar is connected.",
  no_live_credentials:
    "Connected in sample mode — configure live calendar credentials to write real events.",
  unknown_provider: "Unknown calendar provider.",
  unsupported_action: "This provider can't create events.",
  provider_error: "The calendar provider rejected the write.",
};

/**
 * EXTERNAL ↔ OS calendar bridge in the operating surface (Stage 4). Shows the
 * normalized calendar activity from connected calendar accounts (read-only,
 * source- and sample-labelled), and offers the MY OS → EXTERNAL write path
 * ("Add to external calendar") which returns an HONEST result — it never claims a
 * write succeeded against a service that isn't live-connected.
 */
export function CalendarExternal() {
  const activity = trpc.connectors.calendarActivity.useQuery(undefined, { staleTime: 120_000 });
  const create = trpc.connectors.createCalendarEvent.useMutation();

  const tryWrite = () => {
    const start = new Date();
    start.setHours(start.getHours() + 1, 0, 0, 0);
    create.mutate({
      title: "My OS event",
      startAt: start.toISOString(),
      endAt: new Date(start.getTime() + 30 * 60_000).toISOString(),
    });
  };

  if (activity.isLoading) {
    return (
      <section className="flex flex-col gap-2">
        <MonoLabel tone="subtle">External calendar</MonoLabel>
        <Text variant="body-s" tone="subtle">
          Checking connected calendars…
        </Text>
      </section>
    );
  }

  const connected = activity.data?.connected ?? false;
  const items = activity.data?.items ?? [];

  return (
    <section className="flex flex-col gap-2">
      <MonoLabel tone="subtle">External calendar</MonoLabel>
      {!connected ? (
        <div className="border-border bg-elevated flex flex-col gap-2 rounded-lg border p-3">
          <Text variant="body-s" tone="muted">
            No external calendar is connected. Connect one so its events inform your schedule,
            Today, and the Chief.
          </Text>
          <Button asChild variant="secondary" size="sm" className="self-start">
            <Link href="/connectors">
              <Plug size={13} aria-hidden /> Connect a calendar
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.length === 0 ? (
            <Text variant="body-s" tone="subtle">
              No calendar activity synced yet. Run a sync on the Connectors page.
            </Text>
          ) : (
            items.slice(0, 5).map((e) => (
              <div
                key={e.externalId}
                className="border-border bg-elevated flex flex-col gap-1 rounded-md border px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <CalendarClock size={13} aria-hidden className="text-fg-subtle shrink-0" />
                  <Text variant="body-s" truncate>
                    {e.label}
                  </Text>
                  {e.sample ? (
                    <Badge variant="warning" size="sm" className="shrink-0">
                      sample
                    </Badge>
                  ) : null}
                </div>
                <MonoLabel tone="subtle" className="pl-5">
                  {e.kind.replace("calendar.", "")}
                </MonoLabel>
              </div>
            ))
          )}
          <div className="mt-1 flex flex-col gap-1">
            <Button variant="secondary" size="sm" onClick={tryWrite} disabled={create.isPending}>
              {create.isPending ? "Writing…" : "Add to external calendar"}
            </Button>
            {create.data ? (
              create.data.ok ? (
                <Text variant="caption" tone="success">
                  Created on your external calendar.
                </Text>
              ) : (
                <Text variant="caption" tone="warning">
                  {WRITE_REASON[create.data.reason ?? ""] ?? "Couldn't write to the calendar."}
                </Text>
              )
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
