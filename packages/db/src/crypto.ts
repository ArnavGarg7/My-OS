import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { customType } from "drizzle-orm/pg-core";

/**
 * Field-level encryption at rest (Stage C, Tier 1). AES-256-GCM with a key derived from
 * `MYOS_DATA_ENCRYPTION_KEY` (distinct from the credential-vault secrets). Applied via the
 * `encryptedText` Drizzle column type: values are sealed on write and opened on read, transparently,
 * so services/engines see plaintext and search (which filters in-memory over decrypted rows) still
 * works — while a stolen DB/backup holds only ciphertext.
 *
 * Reads are TOLERANT: a value without the `enc:v1:` marker is returned as-is. That lets existing
 * plaintext rows keep working before the one-time backfill, with no destructive migration.
 */

const PREFIX = "enc:v1:";

// Derive the 32-byte key once (scrypt is deliberately slow — never per field).
let cachedKey: Buffer | null = null;
function key(): Buffer {
  if (!cachedKey) {
    const secret = process.env.MYOS_DATA_ENCRYPTION_KEY ?? "myos-data-dev-key-offline-only";
    cachedKey = scryptSync(secret, "myos-data-vault", 32);
  }
  return cachedKey;
}

/** Seal a plaintext string → `enc:v1:<base64(iv|tag|ciphertext)>`. */
export function sealField(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ct]).toString("base64");
}

/** Open a sealed value. Non-`enc:v1:` (pre-migration plaintext) or undecryptable input is returned as-is. */
export function openField(value: string): string {
  if (!value.startsWith(PREFIX)) return value;
  try {
    const raw = Buffer.from(value.slice(PREFIX.length), "base64");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ct = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  } catch {
    return value;
  }
}

/** True when a stored value is already sealed (used by the backfill to skip encrypted rows). */
export function isSealed(value: string): boolean {
  return value.startsWith(PREFIX);
}

/**
 * A `text` column that is transparently encrypted at rest. Swap `text("body")` → `encryptedText("body")`
 * to encrypt a private free-text field with ZERO schema migration (the underlying column stays `text`)
 * and no service changes. Null is passed through untouched.
 */
export const encryptedText = customType<{ data: string; driverData: string }>({
  dataType() {
    return "text";
  },
  toDriver(value) {
    return value == null ? value : sealField(value);
  },
  fromDriver(value) {
    return value == null ? value : openField(value);
  },
});
