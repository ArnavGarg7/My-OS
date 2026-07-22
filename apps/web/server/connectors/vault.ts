import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { getEnv } from "../env";

/**
 * Credential Vault (Sprint 6.4). Encrypts connector secrets at rest with AES-256-GCM and NEVER
 * returns plaintext through the API. **Isolated from the AI subsystem** — no AI provider can reach
 * this module or the key it derives. The key comes from `MYOS_CONNECTOR_SECRET` (a dedicated env
 * secret, distinct from the AI credentials secret); when absent a deterministic dev key keeps offline
 * connectors working in CI without ever persisting a real secret. Only `encrypt`/`decrypt` cross this
 * boundary; decrypt is called solely by the sync path, never by a router query.
 */

const ALGO = "aes-256-gcm";

/** Derive the 32-byte key. Dedicated secret, never the AI secret; scrypt-stretched. */
function key(): Buffer {
  const secret = getEnv().MYOS_CONNECTOR_SECRET ?? "myos-connector-dev-key-offline-only";
  return scryptSync(secret, "myos-connector-vault", 32);
}

export interface Sealed {
  ciphertext: string;
  iv: string;
  tag: string;
}

/** Encrypt a plaintext secret → base64 ciphertext + iv + auth tag. Deterministic key, random iv. */
export function encryptSecret(plaintext: string): Sealed {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    ciphertext: ct.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

/** Decrypt a sealed secret. Throws on tamper (GCM tag mismatch). Server-only, sync-path-only. */
export function decryptSecret(sealed: Sealed): string {
  const decipher = createDecipheriv(ALGO, key(), Buffer.from(sealed.iv, "base64"));
  decipher.setAuthTag(Buffer.from(sealed.tag, "base64"));
  const pt = Buffer.concat([
    decipher.update(Buffer.from(sealed.ciphertext, "base64")),
    decipher.final(),
  ]);
  return pt.toString("utf8");
}

/** A non-secret display hint from a secret (last 4 chars), e.g. "•••4821". Never the secret itself. */
export function secretHint(plaintext: string): string {
  if (!plaintext) return "";
  const tail = plaintext.slice(-4);
  return `•••${tail}`;
}
