"use client";

import { useState } from "react";
import { Button, Text } from "@myos/ui";
import { SESSION_TYPES, type SessionType } from "@myos/core/focus";
import { SESSION_TYPE_ICON, SESSION_TYPE_LABEL } from "./focus-icons";

/**
 * StartPanel (Sprint 3.2). The idle state — pick a session type + duration and begin.
 * Meeting/break/recovery are excluded here (they are not user-started focus work).
 */
const STARTABLE: SessionType[] = SESSION_TYPES.filter(
  (t) => t !== "meeting" && t !== "break" && t !== "recovery",
);
const DURATIONS = [25, 50, 90];

export function StartPanel({
  onStart,
  pending,
}: {
  onStart: (type: SessionType, minutes: number) => void;
  pending: boolean;
}) {
  const [type, setType] = useState<SessionType>("deep_work");
  const [minutes, setMinutes] = useState(50);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-10 text-center">
      <div className="flex flex-col gap-1">
        <Text variant="heading-m">Ready to focus?</Text>
        <Text variant="body-s" tone="subtle">
          Pick a mode and length, then start deep work.
        </Text>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {STARTABLE.map((t) => {
          const Icon = SESSION_TYPE_ICON[t];
          return (
            <Button
              key={t}
              size="sm"
              variant={type === t ? "primary" : "secondary"}
              onClick={() => setType(t)}
            >
              <Icon size={13} aria-hidden /> {SESSION_TYPE_LABEL[t]}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {DURATIONS.map((d) => (
          <Button
            key={d}
            size="sm"
            variant={minutes === d ? "subtle" : "ghost"}
            onClick={() => setMinutes(d)}
          >
            {d}m
          </Button>
        ))}
      </div>

      <Button size="lg" onClick={() => onStart(type, minutes)} disabled={pending}>
        Start {SESSION_TYPE_LABEL[type]}
      </Button>
    </div>
  );
}
