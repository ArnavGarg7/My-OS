"use client";

import { Repeat } from "lucide-react";
import { Text } from "@myos/ui";
import type { Subscription, SubscriptionSummary } from "@myos/core/finance";
import { CYCLE_LABEL, formatMoney } from "./finance-icons";

/**
 * SubscriptionsCard (Sprint 2.11). Recurring spend totals + the list of active
 * subscriptions with their next billing date.
 */
export function SubscriptionsCard({
  subscriptions,
  summary,
}: {
  subscriptions: Subscription[];
  summary: SubscriptionSummary | null;
}) {
  const active = subscriptions.filter((s) => s.active);
  return (
    <div className="flex flex-col gap-3">
      {summary && (
        <Text variant="body-s" tone="subtle">
          {formatMoney(summary.monthlyRecurring)}/mo · {formatMoney(summary.yearlyRecurring)}/yr
        </Text>
      )}
      {active.length === 0 ? (
        <Text variant="body-s" tone="subtle">
          No active subscriptions.
        </Text>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {active.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <Repeat size={14} aria-hidden className="text-fg-subtle shrink-0" />
              <div className="min-w-0 flex-1">
                <Text variant="body-s" className="truncate">
                  {s.name}
                </Text>
                <Text variant="caption" tone="subtle">
                  {CYCLE_LABEL[s.billingCycle]} · next{" "}
                  {new Date(s.nextPayment).toLocaleDateString()}
                </Text>
              </div>
              <Text variant="body-s" className="tabular-nums">
                {formatMoney(s.amount)}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
