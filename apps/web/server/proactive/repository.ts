import "server-only";
import { eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import { notificationPreferences } from "@myos/db/schema";

/**
 * Proactive persistence (Stage 6). The proactive layer stores NO data of its own —
 * interventions ARE notifications (reusing the Sprint 3.3 platform). The only state it
 * owns is the master on/off switch, kept on the single notification_preferences row so
 * proactivity lives alongside the user's other notification controls.
 */

/** Read the proactive master switch (defaults to enabled when no row exists yet). */
export async function getEnabled(db: Database): Promise<boolean> {
  const [row] = await db
    .select({ enabled: notificationPreferences.proactiveEnabled })
    .from(notificationPreferences)
    .limit(1);
  return row?.enabled ?? true;
}

/** Set the proactive master switch, creating the preferences row if needed. */
export async function setEnabled(db: Database, enabled: boolean): Promise<boolean> {
  const [existing] = await db
    .select({ id: notificationPreferences.id })
    .from(notificationPreferences)
    .limit(1);
  if (existing) {
    await db
      .update(notificationPreferences)
      .set({ proactiveEnabled: enabled, updatedAt: new Date() })
      .where(eq(notificationPreferences.id, existing.id));
  } else {
    await db.insert(notificationPreferences).values({ proactiveEnabled: enabled });
  }
  return enabled;
}
