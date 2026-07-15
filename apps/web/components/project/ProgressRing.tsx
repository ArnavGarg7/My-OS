"use client";

import { cn } from "@myos/ui";

/**
 * ProgressRing (Sprint 2.8). A pure SVG circular progress indicator for project
 * completion. Deterministic — value is always a derived percent (0–100).
 */
export function ProgressRing({
  value,
  size = 48,
  strokeWidth = 4,
  label,
  className,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="img"
      aria-label={`${clamped}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="stroke-accent transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute text-[0.7rem] font-medium tabular-nums">
        {label ?? `${clamped}%`}
      </span>
    </div>
  );
}
