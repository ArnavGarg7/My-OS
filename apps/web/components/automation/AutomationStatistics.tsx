"use client";

import { StatBlock, Text } from "@myos/ui";
import type { AutomationPortfolio } from "@myos/core/automation";

/**
 * AutomationStatistics (Sprint 3.4). Portfolio-level derived stats — executions,
 * successes, failures, pending approvals. Always derived from history.
 */
export function AutomationStatistics({ portfolio }: { portfolio: AutomationPortfolio }) {
  return (
    <div className="flex flex-col gap-3">
      <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
        Statistics
      </Text>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatBlock label="Rules" value={String(portfolio.totalRules)} />
        <StatBlock label="Enabled" value={String(portfolio.enabledRules)} />
        <StatBlock label="Today" value={String(portfolio.executionsToday)} />
        <StatBlock label="Succeeded" value={String(portfolio.successesToday)} />
        <StatBlock label="Failed" value={String(portfolio.failuresToday)} />
        <StatBlock label="Pending" value={String(portfolio.pendingApprovals)} />
      </div>
    </div>
  );
}
