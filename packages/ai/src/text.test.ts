import { describe, expect, it } from "vitest";
import { estimateJsonTokens, estimateTokens, stableHash, stableStringify } from "./text";

describe("text utilities", () => {
  it("estimates tokens from length deterministically", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcde")).toBe(2);
  });

  it("hashes stably and deterministically", () => {
    expect(stableHash("hello")).toBe(stableHash("hello"));
    expect(stableHash("hello")).not.toBe(stableHash("world"));
    expect(stableHash("x")).toMatch(/^[0-9a-f]{8}$/);
  });

  it("serializes with sorted keys regardless of insertion order", () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
    expect(stableStringify({ a: 2, b: 1 })).toBe('{"a":2,"b":1}');
  });

  it("estimates json tokens", () => {
    expect(estimateJsonTokens({ a: 1 })).toBeGreaterThan(0);
  });
});
