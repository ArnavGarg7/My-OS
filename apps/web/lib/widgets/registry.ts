import type { ComponentType } from "react";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";

/**
 * Widget registry (Stage 9). A data-driven framework so new widgets are a registry entry,
 * not a Command Center edit. Each widget is self-contained (owns its own demand-gated query
 * + loading/empty/error states with REAL data). Kept intentionally small; more widgets
 * (next action, focus timer, priorities, inbox) register here without touching the shell.
 *
 * SECURITY/PERF: widgets query the existing capabilities (respecting data classification)
 * and are mounted deliberately — never a global fetch of everything on every route.
 */
export interface WidgetDef {
  id: string;
  title: string;
  component: ComponentType;
  /** Which surfaces may show this widget (kept simple for now). */
  surfaces: ("command_center" | "mobile")[];
}

export const WIDGETS: WidgetDef[] = [
  {
    id: "weather",
    title: "Weather",
    component: WeatherWidget,
    surfaces: ["command_center", "mobile"],
  },
];

export function widgetsForSurface(surface: WidgetDef["surfaces"][number]): WidgetDef[] {
  return WIDGETS.filter((w) => w.surfaces.includes(surface));
}
