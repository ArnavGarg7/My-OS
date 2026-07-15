"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@myos/ui";
import { RECURRENCE_FREQUENCIES, type RecurrenceFrequency } from "@myos/core/task";

/**
 * Task recurrence control (Sprint 2.5). Sets a frequency + interval; the next
 * occurrence is generated when the task is completed (no background job).
 */
export function TaskRecurrence({
  onSet,
  pending,
}: {
  onSet: (frequency: RecurrenceFrequency, interval: number) => void;
  pending: boolean;
}) {
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("weekly");
  const [interval, setInterval] = useState("1");

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={1}
        value={interval}
        onChange={(e) => setInterval(e.target.value)}
        aria-label="Recurrence interval"
        className="w-16"
      />
      <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}>
        <SelectTrigger aria-label="Recurrence frequency" className="flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RECURRENCE_FREQUENCIES.map((f) => (
            <SelectItem key={f} value={f}>
              {f}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="secondary"
        loading={pending}
        onClick={() => onSet(frequency, Math.max(1, parseInt(interval, 10) || 1))}
      >
        Set
      </Button>
    </div>
  );
}
