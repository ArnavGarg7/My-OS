import { MonoLabel, Text } from "@myos/ui";
import type { GreetingSection as GreetingData } from "@myos/core/morning";

/** 1. Greeting — the hero of the briefing. "Operate my day" begins here. */
export function GreetingSection({ data }: { data: GreetingData }) {
  return (
    <header className="flex flex-col gap-3 pb-8 pt-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <MonoLabel tone="subtle">
          {data.dateLabel} · {data.timeLabel}
        </MonoLabel>
        <span aria-hidden className="text-fg-disabled">
          ·
        </span>
        <MonoLabel tone="accent" bead>
          Operating desk
        </MonoLabel>
      </div>
      <Text variant="display-l" className="tracking-tight" asChild>
        <h1>
          {data.salutation}
          {data.name ? `, ${data.name}` : ""}.
        </h1>
      </Text>
      <Text variant="body-l" tone="muted" className="max-w-2xl">
        {data.subtitle}
      </Text>
    </header>
  );
}
