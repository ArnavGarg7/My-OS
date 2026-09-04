import "server-only";
import { getProvider } from "@myos/core/connectors";
import { providerLiveAvailable } from "./capabilities";
import * as repo from "./repository";
import type { Database } from "@myos/db";

/**
 * External write seam (Stage 4). The MY OS → EXTERNAL direction: the architecture
 * by which My OS performs an action on a provider (e.g. create a calendar event).
 * Every write is:
 *   1. explicitly targeted (provider + account + action + payload),
 *   2. permission-checked (a read-only provider, or one with no live credentials,
 *      is refused — no silent success),
 *   3. executed through an INJECTED `liveWrite` seam (real OAuth/HTTP lives there,
 *      exactly like the read-side `liveFetch`),
 *   4. honest on failure — it returns a typed reason, never a fabricated success.
 *
 * With no live credentials configured (this environment), every write resolves to
 * `{ ok: false, reason: "not_connected" }`. That is the correct, non-fabricated
 * outcome: My OS will not claim to have written to a service it isn't connected to.
 */

export type ExternalWriteAction = "calendar.create" | "calendar.update" | "calendar.delete";

export type WriteReason =
  | "not_connected" // no connected account for this provider
  | "no_live_credentials" // connected, but sample-only (no real write scope/credentials)
  | "unknown_provider"
  | "unsupported_action" // the provider has no write capability for this action
  | "provider_error"; // the live seam threw

export interface WriteResult {
  ok: boolean;
  reason?: WriteReason;
  /** The external id the provider assigned, when the write succeeded. */
  externalId?: string;
}

/** The injected live-write seam. Absent ⇒ no real provider write is possible. */
export type LiveWrite = (
  providerId: string,
  action: ExternalWriteAction,
  payload: Record<string, unknown>,
) => Promise<{ externalId: string }>;

/**
 * Explicit write capabilities per provider. This is the write-PERMISSION source
 * of truth — separate from the registry's read-first `readOnly` sync flag. A
 * provider absent here (or an action it doesn't list) cannot be written to, so a
 * read-only service like Gmail resolves to `unsupported_action`, never a fake
 * success. Adding a real write needs both an entry here AND a live write scope.
 */
const WRITE_SUPPORTS: Record<string, ExternalWriteAction[]> = {
  "google-calendar": ["calendar.create", "calendar.update", "calendar.delete"],
};

/**
 * Attempt an external write. Deterministic gating first, then the live seam.
 * Never throws — a provider failure becomes `{ ok:false, reason:"provider_error" }`.
 */
export async function writeExternal(
  db: Database,
  providerId: string,
  action: ExternalWriteAction,
  payload: Record<string, unknown>,
  liveWrite?: LiveWrite,
): Promise<WriteResult> {
  const provider = getProvider(providerId);
  if (!provider) return { ok: false, reason: "unknown_provider" };
  // Write permission is explicit per provider/action — the registry `readOnly`
  // flag governs the read-first SYNC posture, not whether a scoped write exists.
  if (!(WRITE_SUPPORTS[providerId] ?? []).includes(action)) {
    return { ok: false, reason: "unsupported_action" };
  }

  const accounts = await repo.listAccounts(db).catch(() => []);
  const account = accounts.find((a) => a.providerId === providerId);
  if (!account) return { ok: false, reason: "not_connected" };
  if (!providerLiveAvailable(providerId) || !liveWrite) {
    return { ok: false, reason: "no_live_credentials" };
  }

  try {
    const { externalId } = await liveWrite(providerId, action, payload);
    return { ok: true, externalId };
  } catch {
    return { ok: false, reason: "provider_error" };
  }
}

/**
 * The write-capability descriptor for a provider — used by the UI to decide
 * whether to OFFER an external write and what honest state to show. `google-
 * calendar` is registry-read-only today, so calendar writes are architecturally
 * defined here (a future migration flips the registry flag once live OAuth with a
 * write scope exists); until then the honest result is `no_live_credentials`.
 */
export function writeCapability(providerId: string): {
  supportsWrite: boolean;
  liveAvailable: boolean;
  actions: ExternalWriteAction[];
} {
  const actions = WRITE_SUPPORTS[providerId] ?? [];
  return {
    supportsWrite: actions.length > 0,
    liveAvailable: providerLiveAvailable(providerId),
    actions,
  };
}
