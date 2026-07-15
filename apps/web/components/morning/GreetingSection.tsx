import type { GreetingSection as GreetingData } from "@myos/core/morning";

/** 1. Greeting — the hero of the briefing. */
export function GreetingSection({ data }: { data: GreetingData }) {
  return (
    <header className="pb-8 pt-2">
      <h1 className="text-fg text-3xl font-semibold tracking-tight sm:text-4xl">
        {data.salutation}
        {data.name ? `, ${data.name}` : ""}.
      </h1>
      <p className="text-body-l text-fg-muted mt-2 font-mono tabular-nums">
        {data.dateLabel} · {data.timeLabel}
      </p>
      <p className="text-body-s text-fg-subtle mt-1">{data.subtitle}</p>
    </header>
  );
}
