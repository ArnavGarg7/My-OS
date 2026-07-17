import { BIRTHDAY_SOON_DAYS } from "./constants";
import { daysBetween, nextOccurrence, ymd } from "./dates";
import type { Relationship, UpcomingDate } from "./types";

/**
 * Birthday & anniversary engine (Sprint 4.3). Relationships store a year-agnostic MM-DD, so
 * every occurrence is resolved against `now` on read. Nothing recurring is stored — the
 * next date is always computed, which is why it can never drift out of sync.
 */

function resolve(
  relationship: Relationship,
  monthDay: string | null,
  kind: "birthday" | "anniversary",
  now: Date,
): UpcomingDate | null {
  if (!monthDay) return null;
  const date = nextOccurrence(monthDay, now);
  return {
    relationshipId: relationship.id,
    name: relationship.name,
    kind,
    date: ymd(date),
    daysUntil: daysBetween(now, date),
  };
}

/** Every upcoming birthday + anniversary, soonest first. */
export function upcomingDates(relationships: Relationship[], now: Date): UpcomingDate[] {
  const out: UpcomingDate[] = [];
  for (const r of relationships) {
    if (r.archived) continue;
    const b = resolve(r, r.birthday, "birthday", now);
    if (b) out.push(b);
    const a = resolve(r, r.anniversary, "anniversary", now);
    if (a) out.push(a);
  }
  return out.sort((x, y) => x.daysUntil - y.daysUntil);
}

export function upcomingBirthdays(
  relationships: Relationship[],
  now: Date,
  days = BIRTHDAY_SOON_DAYS,
): UpcomingDate[] {
  return upcomingDates(relationships, now).filter(
    (d) => d.kind === "birthday" && d.daysUntil <= days,
  );
}

export function birthdaysToday(relationships: Relationship[], now: Date): UpcomingDate[] {
  return upcomingBirthdays(relationships, now, 0);
}

/** The nearest birthday inside the reminder window, or null. */
export function nextBirthday(relationships: Relationship[], now: Date): UpcomingDate | null {
  return upcomingBirthdays(relationships, now)[0] ?? null;
}
