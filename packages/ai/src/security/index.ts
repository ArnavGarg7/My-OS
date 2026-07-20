/**
 * AI Security Hardening (Sprint 5.4, 06_AI_Architecture §Security). Pure validators and diagnostics
 * for the AI layer: credential FORMAT validation (never storage — a caller passes a value to check
 * its shape, and this module returns only a verdict, never echoing the secret), secret-configuration
 * diagnostics, tool-permission checking, prompt-injection resistance scanning, and secret redaction
 * for anything about to be logged. No IO, no persistence of secrets.
 */

export type SecretProvider = "anthropic" | "openai" | "gemini" | "groq";

/** Expected key-prefix / shape per provider (format only — not a liveness check). */
const KEY_RULES: Record<SecretProvider, { prefix: string; minLen: number }> = {
  anthropic: { prefix: "sk-ant-", minLen: 20 },
  openai: { prefix: "sk-", minLen: 20 },
  groq: { prefix: "gsk_", minLen: 20 },
  gemini: { prefix: "AIza", minLen: 20 },
};

export interface CredentialVerdict {
  provider: SecretProvider;
  /** Whether the value is well-formed for this provider. */
  valid: boolean;
  /** Why it failed — never contains the value itself. */
  reason: string;
}

/**
 * Validate a credential's FORMAT for a provider. Returns a verdict only; the passed value is never
 * stored, logged or returned. Empty → invalid (missing), wrong prefix/length → invalid.
 */
export function validateCredential(provider: SecretProvider, value: string): CredentialVerdict {
  const rule = KEY_RULES[provider];
  if (!value) return { provider, valid: false, reason: "missing" };
  if (value.length < rule.minLen) return { provider, valid: false, reason: "too_short" };
  if (!value.startsWith(rule.prefix))
    return { provider, valid: false, reason: `expected_prefix_${rule.prefix}` };
  return { provider, valid: true, reason: "ok" };
}

export interface SecretFinding {
  provider: SecretProvider;
  configured: boolean;
  severity: "info" | "warning";
  message: string;
}

/**
 * Diagnose the secret configuration from a map of which providers have a key present (from env).
 * Missing cloud keys are informational (Local is a complete fallback); an encryption-secret gap is a
 * warning when any cloud key IS configured.
 */
export function secretDiagnostics(
  configured: Record<SecretProvider, boolean>,
  encryptionSecretPresent: boolean,
): { findings: SecretFinding[]; anyCloudConfigured: boolean; encryptionOk: boolean } {
  const findings: SecretFinding[] = [];
  let anyCloud = false;
  for (const provider of Object.keys(KEY_RULES) as SecretProvider[]) {
    const on = configured[provider] ?? false;
    if (on) anyCloud = true;
    findings.push({
      provider,
      configured: on,
      severity: "info",
      message: on ? "key present" : "no key — Local provider serves this capability",
    });
  }
  const encryptionOk = !anyCloud || encryptionSecretPresent;
  return { findings, anyCloudConfigured: anyCloud, encryptionOk };
}

export interface PermissionCheck {
  authorized: boolean;
  missing: string[];
}

/** Check that every required permission is present in the granted set (tool authorization). */
export function checkPermissions(
  granted: readonly string[],
  required: readonly string[],
): PermissionCheck {
  const set = new Set(granted);
  const missing = required.filter((p) => !set.has(p));
  return { authorized: missing.length === 0, missing };
}

/** Patterns that indicate an attempt to override system instructions (prompt injection). */
const INJECTION_PATTERNS: { id: string; re: RegExp }[] = [
  { id: "ignore_previous", re: /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/i },
  { id: "override_system", re: /disregard\s+(?:the\s+)?system\s+prompt/i },
  { id: "role_reassign", re: /you\s+are\s+now\s+(?:a|an|the)\b/i },
  {
    id: "reveal_secrets",
    re: /(?:reveal|print|show)\s+(?:your\s+)?(?:system\s+prompt|api\s+keys?|secrets?)/i,
  },
  { id: "developer_mode", re: /\b(?:developer|jailbreak|dan)\s+mode\b/i },
];

export interface InjectionScan {
  suspicious: boolean;
  patterns: string[];
}

/**
 * Scan untrusted text (tool output, snapshot content, user-pasted data) for prompt-injection
 * attempts. Content is DATA, never instructions — a positive scan lets the server flag/quarantine.
 */
export function scanForInjection(text: string): InjectionScan {
  const patterns = INJECTION_PATTERNS.filter((p) => p.re.test(text)).map((p) => p.id);
  return { suspicious: patterns.length > 0, patterns };
}

/** Redact anything key-shaped from a string before it is logged (defense in depth). */
export function redactSecrets(text: string): string {
  return text
    .replace(/sk-ant-[A-Za-z0-9_-]{6,}/g, "sk-ant-***")
    .replace(/sk-(?:proj-)?[A-Za-z0-9_-]{6,}/g, "sk-***")
    .replace(/gsk_[A-Za-z0-9]{6,}/g, "gsk_***")
    .replace(/AIza[A-Za-z0-9_-]{6,}/g, "AIza***");
}
