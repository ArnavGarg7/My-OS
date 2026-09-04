"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Radar, X, Zap } from "lucide-react";
import { Badge, Button, Card, MonoLabel, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { useFocusLauncher } from "@/lib/focus/use-focus-launcher";
import type { ProactiveInterventionView } from "@/server/proactive/service";

const PRIORITY_TONE: Record<string, "success" | "accent" | "warning" | "danger" | "neutral"> = {
  critical: "danger",
  high: "warning",
  medium: "accent",
  low: "neutral",
  silent: "neutral",
};

/**
 * Proactive OS panel (Stage 6). The notification center's distinct "OS Interventions"
 * surface — separate from ordinary system notifications, because proactivity is a core
 * product capability, not generic alerts. Shows what the OS decided deserves attention,
 * each with grounded evidence ("Why this?") and a real action. Includes the master on/off
 * control (user stays in charge) and a teaching empty state that reinforces the concept.
 */
export function ProactivePanel() {
  const router = useRouter();
  const focus = useFocusLauncher();
  const utils = trpc.useUtils();

  const settings = trpc.proactive.settings.useQuery();
  const list = trpc.proactive.interventions.useQuery(undefined, { refetchInterval: 120_000 });
  const setEnabled = trpc.proactive.setEnabled.useMutation({
    onSuccess: () => {
      void utils.proactive.settings.invalidate();
      void utils.proactive.interventions.invalidate();
      void utils.proactive.forCommandCenter.invalidate();
    },
  });
  const dismiss = trpc.notification.dismiss.useMutation({
    onSuccess: () => {
      void utils.proactive.interventions.invalidate();
      void utils.proactive.forCommandCenter.invalidate();
      void utils.notification.active.invalidate();
      void utils.notification.count.invalidate();
    },
  });

  const enabled = settings.data?.enabled ?? true;
  const interventions = list.data ?? [];

  return (
    <Card variant="standard" padding="lg" className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="bg-accent-muted text-accent flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Radar size={15} aria-hidden />
          </span>
          <div className="flex flex-col gap-0.5">
            <MonoLabel tone="accent">OS interventions</MonoLabel>
            <Text variant="body-s" tone="muted">
              Things My OS proactively surfaced — grounded, and only when they cross a threshold.
            </Text>
          </div>
        </div>
        <Button
          size="sm"
          variant={enabled ? "ghost" : "secondary"}
          disabled={setEnabled.isPending}
          onClick={() => setEnabled.mutate({ enabled: !enabled })}
        >
          {enabled ? "Proactive: On" : "Proactive: Off"}
        </Button>
      </div>

      {!enabled ? (
        <Text variant="body-s" tone="subtle">
          Proactive OS is off. My OS won't surface interventions until you turn it back on.
        </Text>
      ) : interventions.length === 0 ? (
        <div className="border-border rounded-lg border border-dashed px-4 py-6 text-center">
          <Text variant="body-m" className="font-medium">
            You&rsquo;re clear.
          </Text>
          <Text variant="body-s" tone="subtle" className="mt-1">
            My OS will surface something here when your schedule, workload, or decisions need
            attention.
          </Text>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {interventions.map((i) => (
            <InterventionRow
              key={i.id}
              intervention={i}
              pending={focus.pending}
              onFocus={(taskId) => focus.startFocusOnTask(taskId)}
              onNavigate={(href) => router.push(href)}
              onDismiss={(id) => dismiss.mutate({ id })}
              dismissing={dismiss.isPending}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

function InterventionRow({
  intervention: i,
  pending,
  onFocus,
  onNavigate,
  onDismiss,
  dismissing,
}: {
  intervention: ProactiveInterventionView;
  pending: boolean;
  onFocus: (taskId: string) => void;
  onNavigate: (href: string) => void;
  onDismiss: (id: string) => void;
  dismissing: boolean;
}) {
  const [showWhy, setShowWhy] = useState(false);
  return (
    <li className="border-border bg-elevated flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <Text variant="body-m" className="font-medium">
          {i.title}
        </Text>
        <Badge size="sm" variant={PRIORITY_TONE[i.priority] ?? "neutral"}>
          {i.priority}
        </Badge>
      </div>
      <Text variant="body-s" tone="subtle">
        {i.reason}
      </Text>
      {i.detail.length > 0 ? (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setShowWhy((v) => !v)}
            className="text-fg-subtle hover:text-fg self-start text-[12px] underline underline-offset-2"
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
      <div className="flex flex-wrap items-center gap-1.5">
        {i.action ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              i.action!.kind === "focus" ? onFocus(i.action!.taskId) : onNavigate(i.action!.href)
            }
            leftIcon={
              i.action.kind === "focus" ? (
                <Zap size={12} aria-hidden />
              ) : (
                <ArrowRight size={12} aria-hidden />
              )
            }
          >
            {i.action.label}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          disabled={dismissing}
          onClick={() => onDismiss(i.id)}
          leftIcon={<X size={12} aria-hidden />}
        >
          Dismiss
        </Button>
      </div>
    </li>
  );
}
