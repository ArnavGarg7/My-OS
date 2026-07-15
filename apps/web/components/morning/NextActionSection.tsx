import { ArrowRight } from "lucide-react";
import { Button } from "@myos/ui";
import type { NextActionSection as NextActionData } from "@myos/core/morning";

/** 5. Next Action — a single action, one button. Deterministic today. */
export function NextActionSection({ data, onAct }: { data: NextActionData; onAct: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="lg"
        className="w-full justify-between sm:w-auto sm:min-w-80"
        onClick={onAct}
        rightIcon={<ArrowRight size={16} aria-hidden />}
      >
        {data.action}
      </Button>
      <p className="text-caption text-fg-subtle">{data.hint}</p>
    </div>
  );
}
