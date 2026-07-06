import "server-only";
import { eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  authUsers,
  userPreferences,
  type AuthUser,
  type UserPreferencesRow,
} from "@myos/db/schema";

/**
 * Identity persistence. Pure DB access over `auth_users` + `user_preferences`;
 * no auth-provider knowledge. The DB is the source of truth (Sprint 1.5).
 */

export async function findByClerkId(db: Database, clerkId: string): Promise<AuthUser | undefined> {
  const [row] = await db.select().from(authUsers).where(eq(authUsers.clerkId, clerkId)).limit(1);
  return row;
}

/**
 * Return the user for `clerkId`, provisioning the `auth_users` row and a default
 * `user_preferences` row on first sight. Idempotent under concurrent first-logins.
 */
export async function ensureUser(db: Database, clerkId: string): Promise<AuthUser> {
  const existing = await findByClerkId(db, clerkId);
  const user =
    existing ??
    (await db
      .insert(authUsers)
      .values({ clerkId })
      .onConflictDoNothing({ target: authUsers.clerkId })
      .returning()
      .then((rows) => rows[0])) ??
    (await findByClerkId(db, clerkId));

  if (!user) throw new Error("Failed to provision auth user");

  await db.insert(userPreferences).values({ userId: user.id }).onConflictDoNothing();
  return user;
}

export async function getPreferences(db: Database, userId: string): Promise<UserPreferencesRow> {
  const [row] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  if (row) return row;

  const [created] = await db
    .insert(userPreferences)
    .values({ userId })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  const [existing] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  if (!existing) throw new Error("Failed to load user preferences");
  return existing;
}

/**
 * A partial patch over the editable preference columns. Each field explicitly
 * allows `undefined` so validated (zod `.partial()`) inputs assign cleanly under
 * `exactOptionalPropertyTypes`.
 */
export type PreferencesPatch = {
  [K in Exclude<keyof UserPreferencesRow, "userId" | "createdAt" | "updatedAt">]?:
    UserPreferencesRow[K] | undefined;
};

export async function updatePreferences(
  db: Database,
  userId: string,
  patch: PreferencesPatch,
): Promise<UserPreferencesRow> {
  const [row] = await db
    .update(userPreferences)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(userPreferences.userId, userId))
    .returning();
  if (!row) throw new Error("Failed to update user preferences");
  return row;
}
