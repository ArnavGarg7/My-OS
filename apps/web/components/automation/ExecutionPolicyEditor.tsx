"use client";

import { Text } from "@myos/ui";
import type { ExecutionPolicyConfig } from "@myos/core/automation";

/**
 * ExecutionPolicyEditor (Sprint 3.4). Editorial "how often" section — describes the
 * execution policy + its parameters in plain language. Read-first.
 */
function describe(policy: ExecutionPolicyConfig): string {
  switch (policy.policy) {
    case "run_once":
      return "Runs once, then never again.";
    case "run_always":
      return "Runs every time the trigger fires.";
    case "cooldown":
      return `Runs, then waits ${policy.cooldownMinutes ?? 60} min before running again.`;
    case "throttle":
      return `Runs at most once per ${policy.throttleMinutes ?? 5} min.`;
    case "max_executions":
      return `Runs up to ${policy.maxExecutions ?? 10} times.`;
    case "retry":
      return `Retries up to ${policy.retryAttempts ?? 3} times with ${policy.retryBackoffMinutes ?? 10} min backoff.`;
    case "delay":
      return `Waits ${policy.delayMinutes ?? 5} min, then runs.`;
    case "schedule":
      return `Runs once a day at ${policy.scheduleAt ?? "—"}.`;
    case "manual_approval":
      return "Requires manual approval before running.";
    default:
      return policy.policy;
  }
}

export function ExecutionPolicyEditor({ policy }: { policy: ExecutionPolicyConfig }) {
  return (
    <section className="flex flex-col gap-1">
      <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
        How often
      </Text>
      <div className="border-border rounded-lg border p-3">
        <Text variant="body-s">{describe(policy)}</Text>
      </div>
    </section>
  );
}
