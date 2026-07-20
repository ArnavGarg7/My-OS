import "server-only";
import type {
  CloudClient,
  ProviderGenerateInput,
  ProviderGenerateResult,
  RegistryClients,
} from "@myos/ai/providers";
import { getModel } from "@myos/ai/config";
import { getEnv } from "../env";

/**
 * Real, env-driven provider adapters (Sprint 5.3). This is the ONLY place cloud AI providers are
 * wired, and the ONLY place API keys are read — from server-side env, never logged, never sent to
 * the browser, never placed in source. Each adapter is a fetch-based `CloudClient` (no vendor SDK,
 * so the pure @myos/ai package stays dependency-free). A provider activates only when its key is
 * present; the Local provider always remains the offline fallback. `healthCheck`/`ping` verify
 * connectivity at runtime in the deployed environment.
 *
 * SECURITY: keys are captured in closures and used only for the Authorization/x-api-key header on
 * outbound requests. They are never returned, logged, or serialized.
 */

/** Resolve the real vendor model id from our registry key (falls back to the key). */
function vendorModel(modelKey: string): string {
  return getModel(modelKey)?.id ?? modelKey;
}

/** Anthropic (Messages API) — POST /v1/messages. */
function anthropicClient(apiKey: string): CloudClient {
  return {
    async generate(input: ProviderGenerateInput): Promise<ProviderGenerateResult> {
      const system = input.messages
        .filter((m) => m.role === "system")
        .map((m) => m.content)
        .join("\n");
      const messages = input.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: vendorModel(input.modelId),
          max_tokens: input.maxOutputTokens,
          ...(system ? { system } : {}),
          messages,
        }),
      });
      if (!res.ok) throw new Error(`anthropic ${res.status}`);
      const data = (await res.json()) as {
        content?: { text?: string }[];
        stop_reason?: string;
        usage?: { input_tokens?: number; output_tokens?: number };
      };
      return {
        text: data.content?.map((c) => c.text ?? "").join("") ?? "",
        finishReason:
          data.stop_reason === "max_tokens"
            ? "max_tokens"
            : data.stop_reason === "refusal"
              ? "refusal"
              : "stop",
        usage: {
          inputTokens: data.usage?.input_tokens ?? 0,
          outputTokens: data.usage?.output_tokens ?? 0,
          cachedTokens: 0,
        },
      };
    },
    async ping() {
      const res = await fetch("https://api.anthropic.com/v1/models", {
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      });
      return res.ok;
    },
  };
}

/** OpenAI-compatible chat completions (OpenAI + Groq share this shape). */
function openAiCompatibleClient(apiKey: string, baseUrl: string): CloudClient {
  return {
    async generate(input: ProviderGenerateInput): Promise<ProviderGenerateResult> {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: vendorModel(input.modelId),
          max_tokens: input.maxOutputTokens,
          messages: input.messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) throw new Error(`${baseUrl} ${res.status}`);
      const data = (await res.json()) as {
        choices?: { message?: { content?: string }; finish_reason?: string }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const choice = data.choices?.[0];
      return {
        text: choice?.message?.content ?? "",
        finishReason: choice?.finish_reason === "length" ? "max_tokens" : "stop",
        usage: {
          inputTokens: data.usage?.prompt_tokens ?? 0,
          outputTokens: data.usage?.completion_tokens ?? 0,
          cachedTokens: 0,
        },
      };
    },
    async ping() {
      const res = await fetch(`${baseUrl}/models`, {
        headers: { authorization: `Bearer ${apiKey}` },
      });
      return res.ok;
    },
  };
}

/** Google Gemini (generateContent). */
function geminiClient(apiKey: string): CloudClient {
  return {
    async generate(input: ProviderGenerateInput): Promise<ProviderGenerateResult> {
      const model = vendorModel(input.modelId);
      const contents = input.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: { maxOutputTokens: input.maxOutputTokens },
          }),
        },
      );
      if (!res.ok) throw new Error(`gemini ${res.status}`);
      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      };
      return {
        text: data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "",
        finishReason: "stop",
        usage: {
          inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
          cachedTokens: 0,
        },
      };
    },
    async ping() {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
        headers: { "x-goog-api-key": apiKey },
      });
      return res.ok;
    },
  };
}

/**
 * Build the registry clients from env keys. A provider is wired only when its key is present; a
 * missing key leaves that provider `available: false` (falls through to Local). Reads env at call
 * time so keys are never captured at module load.
 */
export function createEnvProviders(): RegistryClients {
  const env = getEnv();
  return {
    ...(env.ANTHROPIC_API_KEY ? { anthropic: anthropicClient(env.ANTHROPIC_API_KEY) } : {}),
    ...(env.OPENAI_API_KEY
      ? { openai: openAiCompatibleClient(env.OPENAI_API_KEY, "https://api.openai.com/v1") }
      : {}),
    ...(env.GEMINI_API_KEY ? { gemini: geminiClient(env.GEMINI_API_KEY) } : {}),
    ...(env.GROQ_API_KEY
      ? { groq: openAiCompatibleClient(env.GROQ_API_KEY, "https://api.groq.com/openai/v1") }
      : {}),
  };
}

/** Which providers have a key configured (env), without ever exposing the key. */
export function configuredProviders(): Record<string, boolean> {
  const env = getEnv();
  return {
    anthropic: Boolean(env.ANTHROPIC_API_KEY),
    openai: Boolean(env.OPENAI_API_KEY),
    gemini: Boolean(env.GEMINI_API_KEY),
    groq: Boolean(env.GROQ_API_KEY),
    local: true,
  };
}
