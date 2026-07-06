import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserPreferencesRow } from "@myos/db/schema";

// The service is server-only and wraps Clerk + the DB. Mock the boundaries so we
// can test the abstraction (dev fallback, provisioning, redirect, onboarding).
// Mock fns live in a hoisted holder so the (hoisted) vi.mock factories can see them.
const h = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  clerkEnabled: vi.fn(),
  isProduction: vi.fn(),
  getProviderUserId: vi.fn(),
  getProviderIdentity: vi.fn(),
  ensureUser: vi.fn(),
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: h.redirect }));
vi.mock("./config", () => ({
  clerkEnabled: () => h.clerkEnabled(),
  isProduction: () => h.isProduction(),
  signInUrl: () => "/sign-in",
}));
vi.mock("./clerk", () => ({
  getProviderUserId: () => h.getProviderUserId(),
  getProviderIdentity: () => h.getProviderIdentity(),
}));
vi.mock("../db", () => ({ getDb: () => ({ db: {}, sql: {} }) }));
vi.mock("./repository", () => ({
  ensureUser: (...a: unknown[]) => h.ensureUser(...a),
  getPreferences: (...a: unknown[]) => h.getPreferences(...a),
  updatePreferences: (...a: unknown[]) => h.updatePreferences(...a),
}));

import * as service from "./service";

const {
  redirect,
  clerkEnabled,
  isProduction,
  getProviderUserId,
  getProviderIdentity,
  ensureUser,
  getPreferences,
  updatePreferences,
} = h;

function makeRow(overrides: Partial<UserPreferencesRow> = {}): UserPreferencesRow {
  return {
    userId: "user-1",
    displayName: "Arnav",
    timezone: "Asia/Kolkata",
    locale: "en-IN",
    language: "en",
    preferredCurrency: "INR",
    preferredDateFormat: "dd MMM yyyy",
    preferredTimeFormat: "12h",
    theme: "dark",
    compactMode: false,
    reducedMotion: false,
    sidebarCollapsed: false,
    sidebarWidth: 236,
    defaultLandingPage: "/today",
    defaultFocusDuration: 25,
    preferredStartOfDay: "06:00",
    preferredEndOfDay: "22:00",
    notificationSoundEnabled: true,
    desktopNotificationsEnabled: false,
    mobileNotificationsEnabled: false,
    autoLaunchMorningBriefing: false,
    onboardedAt: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

const authUser = {
  id: "user-1",
  clerkId: "dev-owner",
  role: "owner" as const,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  ensureUser.mockResolvedValue(authUser);
  getPreferences.mockResolvedValue(makeRow());
  updatePreferences.mockResolvedValue(makeRow());
});

describe("getCurrentUser — dev fallback", () => {
  it("returns the local owner when Clerk is disabled outside production", async () => {
    clerkEnabled.mockReturnValue(false);
    isProduction.mockReturnValue(false);

    const identity = await service.getCurrentUser();

    expect(identity).not.toBeNull();
    expect(identity!.id).toBe("user-1");
    expect(identity!.role).toBe("owner");
    expect(identity!.email).toBe("owner@localhost");
    expect(identity!.isOnboarded).toBe(false);
    expect(ensureUser).toHaveBeenCalledWith(expect.anything(), "dev-owner");
  });

  it("returns null when Clerk is disabled in production (no dev owner)", async () => {
    clerkEnabled.mockReturnValue(false);
    isProduction.mockReturnValue(true);

    expect(await service.getCurrentUser()).toBeNull();
    expect(ensureUser).not.toHaveBeenCalled();
  });
});

describe("getCurrentUser — Clerk", () => {
  it("merges provider identity for an authenticated user", async () => {
    clerkEnabled.mockReturnValue(true);
    getProviderUserId.mockResolvedValue("clerk_123");
    getProviderIdentity.mockResolvedValue({
      email: "me@example.com",
      avatarUrl: "https://img/avatar.png",
      emailVerified: true,
      lastLoginAt: "2026-07-01T10:00:00Z",
    });
    getPreferences.mockResolvedValue(makeRow({ onboardedAt: new Date("2026-06-01T00:00:00Z") }));

    const identity = await service.getCurrentUser();

    expect(identity!.email).toBe("me@example.com");
    expect(identity!.avatarUrl).toBe("https://img/avatar.png");
    expect(identity!.isOnboarded).toBe(true);
    expect(ensureUser).toHaveBeenCalledWith(expect.anything(), "clerk_123");
  });

  it("returns null when Clerk reports no user", async () => {
    clerkEnabled.mockReturnValue(true);
    getProviderUserId.mockResolvedValue(null);
    expect(await service.getCurrentUser()).toBeNull();
  });
});

describe("requireUser", () => {
  it("redirects to sign-in when unauthenticated", async () => {
    clerkEnabled.mockReturnValue(false);
    isProduction.mockReturnValue(true); // no dev owner → unauthenticated

    await expect(service.requireUser()).rejects.toThrow("REDIRECT:/sign-in");
    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });
});

describe("completeOnboarding", () => {
  it("persists an onboardedAt timestamp", async () => {
    clerkEnabled.mockReturnValue(false);
    isProduction.mockReturnValue(false);
    getPreferences.mockResolvedValue(makeRow({ onboardedAt: new Date() }));

    await service.completeOnboarding({
      displayName: "Arnav",
      timezone: "UTC",
      theme: "light",
      preferredStartOfDay: "07:00",
      preferredEndOfDay: "23:00",
    });

    expect(updatePreferences).toHaveBeenCalledTimes(1);
    const patch = updatePreferences.mock.calls[0]![2] as Record<string, unknown>;
    expect(patch.onboardedAt).toBeInstanceOf(Date);
    expect(patch.displayName).toBe("Arnav");
    expect(patch.theme).toBe("light");
  });
});
