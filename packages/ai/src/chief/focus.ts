/**
 * Focus recommendations (Sprint 5.2). Deterministic break rules and next-block suggestions layered
 * on the Focus engine's own rules (50→10, 90→20). The Chief consumes these; it never runs timers
 * (those live in the deterministic Focus domain).
 */
import type { PersonalProfile } from "./types";

/** Break length recommendation for an elapsed focus duration (06 focus rules). */
export function recommendedBreakMinutes(elapsedMinutes: number): number {
  if (elapsedMinutes >= 90) return 20;
  if (elapsedMinutes >= 50) return 10;
  return 5;
}

/** Should a break be suggested now, per the profile cadence? */
export function shouldBreak(elapsedMinutes: number, profile: PersonalProfile): boolean {
  return elapsedMinutes >= profile.breakFrequencyMinutes;
}

/** Suggested next focus length given a free window and the profile's minimum block. */
export function suggestedFocusMinutes(windowMinutes: number, profile: PersonalProfile): number {
  if (windowMinutes < profile.deepWorkMinBlockMinutes) return windowMinutes;
  return Math.min(windowMinutes, 120);
}
