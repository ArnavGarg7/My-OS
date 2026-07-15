import type { ReactNode } from "react";

/**
 * ProgressRing (Sprint 3.2). A pure SVG circular progress indicator wrapped around
 * the session timer. `value` is 0–100. No animation library — CSS transition only.
 */
export function ProgressRing({
  value,
  size = 280,
  stroke = 10,
  tone = "accent",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  tone?: "accent" | "success" | "warning" | "danger";
  children?: ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const toneClass = {
    accent: "stroke-accent",
    success: "stroke-success",
    warning: "stroke-warning",
    danger: "stroke-danger",
  }[tone];

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-inset"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${toneClass} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
