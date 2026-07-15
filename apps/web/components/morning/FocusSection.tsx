import type { FocusSection as FocusData } from "@myos/core/morning";

/** 6. Focus Score — one beautiful number + why. No charts. */
export function FocusSection({ data }: { data: FocusData }) {
  return (
    <div className="flex items-start gap-6">
      <div className="text-fg font-mono text-5xl font-semibold tabular-nums leading-none">
        {data.score ?? "—"}
      </div>
      <ul className="flex flex-col gap-1.5 pt-1">
        {data.reasons.map((reason, index) => (
          <li key={index} className="text-body-s flex items-center gap-2">
            <span
              aria-hidden
              className={
                reason.positive ? "text-success font-semibold" : "text-danger font-semibold"
              }
            >
              {reason.positive ? "+" : "−"}
            </span>
            <span className="text-fg-muted">{reason.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
