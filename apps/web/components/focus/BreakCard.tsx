"use client";

import { Coffee, Play } from "lucide-react";
import { Button, Text } from "@myos/ui";
import type { FocusSession } from "@myos/core/focus";
import { BREAK_ICON } from "./focus-icons";
import { formatMinutes } from "./format";

/**
 * BreakCard (Sprint 3.2). Shown while the session is on a break — the current break's
 * type + planned length, with a resume action. Deterministic; the engine chose the
 * break type from the break rules.
 */
export function BreakCard({
  session,
  onResume,
  pending,
}: {
  session: FocusSession;
  onResume: () => void;
  pending: boolean;
}) {
  const current = session.breaks.find((b) => b.endedAt === null);
  const Icon = current ? BREAK_ICON[current.type] : Coffee;
  return (
    <div className="border-border bg-inset flex flex-col items-center gap-3 rounded-xl border p-6 text-center">
      <Icon size={28} aria-hidden className="text-accent" />
      <Text variant="heading-s">On a break</Text>
      {current ? (
        <Text variant="body-s" tone="subtle">
          {formatMinutes(current.plannedMinutes)} · {current.type}
        </Text>
      ) : null}
      <Button onClick={onResume} disabled={pending}>
        <Play size={14} aria-hidden /> Resume focus
      </Button>
    </div>
  );
}
