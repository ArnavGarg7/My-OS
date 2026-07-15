"use client";

import { Check, Coffee, Pause, Play, X } from "lucide-react";
import { Button } from "@myos/ui";
import type { FocusSession } from "@myos/core/focus";

/**
 * SessionControls (Sprint 3.2). The primary lifecycle actions for the active session:
 * pause/resume, take a break, complete, cancel. Rendered beneath the timer.
 */
export function SessionControls({
  session,
  pending,
  onPause,
  onResume,
  onBreak,
  onComplete,
  onCancel,
}: {
  session: FocusSession;
  pending: boolean;
  onPause: () => void;
  onResume: () => void;
  onBreak: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const paused = session.status === "paused" || session.status === "break";
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {paused ? (
        <Button onClick={onResume} disabled={pending}>
          <Play size={14} aria-hidden /> Resume
        </Button>
      ) : (
        <Button variant="secondary" onClick={onPause} disabled={pending}>
          <Pause size={14} aria-hidden /> Pause
        </Button>
      )}
      <Button variant="secondary" onClick={onBreak} disabled={pending}>
        <Coffee size={14} aria-hidden /> Break
      </Button>
      <Button variant="primary" onClick={onComplete} disabled={pending}>
        <Check size={14} aria-hidden /> Complete
      </Button>
      <Button variant="ghost" onClick={onCancel} disabled={pending}>
        <X size={14} aria-hidden /> Cancel
      </Button>
    </div>
  );
}
