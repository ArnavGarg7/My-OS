"use client";

import { useState } from "react";
import { PiggyBank } from "lucide-react";
import { Button, Input, Progress, Text } from "@myos/ui";
import type { SavingsProgress } from "@myos/core/finance";
import { formatMoney } from "./finance-icons";

/**
 * SavingsCard (Sprint 2.11). Savings goals with progress + an inline contribute
 * action. Projected completion comes from the pure engine.
 */
export function SavingsCard({
  goals,
  onContribute,
}: {
  goals: SavingsProgress[];
  onContribute?: (id: string, amount: number) => void;
}) {
  if (goals.length === 0) {
    return (
      <Text variant="body-s" tone="subtle">
        No savings goals — set one to track your progress.
      </Text>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      {goals.map((p) => (
        <GoalRow key={p.goal.id} progress={p} onContribute={onContribute} />
      ))}
    </div>
  );
}

function GoalRow({
  progress,
  onContribute,
}: {
  progress: SavingsProgress;
  onContribute?: ((id: string, amount: number) => void) | undefined;
}) {
  const [amount, setAmount] = useState("");
  const { goal } = progress;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5">
          <PiggyBank size={15} aria-hidden className="text-fg-subtle" />
          <Text variant="body-s">{goal.title}</Text>
        </span>
        <Text variant="caption" tone="subtle" className="tabular-nums">
          {formatMoney(goal.currentAmount)} / {formatMoney(goal.targetAmount)}
        </Text>
      </div>
      <Progress value={progress.progressPercent} />
      <Text variant="caption" tone="subtle">
        {progress.progressPercent}%
        {progress.projectedCompletion
          ? ` · projected ${new Date(progress.projectedCompletion).toLocaleDateString()}`
          : ""}
        {progress.onTrack ? "" : " · behind schedule"}
      </Text>
      {onContribute && (
        <div className="flex gap-2">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Add funds…"
            className="h-8"
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={!amount || Number(amount) <= 0}
            onClick={() => {
              onContribute(goal.id, Number(amount));
              setAmount("");
            }}
          >
            Contribute
          </Button>
        </div>
      )}
    </div>
  );
}
