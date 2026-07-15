"use client";

import { AlertTriangle, Repeat, Wallet } from "lucide-react";
import { Text } from "@myos/ui";
import { formatMoney } from "@/components/finance/finance-icons";
import { trpc } from "@/lib/trpc/client";

/**
 * Morning Briefing finance slot (Sprint 2.11). Editorial, read-only: today's
 * payments, budget status, the next subscription and cash available. Derived
 * server-side via the finance summary.
 */
export function MorningFinanceSection() {
  const summary = trpc.finance.summary.useQuery();
  const s = summary.data;
  if (!s) return null;

  const nextSub = s.subscriptions.upcoming[0] ?? null;
  const exceeded = s.budgets.filter((b) => b.state === "exceeded").length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Wallet size={16} aria-hidden className="text-fg-subtle" />
        <Text variant="body-m">
          {formatMoney(s.cashAvailable)} available · budget {s.overallBudgetPercent}% used
        </Text>
      </div>

      {exceeded > 0 && (
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} aria-hidden className="text-danger" />
          <Text variant="body-s">
            {exceeded} budget{exceeded === 1 ? "" : "s"} exceeded
          </Text>
        </div>
      )}

      {nextSub && (
        <div className="flex items-center gap-2">
          <Repeat size={15} aria-hidden className="text-fg-subtle" />
          <Text variant="body-s" tone="subtle">
            {nextSub.name} · {formatMoney(nextSub.amount)}{" "}
            {nextSub.dueInDays <= 0 ? "due today" : `in ${nextSub.dueInDays}d`}
          </Text>
        </div>
      )}
    </div>
  );
}
