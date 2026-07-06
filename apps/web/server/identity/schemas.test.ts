import { describe, expect, it } from "vitest";
import { onboardingSchema, preferencesUpdateSchema, profileUpdateSchema } from "./schemas";

const validOnboarding = {
  displayName: "Arnav",
  timezone: "Asia/Kolkata",
  theme: "dark" as const,
  preferredStartOfDay: "06:00",
  preferredEndOfDay: "22:00",
};

describe("onboardingSchema", () => {
  it("accepts a complete valid payload", () => {
    expect(onboardingSchema.safeParse(validOnboarding).success).toBe(true);
  });

  it("rejects a blank display name", () => {
    expect(onboardingSchema.safeParse({ ...validOnboarding, displayName: "   " }).success).toBe(
      false,
    );
  });

  it("rejects a malformed time of day", () => {
    expect(
      onboardingSchema.safeParse({ ...validOnboarding, preferredStartOfDay: "6:00" }).success,
    ).toBe(false);
    expect(
      onboardingSchema.safeParse({ ...validOnboarding, preferredEndOfDay: "25:00" }).success,
    ).toBe(false);
  });

  it("rejects an unknown theme", () => {
    expect(onboardingSchema.safeParse({ ...validOnboarding, theme: "blue" }).success).toBe(false);
  });
});

describe("profileUpdateSchema", () => {
  it("is fully partial (empty patch is valid)", () => {
    expect(profileUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("rejects a currency that is not 3 letters", () => {
    expect(profileUpdateSchema.safeParse({ preferredCurrency: "US" }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ preferredCurrency: "INR" }).success).toBe(true);
  });

  it("trims and rejects a blank display name", () => {
    expect(profileUpdateSchema.safeParse({ displayName: "  " }).success).toBe(false);
  });
});

describe("preferencesUpdateSchema", () => {
  it("enforces focus-duration bounds", () => {
    expect(preferencesUpdateSchema.safeParse({ defaultFocusDuration: 25 }).success).toBe(true);
    expect(preferencesUpdateSchema.safeParse({ defaultFocusDuration: 1 }).success).toBe(false);
  });

  it("enforces sidebar-width bounds", () => {
    expect(preferencesUpdateSchema.safeParse({ sidebarWidth: 1000 }).success).toBe(false);
  });

  it("accepts boolean toggles", () => {
    expect(
      preferencesUpdateSchema.safeParse({ reducedMotion: true, autoLaunchMorningBriefing: false })
        .success,
    ).toBe(true);
  });
});
