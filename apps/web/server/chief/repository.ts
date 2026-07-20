import "server-only";
import { eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  chiefFeedback,
  chiefRecommendations,
  chiefSessions,
  personalAiProfiles,
} from "@myos/db/schema";
import type { Feedback, PersonalProfile, Recommendation } from "@myos/ai/chief";

/**
 * Chief repository (Sprint 5.2). Persists Chief interaction state — sessions, recommendation
 * snapshots, feedback — and loads/saves the Personal AI Profile. No business data.
 */

/** Record a Chief session + its recommendation snapshot; returns the recommendation id. */
export async function recordSession(
  db: Database,
  input: {
    kind: string;
    contextHash: string;
    provider: string;
    capability: string;
    recommendation: Recommendation;
  },
): Promise<{ sessionId: string; recommendationId: string }> {
  const [session] = await db
    .insert(chiefSessions)
    .values({
      kind: input.kind,
      contextHash: input.contextHash,
      provider: input.provider,
      capability: input.capability,
    })
    .returning({ id: chiefSessions.id });
  const [rec] = await db
    .insert(chiefRecommendations)
    .values({
      sessionId: session!.id,
      action: input.recommendation.action,
      title: input.recommendation.title,
      confidence: input.recommendation.confidence,
      explanation: input.recommendation.explanation,
      entityRef: input.recommendation.ref ?? null,
    })
    .returning({ id: chiefRecommendations.id });
  return { sessionId: session!.id, recommendationId: rec!.id };
}

/** Record feedback on a recommendation. */
export async function recordFeedback(db: Database, feedback: Feedback): Promise<void> {
  await db.insert(chiefFeedback).values({
    recommendationId: feedback.recommendationId,
    outcome: feedback.outcome,
    note: feedback.note ?? null,
  });
}

/** Load recent feedback (for learning). */
export async function loadFeedback(db: Database, limit = 50): Promise<Feedback[]> {
  const rows = await db.select().from(chiefFeedback).limit(limit);
  return rows.map((r) => ({
    recommendationId: r.recommendationId ?? "",
    outcome: r.outcome as Feedback["outcome"],
    ...(r.note ? { note: r.note } : {}),
  }));
}

/** Load the single Personal AI Profile, or null if none saved yet. */
export async function loadProfile(db: Database): Promise<PersonalProfile | null> {
  const [row] = await db.select().from(personalAiProfiles).limit(1);
  if (!row) return null;
  return {
    deepWorkPreferredStartHour: row.deepWorkPreferredStartHour,
    deepWorkMinBlockMinutes: row.deepWorkMinBlockMinutes,
    studyPreferredStartHour: row.studyPreferredStartHour,
    workoutPreferredHour: row.workoutPreferredHour,
    meetingPreference: row.meetingPreference as PersonalProfile["meetingPreference"],
    planningStyle: row.planningStyle as PersonalProfile["planningStyle"],
    communicationStyle: row.communicationStyle as PersonalProfile["communicationStyle"],
    notificationStyle: row.notificationStyle as PersonalProfile["notificationStyle"],
    breakFrequencyMinutes: row.breakFrequencyMinutes,
    reviewStyle: row.reviewStyle as PersonalProfile["reviewStyle"],
    decisionStyle: row.decisionStyle as PersonalProfile["decisionStyle"],
    revision: row.revision,
  };
}

/** Upsert the Personal AI Profile (single row). */
export async function saveProfile(db: Database, profile: PersonalProfile): Promise<void> {
  const [existing] = await db
    .select({ id: personalAiProfiles.id })
    .from(personalAiProfiles)
    .limit(1);
  const values = {
    deepWorkPreferredStartHour: profile.deepWorkPreferredStartHour,
    deepWorkMinBlockMinutes: profile.deepWorkMinBlockMinutes,
    studyPreferredStartHour: profile.studyPreferredStartHour,
    workoutPreferredHour: profile.workoutPreferredHour,
    meetingPreference: profile.meetingPreference,
    planningStyle: profile.planningStyle,
    communicationStyle: profile.communicationStyle,
    notificationStyle: profile.notificationStyle,
    breakFrequencyMinutes: profile.breakFrequencyMinutes,
    reviewStyle: profile.reviewStyle,
    decisionStyle: profile.decisionStyle,
    revision: profile.revision,
    updatedAt: new Date(),
  };
  if (existing) {
    await db.update(personalAiProfiles).set(values).where(eq(personalAiProfiles.id, existing.id));
  } else {
    await db.insert(personalAiProfiles).values(values);
  }
}
