"use client";

import { useState } from "react";
import { Check, Stethoscope } from "lucide-react";
import { Button, EmptyState, Input, Text } from "@myos/ui";
import type { DoctorAppointment } from "@myos/core/life";

/**
 * DoctorAppointments (Sprint 4.2). Schedule + complete appointments. Upcoming ones feed
 * the "doctor appointment soon" decision signal.
 */
export function DoctorAppointments({
  appointments,
  onAdd,
  onComplete,
}: {
  appointments: DoctorAppointment[];
  onAdd: (input: { title: string; date: string; provider?: string }) => void;
  onComplete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Appointment…"
          aria-label="Appointment title"
        />
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Appointment date"
          className="w-40"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            if (!title.trim() || !date) return;
            onAdd({ title: title.trim(), date });
            setTitle("");
            setDate("");
          }}
        >
          Add
        </Button>
      </div>
      {appointments.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No appointments"
          description="Schedule doctor appointments."
        />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {appointments.map((a) => (
            <li
              key={a.id}
              className="border-border-subtle flex items-center justify-between rounded-md border px-3 py-2"
            >
              <span className="flex flex-col">
                <Text variant="body-s">{a.title}</Text>
                <Text variant="caption" tone="subtle">
                  {a.date}
                  {a.time ? ` · ${a.time}` : ""}
                  {a.provider ? ` · ${a.provider}` : ""}
                </Text>
              </span>
              {!a.completed ? (
                <Button size="sm" variant="ghost" onClick={() => onComplete(a.id)}>
                  <Check size={13} aria-hidden /> Done
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
