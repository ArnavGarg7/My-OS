"use client";

import { useRouter } from "next/navigation";
import { CalendarClock, Sparkles } from "lucide-react";
import { Button, Text } from "@myos/ui";
import { usePlanner } from "@/components/planner/use-planner";

/**
 * Morning Briefing planner hand-off (Sprint 2.6). Replaces the old "coming
 * later" placeholder — when a plan exists it's ready to open; otherwise the user
 * can generate one. Decision recommendations flow straight into the Planner.
 */
export function MorningPlanSection() {
  const router = useRouter();
  const planner = usePlanner();
  const ready = planner.blocks.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <Text variant="body-m">
        {ready
          ? `Today's plan is ready — ${planner.blocks.length} blocks, ${planner.utilization?.percentUtilized ?? 0}% utilized.`
          : "No plan yet. Turn today's tasks into a timeline."}
      </Text>
      <div className="flex flex-wrap gap-2">
        {ready ? (
          <Button
            onClick={() => router.push("/planner")}
            leftIcon={<CalendarClock size={15} aria-hidden />}
          >
            Open Planner
          </Button>
        ) : (
          <Button
            onClick={() => {
              planner.generate();
              router.push("/planner");
            }}
            loading={planner.pending}
            leftIcon={<Sparkles size={15} aria-hidden />}
          >
            Generate Today's Plan
          </Button>
        )}
      </div>
    </div>
  );
}
