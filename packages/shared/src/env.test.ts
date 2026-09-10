import { describe, expect, it } from "vitest";
import { isClerkConfigured, isSingleOwnerMode, parseServerEnv } from "./env";

const base = { DATABASE_URL: "postgres://user:pass@localhost:5432/myos" };

describe("isClerkConfigured", () => {
  it("is true only when both Clerk keys are present", () => {
    expect(
      isClerkConfigured({ CLERK_SECRET_KEY: "sk", NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk" }),
    ).toBe(true);
    expect(
      isClerkConfigured({ CLERK_SECRET_KEY: undefined, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk" }),
    ).toBe(false);
    expect(
      isClerkConfigured({
        CLERK_SECRET_KEY: undefined,
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: undefined,
      }),
    ).toBe(false);
  });
});

describe("isSingleOwnerMode", () => {
  const noClerk = { CLERK_SECRET_KEY: undefined, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: undefined };

  it("is true only when opted in AND Clerk is absent", () => {
    expect(isSingleOwnerMode({ MYOS_SINGLE_OWNER: "true", ...noClerk })).toBe(true);
  });

  it("is false without the explicit opt-in", () => {
    expect(isSingleOwnerMode({ MYOS_SINGLE_OWNER: undefined, ...noClerk })).toBe(false);
    expect(isSingleOwnerMode({ MYOS_SINGLE_OWNER: "1", ...noClerk })).toBe(false);
  });

  it("never overrides configured Clerk auth", () => {
    expect(
      isSingleOwnerMode({
        MYOS_SINGLE_OWNER: "true",
        CLERK_SECRET_KEY: "sk",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk",
      }),
    ).toBe(false);
  });
});

describe("parseServerEnv — Clerk", () => {
  it("boots with neither Clerk key (local dev mode)", () => {
    const env = parseServerEnv({ ...base });
    expect(isClerkConfigured(env)).toBe(false);
  });

  it("accepts both Clerk keys", () => {
    const env = parseServerEnv({
      ...base,
      CLERK_SECRET_KEY: "sk_test",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test",
    });
    expect(isClerkConfigured(env)).toBe(true);
  });

  it("throws when only one Clerk key is set", () => {
    expect(() => parseServerEnv({ ...base, CLERK_SECRET_KEY: "sk_test" })).toThrow(/Clerk/);
    expect(() => parseServerEnv({ ...base, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test" })).toThrow(
      /Clerk/,
    );
  });

  it("defaults the sign-in / sign-up URLs", () => {
    const env = parseServerEnv({ ...base });
    expect(env.NEXT_PUBLIC_CLERK_SIGN_IN_URL).toBe("/sign-in");
    expect(env.NEXT_PUBLIC_CLERK_SIGN_UP_URL).toBe("/sign-up");
  });
});
