"use client";

import { useEffect, useRef } from "react";
import { selectCurrentDecision, type DeferOption } from "@myos/core/decision";
import { useToaster } from "@/lib/framework";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";

/**
 * Client decision controller (Sprint 2.3). Reads the day's decisions (shared
 * query), fires generation on mount for the primary consumer, and exposes the
 * lifecycle mutations. Each action re-generates to recalculate the remaining set.
 */
export function useDecisions(options?: { generateOnMount?: boolean }) {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();

  const list = trpc.today.listDecisions.useQuery({});
  const generate = trpc.today.generateDecision.useMutation({
    onSuccess: () => utils.today.listDecisions.invalidate(),
  });

  const afterAction = {
    onSuccess: () => generate.mutate(),
    onError: (e: { message: string }) => toaster.error("Couldn't update decision", e.message),
  };
  const acceptM = trpc.today.acceptDecision.useMutation({
    onSuccess: (d) => {
      generate.mutate();
      timeline.emit({
        kind: "decision.accepted",
        source: "decision",
        title: d.title,
        meta: { id: d.id },
      });
      analytics.track({ kind: "decision.accepted" });
    },
    onError: (e: { message: string }) => toaster.error("Couldn't update decision", e.message),
  });
  const dismissM = trpc.today.dismissDecision.useMutation({
    onSuccess: (d) => {
      generate.mutate();
      timeline.emit({
        kind: "decision.dismissed",
        source: "decision",
        title: d.title,
        meta: { id: d.id },
      });
      analytics.track({ kind: "decision.dismissed" });
    },
    onError: (e: { message: string }) => toaster.error("Couldn't update decision", e.message),
  });
  const deferM = trpc.today.deferDecision.useMutation(afterAction);
  const completeM = trpc.today.completeDecision.useMutation(afterAction);

  const started = useRef(false);
  useEffect(() => {
    if (options?.generateOnMount && !started.current) {
      started.current = true;
      generate.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decisions = list.data ?? [];
  const pending =
    acceptM.isPending ||
    dismissM.isPending ||
    deferM.isPending ||
    completeM.isPending ||
    generate.isPending;

  return {
    decisions,
    current: selectCurrentDecision(decisions),
    isLoading: list.isLoading,
    pending,
    accept: (id: string) => acceptM.mutate({ id }),
    dismiss: (id: string) => dismissM.mutate({ id }),
    defer: (id: string, option: DeferOption) => deferM.mutate({ id, option }),
    complete: (id: string) => completeM.mutate({ id }),
    regenerate: () => generate.mutate(),
  };
}
