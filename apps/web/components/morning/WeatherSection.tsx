import type { WeatherSection as WeatherData } from "@myos/core/morning";

/** 10. Weather — placeholder (no API). */
export function WeatherSection({ data }: { data: WeatherData }) {
  return <p className="text-body-m text-fg-subtle">{data.message}</p>;
}
