"use client";

import { Text } from "@myos/ui";
import { wheelFullness, type WheelSlice } from "@myos/core/intelligence";

/**
 * WheelOfLife (Sprint 4.4). A pure SVG radar over the eight life-area scores. This is the one
 * heavy visualization on the dashboard, so it lives in its own component and is lazy-loaded by
 * the dashboard (dynamic import) to keep the initial payload small. It computes nothing — the
 * slice values are the already-derived area scores.
 */
export function WheelOfLife({ slices }: { slices: WheelSlice[] }) {
  const size = 260;
  const center = size / 2;
  const radius = center - 40;
  const n = slices.length;
  if (n === 0) return null;

  const point = (i: number, value: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (value / 100) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };
  const axis = (i: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) };
  };

  const polygon = slices
    .map((s, i) => point(i, s.value))
    .map((p) => `${p.x},${p.y}`)
    .join(" ");
  const rings = [25, 50, 75, 100];

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Wheel of Life"
      >
        {rings.map((ring) => (
          <circle
            key={ring}
            cx={center}
            cy={center}
            r={(ring / 100) * radius}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={1}
          />
        ))}
        {slices.map((s, i) => {
          const a = axis(i);
          return (
            <line
              key={s.area}
              x1={center}
              y1={center}
              x2={a.x}
              y2={a.y}
              stroke="var(--border-subtle)"
              strokeWidth={1}
            />
          );
        })}
        <polygon
          points={polygon}
          fill="var(--accent)"
          fillOpacity={0.25}
          stroke="var(--accent)"
          strokeWidth={2}
        />
        {slices.map((s, i) => {
          const labelX = center + (radius + 18) * Math.cos((Math.PI * 2 * i) / n - Math.PI / 2);
          const labelY = center + (radius + 18) * Math.sin((Math.PI * 2 * i) / n - Math.PI / 2);
          return (
            <g key={`${s.area}-label`}>
              <circle
                cx={point(i, s.value).x}
                cy={point(i, s.value).y}
                r={3}
                fill="var(--accent)"
              />
              <text
                x={labelX}
                y={labelY}
                fontSize={10}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--fg-subtle)"
              >
                {s.label}
              </text>
            </g>
          );
        })}
        <text
          x={center}
          y={center}
          fontSize={22}
          fontWeight={600}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--fg)"
        >
          {wheelFullness(slices)}
        </text>
      </svg>
      <Text variant="caption" tone="subtle">
        Wheel fullness — the average of all eight areas
      </Text>
    </div>
  );
}
