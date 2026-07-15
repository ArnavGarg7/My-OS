"use client";

import { Sparkles, RefreshCw, Wand2, Trash2 } from "lucide-react";
import { Button, Badge } from "@myos/ui";
import type { usePlanner } from "./use-planner";

/**
 * Planner toolbar (Sprint 2.6): generate / regenerate · optimize · clear, plus
 * the day's status.
 */
export function PlannerToolbar({ planner }: { planner: ReturnType<typeof usePlanner> }) {
  const generated = planner.day?.status !== "empty" && planner.blocks.length > 0;

  return (
    <div className="border-border flex flex-wrap items-center gap-2 border-b p-4">
      <Button
        onClick={planner.generate}
        loading={planner.pending}
        leftIcon={
          generated ? <RefreshCw size={15} aria-hidden /> : <Sparkles size={15} aria-hidden />
        }
      >
        {generated ? "Regenerate" : "Generate Plan"}
      </Button>
      <Button
        variant="secondary"
        onClick={planner.optimize}
        disabled={planner.pending || !generated}
        leftIcon={<Wand2 size={15} aria-hidden />}
      >
        Optimize
      </Button>
      <Button
        variant="ghost"
        onClick={planner.clear}
        disabled={planner.pending || !generated}
        leftIcon={<Trash2 size={15} aria-hidden />}
      >
        Clear
      </Button>

      <div className="ml-auto flex items-center gap-2">
        {planner.conflicts.length > 0 ? (
          <Badge variant="warning" size="sm">
            {planner.conflicts.length} conflict{planner.conflicts.length === 1 ? "" : "s"}
          </Badge>
        ) : null}
        {planner.day ? (
          <Badge variant={generated ? "success" : "neutral"} size="sm">
            {planner.day.status}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
