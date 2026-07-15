import {
  CalendarDays,
  CalendarClock,
  CalendarRange,
  List,
  Repeat,
  MapPin,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { CalendarProvider, EventStatus } from "@myos/core/calendar";

/** View + status icons (Sprint 2.7). Presentational only. */
export const VIEW_ICON: Record<string, LucideIcon> = {
  agenda: List,
  day: CalendarClock,
  week: CalendarRange,
  month: CalendarDays,
};

export const STATUS_DOT: Record<EventStatus, string> = {
  confirmed: "bg-success",
  tentative: "bg-warning",
  cancelled: "bg-fg-subtle",
};

export const PROVIDER_LABEL: Record<CalendarProvider, string> = {
  local: "Local",
  google: "Google",
  outlook: "Outlook",
  apple: "Apple",
  ics: "ICS",
};

export const META_ICONS = { recurrence: Repeat, location: MapPin, attendees: Users };
