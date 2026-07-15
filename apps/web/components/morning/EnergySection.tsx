import { Button } from "@myos/ui";
import { ENERGY_LEVELS, type EnergyLevel } from "@myos/core/today";
import type { EnergySection as EnergyData } from "@myos/core/morning";

/** 3. Energy Check — the one editable section. Buttons, not dropdowns. */
export function EnergySection({
  data,
  onSetEnergy,
  pending,
}: {
  data: EnergyData;
  onSetEnergy: (level: EnergyLevel) => void;
  pending: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-body-s flex flex-wrap gap-x-10 gap-y-2">
        <span className="text-fg-subtle">
          Morning phase <span className="text-fg capitalize">{data.phase}</span>
        </span>
        <span className="text-fg-subtle">
          Working window <span className="text-fg font-mono">{data.workingWindow}</span>
        </span>
        <span className="text-fg-subtle">
          Today's mode <span className="text-fg">{data.mode}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        {ENERGY_LEVELS.map((level) => (
          <Button
            key={level}
            size="sm"
            variant={data.current === level ? "primary" : "secondary"}
            className="capitalize"
            disabled={pending}
            onClick={() => onSetEnergy(level)}
          >
            {level}
          </Button>
        ))}
      </div>
    </div>
  );
}
