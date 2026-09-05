"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipForward, Timer } from "lucide-react";
import { Badge, Button, Card, MonoLabel, Text } from "@myos/ui";
import {
  DEFAULT_POMODORO,
  advance,
  phaseLabel,
  phaseMinutes,
  startState,
  type PomodoroState,
} from "@myos/core/interaction";
import { trpc } from "@/lib/trpc/client";
import { useToaster } from "@/lib/framework";

/**
 * Pomodoro (Stage 9). Extends the EXISTING Focus engine — it does NOT add a second timer.
 * A WORK phase is a real Focus session (focus.start/complete), so it produces genuine
 * session data + task actual-minutes; breaks are local countdowns (not sessions). The
 * countdown is timestamp-based (deadline − now), so it stays accurate across tab
 * backgrounding/sleep/offline, matching the Focus engine's own semantics.
 */
const config = DEFAULT_POMODORO;

export function PomodoroCard() {
  const toaster = useToaster();
  const utils = trpc.useUtils();
  const [pomo, setPomo] = useState<PomodoroState>(startState);
  const [deadline, setDeadline] = useState<number | null>(null); // epoch ms
  const [pausedRemaining, setPausedRemaining] = useState<number | null>(null); // ms, when paused
  const [remaining, setRemaining] = useState<number>(phaseMinutes(pomo.phase, config) * 60_000);
  const sessionIdRef = useRef<string | null>(null);

  const start = trpc.focus.start.useMutation();
  const complete = trpc.focus.complete.useMutation();
  const pauseM = trpc.focus.pause.useMutation();
  const resumeM = trpc.focus.resume.useMutation();

  const running = deadline !== null && pausedRemaining === null;

  // Timestamp-based tick — display only; truth is the deadline.
  useEffect(() => {
    if (!running || deadline === null) return;
    const tick = () => {
      const left = deadline - Date.now();
      setRemaining(Math.max(0, left));
      if (left <= 0) onPhaseComplete();
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, deadline]);

  const beginPhase = (state: PomodoroState) => {
    const ms = phaseMinutes(state.phase, config) * 60_000;
    setRemaining(ms);
    setPausedRemaining(null);
    if (state.phase === "work") {
      start.mutate(
        { type: "focus", plannedMinutes: config.workMinutes },
        {
          onSuccess: (session) => {
            sessionIdRef.current = session.id;
            setDeadline(Date.now() + ms);
          },
          onError: (e) => toaster.error("Couldn't start focus", e.message),
        },
      );
    } else {
      sessionIdRef.current = null;
      setDeadline(Date.now() + ms);
    }
  };

  const onPhaseComplete = () => {
    setDeadline(null);
    if (pomo.phase === "work" && sessionIdRef.current) {
      complete.mutate(
        { sessionId: sessionIdRef.current },
        { onSuccess: () => void utils.focus.invalidate() },
      );
      toaster.success("Focus session recorded");
    }
    const next = advance(pomo, config);
    setPomo(next);
    setRemaining(phaseMinutes(next.phase, config) * 60_000);
    // Auto-start breaks; wait for the user to start the next work phase (consent).
    if (next.phase !== "work") beginPhase(next);
  };

  const pause = () => {
    if (deadline === null) return;
    setPausedRemaining(Math.max(0, deadline - Date.now()));
    setDeadline(null);
    // Pause the real Focus session too (its timer is timestamp-based), so recorded minutes stay honest.
    if (pomo.phase === "work" && sessionIdRef.current)
      pauseM.mutate({ sessionId: sessionIdRef.current });
  };
  const resume = () => {
    if (pausedRemaining === null) return;
    setDeadline(Date.now() + pausedRemaining);
    setPausedRemaining(null);
    if (pomo.phase === "work" && sessionIdRef.current)
      resumeM.mutate({ sessionId: sessionIdRef.current });
  };

  const skip = () => onPhaseComplete();

  const mm = Math.floor(remaining / 60_000);
  const ss = Math.floor((remaining % 60_000) / 1000);
  const idle = deadline === null && pausedRemaining === null;

  return (
    <Card variant="standard" padding="lg" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer size={14} className="text-fg-subtle" aria-hidden />
          <MonoLabel tone="subtle">Pomodoro</MonoLabel>
        </div>
        <Badge size="sm" variant={pomo.phase === "work" ? "accent" : "neutral"}>
          {phaseLabel(pomo.phase)}
        </Badge>
      </div>

      <div className="flex items-baseline gap-2" aria-live="polite">
        <Text variant="display-l" className="tabular-nums tracking-tight">
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </Text>
        <Text variant="caption" tone="subtle">
          cycle {pomo.completedWorkCycles} · {config.workMinutes}/{config.shortBreakMinutes}/
          {config.longBreakMinutes}
        </Text>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {idle ? (
          <Button
            size="sm"
            variant="primary"
            onClick={() => beginPhase(pomo)}
            disabled={start.isPending}
            leftIcon={<Play size={13} aria-hidden />}
          >
            Start {phaseLabel(pomo.phase)}
          </Button>
        ) : running ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={pause}
            leftIcon={<Pause size={13} aria-hidden />}
          >
            Pause
          </Button>
        ) : (
          <Button
            size="sm"
            variant="primary"
            onClick={resume}
            leftIcon={<Play size={13} aria-hidden />}
          >
            Resume
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={skip}
          disabled={idle}
          leftIcon={<SkipForward size={13} aria-hidden />}
        >
          Skip
        </Button>
      </div>
      <Text variant="caption" tone="subtle">
        Work phases record real Focus sessions. Breaks are local.
      </Text>
    </Card>
  );
}
