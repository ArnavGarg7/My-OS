import { APPOINTMENT_SOON_DAYS } from "./constants";
import type { DoctorAppointment } from "./types";

/**
 * Doctor appointments (Sprint 4.2). Pure read helpers over the appointment log.
 */
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function upcomingAppointments(
  appointments: DoctorAppointment[],
  now: Date,
): DoctorAppointment[] {
  const today = ymd(now);
  return appointments
    .filter((a) => !a.completed && a.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Appointments within the "soon" window (today..+N days). */
export function soonAppointments(
  appointments: DoctorAppointment[],
  now: Date,
): DoctorAppointment[] {
  const soon = new Date(now);
  soon.setUTCDate(soon.getUTCDate() + APPOINTMENT_SOON_DAYS);
  const soonYmd = ymd(soon);
  return upcomingAppointments(appointments, now).filter((a) => a.date <= soonYmd);
}
