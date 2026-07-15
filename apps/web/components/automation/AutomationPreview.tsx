"use client";

import { Badge, Text } from "@myos/ui";
import type { AutomationPreview as Preview } from "@myos/core/automation";

/**
 * AutomationPreview (Sprint 3.4). Pure simulation output — trigger fires → conditions
 * → would-execute → actions → expected result. No execution.
 */
export function AutomationPreview({ preview }: { preview: Preview }) {
  return (
    <section className="border-border flex flex-col gap-2 rounded-lg border p-3">
      <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
        Preview
      </Text>
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm" variant={preview.triggerMatches ? "success" : "neutral"}>
          Trigger {preview.triggerMatches ? "matches" : "no match"}
        </Badge>
        <Badge size="sm" variant={preview.conditionsPass ? "success" : "neutral"}>
          Conditions {preview.conditionsPass ? "pass" : "fail"}
        </Badge>
        <Badge size="sm" variant={preview.wouldExecute ? "accent" : "neutral"}>
          {preview.wouldExecute ? "Would execute" : "Would not run"}
        </Badge>
      </div>
      <Text variant="body-s" tone="subtle">
        {preview.expectedResult}
      </Text>
      <Text variant="caption" tone="subtle">
        {preview.reason}
      </Text>
    </section>
  );
}
