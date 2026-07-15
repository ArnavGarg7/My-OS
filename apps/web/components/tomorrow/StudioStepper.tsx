"use client";

import { Check } from "lucide-react";
import { cn } from "@myos/ui";
import { STEP_LABEL, STUDIO_STEPS, stepIndex, type StudioStep } from "@myos/core/tomorrow";
import { STEP_ICON } from "./tomorrow-icons";

/**
 * StudioStepper (Sprint 3.1). The guided-flow rail — completed / active / upcoming
 * steps. Clicking a visited step jumps back to it.
 */
export function StudioStepper({
  current,
  onStep,
}: {
  current: StudioStep;
  onStep: (step: StudioStep) => void;
}) {
  const currentIdx = stepIndex(current);
  return (
    <ol className="flex flex-col gap-0.5">
      {STUDIO_STEPS.map((step, i) => {
        const Icon = STEP_ICON[step];
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={step}>
            <button
              type="button"
              onClick={() => onStep(step)}
              aria-current={active ? "step" : undefined}
              className={cn(
                "text-body-s flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
                active
                  ? "bg-accent/10 text-accent"
                  : done
                    ? "text-fg"
                    : "text-fg-subtle hover:text-fg",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border",
                  active
                    ? "border-accent text-accent"
                    : done
                      ? "border-success text-success"
                      : "border-border",
                )}
              >
                {done ? <Check size={13} aria-hidden /> : <Icon size={13} aria-hidden />}
              </span>
              <span className="min-w-0 truncate">{STEP_LABEL[step]}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
