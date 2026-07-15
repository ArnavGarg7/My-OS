"use client";

import { MoonStar } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, Text } from "@myos/ui";
import { trpc } from "@/lib/trpc/client";
import { useShellStore } from "@/lib/shell/store";

/**
 * QuickTomorrow (Sprint 3.1). A compact entry point (e.g. Morning/Today) into
 * Tomorrow Studio, showing whether tonight's plan is ready.
 */
export function QuickTomorrow() {
  const router = useRouter();
  const setStep = useShellStore((s) => s.setTomorrowStep);
  const counts = trpc.tomorrow.counts.useQuery();
  const c = counts.data;

  return (
    <div className="border-border flex items-center gap-3 rounded-md border p-3">
      <MoonStar size={18} aria-hidden className="text-accent shrink-0" />
      <div className="min-w-0 flex-1">
        <Text variant="body-s">Plan tomorrow</Text>
        <Text variant="caption" tone="subtle">
          {c
            ? c.ready
              ? "Tomorrow is ready"
              : `${c.priorityCount} priorities · ${c.carryForwardCount} to carry`
            : "Close today and prepare tomorrow"}
        </Text>
      </div>
      <Button
        size="sm"
        onClick={() => {
          setStep("review");
          router.push("/tomorrow");
        }}
      >
        Open Studio
      </Button>
    </div>
  );
}
