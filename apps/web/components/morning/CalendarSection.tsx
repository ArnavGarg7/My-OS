import type { CalendarSection as CalendarData } from "@myos/core/morning";

/** 8. Calendar Preview — infrastructure only (no Google Calendar yet). */
export function CalendarSection({ data }: { data: CalendarData }) {
  if (data.events.length === 0) {
    return <p className="text-body-m text-fg-muted">{data.message ?? "No events scheduled."}</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {data.events.map((event, index) => (
        <li key={index} className="text-body-m flex items-baseline gap-3">
          <span className="text-fg-subtle font-mono tabular-nums">{event.at}</span>
          <span className="text-fg">{event.title}</span>
        </li>
      ))}
    </ul>
  );
}
