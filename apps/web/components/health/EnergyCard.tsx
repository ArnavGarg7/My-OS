"use client";

import { Zap } from "lucide-react";
import { Button, cn, Text } from "@myos/ui";
import { ENERGY_LEVELS, type EnergyLevel, type EnergyResult } from "@myos/core/health";
import { ENERGY_LABEL } from "./health-icons";

/** Energy card (Sprint 2.9): current level + inline setter. */
export function EnergyCard({
  energy,
  onSet,
}: {
  energy: EnergyResult;
  onSet?: (level: EnergyLevel) => void;
}) {
  return (
    <div className="border-border flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Zap size={16} aria-hidden className="text-warning" />
        <Text variant="heading-s">Energy</Text>
      </div>
      <Text variant="heading-xl">{ENERGY_LABEL[energy.level]}</Text>
      <Text variant="caption" tone="subtle">
        {energy.source === "logged" ? "You logged this" : "Derived from sleep"}
      </Text>
      {onSet && (
        <div className="flex gap-1.5 pt-1">
          {ENERGY_LEVELS.map((level) => (
            <Button
              key={level}
              size="sm"
              variant={energy.level === level ? "secondary" : "ghost"}
              className={cn(energy.level === level && "ring-accent/40 ring-1")}
              onClick={() => onSet(level)}
            >
              {ENERGY_LABEL[level]}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
