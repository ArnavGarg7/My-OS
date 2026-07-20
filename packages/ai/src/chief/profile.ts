/**
 * Personal AI Profile (Sprint 5.2). DISTINCT from memories: user-editable preferences that steer
 * the Chief's phrasing and defaults. The AI changes these ONLY through accepted/modified feedback,
 * never silently, and they NEVER alter deterministic calculations — they nudge presentation and
 * recommendation ordering, not the underlying scores.
 */
import type { Feedback, PersonalProfile } from "./types";

/** The default profile for a new user. Sensible, editable. */
export function defaultProfile(): PersonalProfile {
  return {
    deepWorkPreferredStartHour: 9,
    deepWorkMinBlockMinutes: 50,
    studyPreferredStartHour: 16,
    workoutPreferredHour: 18,
    meetingPreference: "batch",
    planningStyle: "flexible",
    communicationStyle: "concise",
    notificationStyle: "proactive",
    breakFrequencyMinutes: 50,
    reviewStyle: "daily",
    decisionStyle: "fast",
    revision: 0,
  };
}

/**
 * Refine the profile from a batch of feedback. Only ACCEPTED/MODIFIED feedback counts — rejections
 * and ignores do not silently rewrite preferences. Deterministic and conservative: it nudges
 * cadence/style, never rewrites wholesale. Returns a NEW profile (never mutates).
 */
export function refineProfile(
  profile: PersonalProfile,
  feedbacks: readonly Feedback[],
): PersonalProfile {
  const accepted = feedbacks.filter((f) => f.outcome === "accepted" || f.outcome === "modified");
  if (accepted.length === 0) return profile;

  const next: PersonalProfile = { ...profile, revision: profile.revision + 1 };
  // Heuristic, explainable nudges from feedback notes (opt-in signals only).
  for (const f of accepted) {
    const note = (f.note ?? "").toLowerCase();
    if (note.includes("later"))
      next.deepWorkPreferredStartHour = Math.min(next.deepWorkPreferredStartHour + 1, 12);
    if (note.includes("earlier"))
      next.deepWorkPreferredStartHour = Math.max(next.deepWorkPreferredStartHour - 1, 6);
    if (note.includes("shorter break") || note.includes("more break"))
      next.breakFrequencyMinutes = Math.max(25, next.breakFrequencyMinutes - 5);
    if (note.includes("longer block"))
      next.breakFrequencyMinutes = Math.min(90, next.breakFrequencyMinutes + 10);
    if (note.includes("quiet")) next.notificationStyle = "quiet";
    if (note.includes("warmer") || note.includes("warm")) next.communicationStyle = "warm";
  }
  return next;
}

/** Validate + clamp a user-edited profile to safe ranges. */
export function clampProfile(profile: PersonalProfile): PersonalProfile {
  return {
    ...profile,
    deepWorkPreferredStartHour: clamp(profile.deepWorkPreferredStartHour, 0, 23),
    deepWorkMinBlockMinutes: clamp(profile.deepWorkMinBlockMinutes, 15, 180),
    studyPreferredStartHour: clamp(profile.studyPreferredStartHour, 0, 23),
    workoutPreferredHour: clamp(profile.workoutPreferredHour, 0, 23),
    breakFrequencyMinutes: clamp(profile.breakFrequencyMinutes, 15, 120),
  };
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
