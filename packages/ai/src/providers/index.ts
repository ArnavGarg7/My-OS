/**
 * @myos/ai/providers — the provider framework. One interchangeable interface (`Provider`), a
 * deterministic Local implementation, injected-client cloud adapters, and a registry. Switching
 * providers is configuration, never code (06_AI_Architecture §Provider Framework).
 */
export * from "./types";
export { CloudProvider, type CloudClient } from "./cloud";
export { LocalProvider, embedDeterministic, type LocalProviderOptions } from "./local";
export { createAnthropicProvider } from "./anthropic";
export { createOpenAiProvider } from "./openai";
export { createGeminiProvider } from "./gemini";
export { createGroqProvider } from "./groq";
export { ProviderRegistry, type RegistryClients } from "./registry";
