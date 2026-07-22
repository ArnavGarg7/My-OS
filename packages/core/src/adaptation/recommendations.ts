/**
 * Recommendation Personalization (Sprint 6.5, spec §Recommendation Personalization). Derives how the
 * Chief should personalize its OUTPUT — ordering, timing, notification style, muted subjects — from the
 * feedback weights, learned preferences and routines. **Never changes business logic**; the Chief
 * still decides WHAT to recommend deterministically, this only shapes presentation. Pure — no AI.
 */
import type { FeedbackWeights, PersonalizationPrefs, Preference, RoutineModel } from "./types";
import { isActionable } from "./confidence";

export function personalization(input: {
  weights: FeedbackWeights;
  preferences: readonly Preference[];
  routines: readonly RoutineModel[];
  notificationPref?: Preference | undefined;
}): PersonalizationPrefs {
  // Ordering: start from feedback weights.
  const ordering: Record<string, number> = { ...input.weights.bySubject };

  // Preferred hours: from confident routines (when the user tends to act).
  const preferredHours = [
    ...new Set(
      input.routines
        .filter((r) => isActionable(r.confidence) && r.hour !== null)
        .map((r) => r.hour as number),
    ),
  ].sort((a, b) => a - b);

  // Notification style from a learned "notification_style" preference, else derive from feedback tone.
  let notificationStyle: PersonalizationPrefs["notificationStyle"] = "standard";
  const notif = input.notificationPref;
  if (notif && isActionable(notif.confidence)) {
    const v = String(notif.value);
    if (v === "quiet" || v === "assertive" || v === "standard") notificationStyle = v;
  } else {
    const avg =
      Object.values(input.weights.bySubject).reduce((s, w) => s + w, 0) /
      (Object.keys(input.weights.bySubject).length || 1);
    notificationStyle = avg < -0.2 ? "quiet" : avg > 0.3 ? "assertive" : "standard";
  }

  return { ordering, preferredHours, notificationStyle, muted: input.weights.muted };
}
