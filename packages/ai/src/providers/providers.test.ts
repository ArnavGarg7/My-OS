import { describe, expect, it } from "vitest";
import { LocalProvider, embedDeterministic } from "./local";
import { createAnthropicProvider } from "./anthropic";
import { ProviderRegistry } from "./registry";
import { ProviderNotConfiguredError } from "./types";
import type { CloudClient } from "./cloud";
import type { ProviderGenerateInput } from "./types";

const input: ProviderGenerateInput = {
  modelId: "local-deterministic",
  messages: [{ role: "user", content: "Plan my day please" }],
  maxOutputTokens: 100,
};

describe("LocalProvider", () => {
  it("is deterministic across calls", async () => {
    const p = new LocalProvider();
    const a = await p.generate(input);
    const b = await p.generate(input);
    expect(a).toEqual(b);
    expect(a.text).toContain("Plan my day");
    expect(a.usage.inputTokens).toBeGreaterThan(0);
  });

  it("honours scripted responses keyed by input hash", async () => {
    const { stableHash, stableStringify } = await import("../text");
    const key = stableHash(stableStringify(input.messages));
    const p = new LocalProvider({ scripted: { [key]: "SCRIPTED" } });
    expect((await p.generate(input)).text).toBe("SCRIPTED");
  });

  it("streams to the same text as generate", async () => {
    const p = new LocalProvider();
    let streamed = "";
    let finalUsage = null;
    for await (const c of p.stream(input)) {
      streamed += c.delta;
      if (c.done) finalUsage = c.usage;
    }
    expect(streamed).toBe((await p.generate(input)).text);
    expect(finalUsage).not.toBeNull();
  });

  it("embeds deterministically with cosine ~1 for identical text", async () => {
    const [a, b] = await new LocalProvider().embed(["gym is 20 min away", "gym is 20 min away"]);
    expect(a).toEqual(b);
    expect(embedDeterministic("apples").length).toBe(256);
  });

  it("reports healthy always", async () => {
    expect((await new LocalProvider().healthCheck()).state).toBe("healthy");
  });
});

describe("CloudProvider (unconfigured)", () => {
  it("is unavailable and throws on use", async () => {
    const p = createAnthropicProvider(null);
    expect(p.available).toBe(false);
    await expect(p.generate(input)).rejects.toBeInstanceOf(ProviderNotConfiguredError);
    expect((await p.healthCheck()).state).toBe("unavailable");
  });

  it("delegates to an injected client when configured", async () => {
    const client: CloudClient = {
      generate: async () => ({
        text: "cloud!",
        finishReason: "stop",
        usage: { inputTokens: 3, outputTokens: 1, cachedTokens: 0 },
      }),
      ping: async () => true,
    };
    const p = createAnthropicProvider(client);
    expect(p.available).toBe(true);
    expect((await p.generate(input)).text).toBe("cloud!");
    expect((await p.healthCheck()).state).toBe("healthy");
  });
});

describe("ProviderRegistry", () => {
  it("registers local + four cloud providers; local available, cloud not", () => {
    const reg = new ProviderRegistry();
    expect(reg.get("local").available).toBe(true);
    expect(reg.get("anthropic").available).toBe(false);
    expect(reg.all()).toHaveLength(5);
  });

  it("resolves provider for a model key", () => {
    const reg = new ProviderRegistry();
    expect(reg.forModel("claude-opus-4-8").name).toBe("anthropic");
    expect(reg.forModel("local-deterministic").name).toBe("local");
    expect(reg.forModel("unknown-model").name).toBe("local");
  });

  it("health-checks all providers", async () => {
    const health = await new ProviderRegistry().healthAll();
    expect(health).toHaveLength(5);
    expect(health.find((h) => h.provider === "local")?.state).toBe("healthy");
  });
});
