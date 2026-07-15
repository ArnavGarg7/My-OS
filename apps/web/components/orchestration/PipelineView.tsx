"use client";

import { Eye, Play } from "lucide-react";
import { Badge, Button, Card, Text } from "@myos/ui";
import {
  PIPELINE_KINDS,
  PIPELINE_TRIGGERS,
  pipelineSteps,
  type PipelineKind,
} from "@myos/core/orchestration";
import { ExecutionGraph } from "./ExecutionGraph";
import { PIPELINE_LABEL } from "./orchestration-icons";

/**
 * PipelineView (Sprint 3.5). The catalogue of the ten deterministic cross-module
 * pipelines. Each card shows the trigger event, the ordered module chain and lets the
 * user run or dry-run it. This is how My OS behaves like one system, not twenty apps.
 */
export function PipelineView({
  onRun,
  onPreview,
  pending,
}: {
  onRun: (event: string) => void;
  onPreview: (event: string) => void;
  pending: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {PIPELINE_KINDS.map((kind: PipelineKind) => {
        const trigger = PIPELINE_TRIGGERS[kind][0]!;
        const steps = pipelineSteps(kind).map((s, i) => ({
          module: s.module,
          mode: s.mode,
          order: i,
          dependsOn: [],
        }));
        return (
          <Card key={kind} className="flex flex-col gap-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Text variant="heading-s">{PIPELINE_LABEL[kind]}</Text>
                <Badge size="sm" variant="neutral">
                  {steps.length} steps
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onRun(trigger)}
                  disabled={pending}
                >
                  <Play size={13} aria-hidden /> Run
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onPreview(trigger)}>
                  <Eye size={13} aria-hidden /> Preview
                </Button>
              </div>
            </div>
            <Text variant="caption" tone="subtle">
              Trigger: <code>{trigger}</code>
            </Text>
            <ExecutionGraph steps={steps} />
          </Card>
        );
      })}
    </div>
  );
}
