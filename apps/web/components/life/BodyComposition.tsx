"use client";

import { useState } from "react";
import { Button, Input, StatBlock, Text } from "@myos/ui";
import { latest, restingHeartRateImproving, trend, type BodyMeasurement } from "@myos/core/life";

/**
 * BodyComposition (Sprint 4.2). Log weight + resting heart rate and see the latest values
 * plus deterministic trends. No modelling.
 */
export function BodyComposition({
  body,
  onLog,
}: {
  body: BodyMeasurement[];
  onLog: (input: { weightKg?: number; restingHeartRate?: number }) => void;
}) {
  const [weight, setWeight] = useState("");
  const [rhr, setRhr] = useState("");
  const current = latest(body);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <Input
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Weight (kg)"
          aria-label="Weight"
          className="w-28"
        />
        <Input
          value={rhr}
          onChange={(e) => setRhr(e.target.value)}
          placeholder="Resting HR"
          aria-label="Resting heart rate"
          className="w-28"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            onLog({
              ...(weight ? { weightKg: Number(weight) } : {}),
              ...(rhr ? { restingHeartRate: Number(rhr) } : {}),
            });
            setWeight("");
            setRhr("");
          }}
        >
          Log
        </Button>
      </div>
      {current ? (
        <div className="grid grid-cols-3 gap-3">
          <StatBlock
            label="Weight"
            value={current.weightKg != null ? `${current.weightKg} kg` : "—"}
          />
          <StatBlock
            label="Resting HR"
            value={current.restingHeartRate != null ? `${current.restingHeartRate}` : "—"}
          />
          <StatBlock label="Weight trend" value={`${trend(body, "weightKg")} kg`} />
        </div>
      ) : (
        <Text variant="body-s" tone="subtle">
          No measurements yet.
        </Text>
      )}
      {restingHeartRateImproving(body) ? (
        <Text variant="caption" tone="subtle">
          Resting heart rate is trending down — a positive fitness signal.
        </Text>
      ) : null}
    </div>
  );
}
