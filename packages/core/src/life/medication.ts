import type { MedicationFrequency } from "./constants";
import type { Medication, MedicationLog } from "./types";

/**
 * Medication tracking (Sprint 4.2). Pure derivations — which meds are due, adherence.
 */
export function activeMedications(meds: Medication[]): Medication[] {
  return meds.filter((m) => m.active);
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Expected doses/day for a frequency. */
export function dosesPerDay(freq: MedicationFrequency): number {
  switch (freq) {
    case "once_daily":
      return 1;
    case "twice_daily":
      return 2;
    case "thrice_daily":
      return 3;
    case "weekly":
      return 1 / 7;
    case "as_needed":
      return 0;
  }
}

/** Medications with doses still owed today (expected > logged today). */
export function dueMedications(meds: Medication[], logs: MedicationLog[], now: Date): Medication[] {
  const today = ymd(now);
  const takenToday = new Map<string, number>();
  for (const l of logs) {
    if (ymd(new Date(l.takenAt)) === today) {
      takenToday.set(l.medicationId, (takenToday.get(l.medicationId) ?? 0) + 1);
    }
  }
  return activeMedications(meds).filter((m) => {
    const expected = Math.round(dosesPerDay(m.frequency));
    if (expected <= 0) return false; // as_needed / weekly never "due"
    return (takenToday.get(m.id) ?? 0) < expected;
  });
}

/** Adherence over a window: logged doses / expected doses (percent). */
export function medicationAdherence(
  med: Medication,
  logs: MedicationLog[],
  now: Date,
  windowDays = 30,
): number {
  const expected = dosesPerDay(med.frequency) * windowDays;
  if (expected <= 0) return 100;
  const start = now.getTime() - windowDays * 86_400_000;
  const taken = logs.filter(
    (l) => l.medicationId === med.id && new Date(l.takenAt).getTime() >= start,
  ).length;
  return Math.min(100, Math.round((taken / expected) * 100));
}
