"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, X, Zap } from "lucide-react";
import { Badge, Button, Card, MonoLabel, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { useFocusLauncher } from "@/lib/focus/use-focus-launcher";

const PRIORITY_TONE: Record<string, "success" | "accent" | "warning" | "danger" | "neutral"> = {
  critical: "danger",
  high: "warning",
  medium: "accent",
  low: "neutral",
  silent: "neutral",
};

/**
 * OS Recommends (Stage 6). The Command Center's proactive surface — the single most
 * important thing the OS believes deserves the user's attention right now, decided by
 * the deterministic proactive evaluator (grounded Signals + workload realism + decisions
 * + inbox). It COMPLEMENTS the Next Action rather than replacing it, and renders NOTHING
 * when the OS is clear (so the Command Center stays operational, never a notification dump).
 *
 * The action is real: a focus recommendation starts a task-anchored deep-work session
 * (the Stage 2 seam); everything else routes to the surface that owns it. No dead buttons.
 * "Why this?" answers the interruption honestly from grounded evidence. Dismiss respects
 * the user — the same condition then rests (server-side cooldown) instead of re-nagging.
 */
export function OsRecommendsCard() {
  const router = useRouter();
  const focus = useFocusLauncher();
  const utils = trpc.useUtils();
  const [showWhy, setShowWhy] = useState(false);

  const query = trpc.proactive.forCommandCenter.useQuery(undefined, {
    refetchInterval: 120_000,
    staleTime: 60_000,
  });
  const dismiss = trpc.notification.dismiss.useMutation({
    onSuccess: () => {
      void utils.proactive.forCommandCenter.invalidate();
      void utils.proactive.interventions.invalidate();
      void utils.notification.active.invalidate();
      void utils.notification.count.invalidate();
    },
  });

  const data = query.data;
  if (!data || !data.enabled || !data.intervention) return null;
  const i = data.intervention;

  const runAction = () => {
    if (!i.action) return;
    if (i.action.kind === "focus") {
      focus.startFocusOnTask(i.action.taskId);
    } else {
      router.push(i.action.href);
    }
  };

  return (
    <Card variant="insight" padding="lg" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="bg-accent-muted text-accent flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Sparkles size={15} aria-hidden />
          </span>
          <div className="flex flex-col gap-0.5">
            <MonoLabel tone="accent">OS recommends</MonoLabel>
            <Text variant="heading-s">{i.title}</Text>
          </div>
        </div>
        <Badge variant={PRIORITY_TONE[i.priority] ?? "neutral"} size="sm">
          {i.priority}
        </Badge>
      </div>

      <Text variant="body-s" tone="muted">
        {i.reason}
      </Text>

      {/* Why this? — grounded evidence, so the interruption is never unexplained. */}
      {i.detail.length > 0 ? (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setShowWhy((v) => !v)}
            className="text-fg-subtle hover:text-fg self-start text-left text-[12px] underline underline-offset-2"
          >
            {showWhy ? "Hide reasoning" : "Why this?"}
          </button>
          {showWhy ? (
            <ul className="flex flex-col gap-0.5 pl-1">
              {i.detail.map((d, idx) => (
                <li key={idx} className="text-body-s text-fg-muted flex gap-2">
                  <span aria-hidden className="text-fg-subtle">
                    ·
                  </span>
                  {d}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="border-border flex flex-wrap items-center gap-2 border-t pt-3">
        {i.action ? (
          <Button
            variant="primary"
            size="sm"
            disabled={focus.pending}
            onClick={runAction}
            leftIcon={
              i.action.kind === "focus" ? (
                <Zap size={13} aria-hidden />
              ) : (
                <ArrowRight size={13} aria-hidden />
              )
            }
          >
            {i.action.label}
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          disabled={dismiss.isPending}
          onClick={() => dismiss.mutate({ id: i.id })}
          leftIcon={<X size={13} aria-hidden />}
        >
          Dismiss
        </Button>
      </div>
    </Card>
  );
}
