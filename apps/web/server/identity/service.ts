import "server-only";
import { redirect } from "next/navigation";
import type { UserPreferencesRow } from "@myos/db/schema";
import { getDb } from "../db";
import { clerkEnabled, isProduction, signInUrl } from "./config";
import { getProviderIdentity, getProviderUserId } from "./clerk";
import * as repo from "./repository";
import type { OnboardingInput, PreferencesUpdate, ProfileUpdate } from "./schemas";
import type { Identity, ProviderIdentity, UserPreferences } from "./types";

/**
 * IdentityService — the app's single doorway to "who is using My OS" (Sprint 1.5).
 *
 * Implemented with Clerk today, but every consumer (tRPC, RSC pages, the shell)
 * depends only on this module and its DTOs. Replacing Clerk means reimplementing
 * `resolveProvider` + the client `signOut`; nothing else moves.
 *
 * The DB (`user_preferences`) is authoritative for everything the app shows;
 * Clerk supplies only email / avatar / last-login.
 */

const DEV_OWNER_CLERK_ID = "dev-owner";

interface ResolvedProvider {
  clerkId: string;
  provider: ProviderIdentity;
}

/** Resolve the current request's provider identity, or null if unauthenticated. */
async function resolveProvider(): Promise<ResolvedProvider | null> {
  if (clerkEnabled()) {
    const clerkId = await getProviderUserId();
    if (!clerkId) return null;
    const provider = (await getProviderIdentity()) ?? {
      email: null,
      avatarUrl: null,
      emailVerified: false,
      lastLoginAt: null,
    };
    return { clerkId, provider };
  }

  // Local single-owner dev mode — explicitly never in production.
  if (isProduction()) return null;
  return {
    clerkId: DEV_OWNER_CLERK_ID,
    provider: {
      email: "owner@localhost",
      avatarUrl: null,
      emailVerified: true,
      lastLoginAt: null,
    },
  };
}

function toPreferences(row: UserPreferencesRow): UserPreferences {
  return {
    displayName: row.displayName,
    timezone: row.timezone,
    locale: row.locale,
    language: row.language,
    preferredCurrency: row.preferredCurrency,
    preferredDateFormat: row.preferredDateFormat,
    preferredTimeFormat: row.preferredTimeFormat,
    theme: row.theme,
    compactMode: row.compactMode,
    reducedMotion: row.reducedMotion,
    sidebarCollapsed: row.sidebarCollapsed,
    sidebarWidth: row.sidebarWidth,
    defaultLandingPage: row.defaultLandingPage,
    defaultFocusDuration: row.defaultFocusDuration,
    preferredStartOfDay: row.preferredStartOfDay,
    preferredEndOfDay: row.preferredEndOfDay,
    notificationSoundEnabled: row.notificationSoundEnabled,
    desktopNotificationsEnabled: row.desktopNotificationsEnabled,
    mobileNotificationsEnabled: row.mobileNotificationsEnabled,
    autoLaunchMorningBriefing: row.autoLaunchMorningBriefing,
  };
}

function toIdentity(
  params: { id: string; role: "owner"; createdAt: Date },
  row: UserPreferencesRow,
  provider: ProviderIdentity,
): Identity {
  return {
    id: params.id,
    role: params.role,
    email: provider.email,
    avatarUrl: provider.avatarUrl,
    emailVerified: provider.emailVerified,
    lastLoginAt: provider.lastLoginAt,
    createdAt: params.createdAt.toISOString(),
    isOnboarded: row.onboardedAt !== null,
    preferences: toPreferences(row),
  };
}

/** The current user, provisioned on first login, or null if unauthenticated. */
export async function getCurrentUser(): Promise<Identity | null> {
  const resolved = await resolveProvider();
  if (!resolved) return null;

  const { db } = getDb();
  const user = await repo.ensureUser(db, resolved.clerkId);
  const prefs = await repo.getPreferences(db, user.id);
  return toIdentity(user, prefs, resolved.provider);
}

/** Like {@link getCurrentUser} but redirects to sign-in when unauthenticated. */
export async function requireUser(): Promise<Identity> {
  const identity = await getCurrentUser();
  if (!identity) redirect(signInUrl());
  return identity;
}

export async function getPreferences(): Promise<UserPreferences> {
  const identity = await requireUser();
  return identity.preferences;
}

export async function updateProfile(update: ProfileUpdate): Promise<Identity> {
  const identity = await requireUser();
  const { db } = getDb();
  await repo.updatePreferences(db, identity.id, update);
  const refreshed = await getCurrentUser();
  if (!refreshed) throw new Error("Identity vanished during update");
  return refreshed;
}

export async function updatePreferences(update: PreferencesUpdate): Promise<UserPreferences> {
  const identity = await requireUser();
  const { db } = getDb();
  const row = await repo.updatePreferences(db, identity.id, update);
  return toPreferences(row);
}

export async function completeOnboarding(input: OnboardingInput): Promise<Identity> {
  const identity = await requireUser();
  const { db } = getDb();
  await repo.updatePreferences(db, identity.id, {
    displayName: input.displayName,
    timezone: input.timezone,
    theme: input.theme,
    preferredStartOfDay: input.preferredStartOfDay,
    preferredEndOfDay: input.preferredEndOfDay,
    onboardedAt: new Date(),
  });
  const refreshed = await getCurrentUser();
  if (!refreshed) throw new Error("Identity vanished during onboarding");
  return refreshed;
}
