/**
 * Secure Vault client crypto (Stage C, Tier 2 — true E2EE). Runs ONLY in the browser (WebCrypto):
 * the passphrase and the data-encryption key (DEK) never leave the device. PBKDF2 derives a wrapping
 * key from the passphrase; a random DEK is wrapped by it (and by a recovery-code key) and only the
 * wrapped forms + ciphertext ever reach the server. Dependency-free (Web Crypto, AES-256-GCM).
 */

const PBKDF2_ITERATIONS = 310_000;
const VERIFIER_TEXT = "myos-vault-verifier-v1";
const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s);
}
function unb64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}
// WebCrypto accepts BufferSource; the DOM lib's ArrayBuffer generic is stricter than our Uint8Arrays.
const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

export function randomSaltB64(): string {
  return b64(crypto.getRandomValues(new Uint8Array(16)));
}

/** A human-transcribable recovery code, e.g. "K3F9-2M7Q-X1A8-...". */
export function randomRecoveryCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  return (chars.join("").match(/.{1,4}/g) ?? []).join("-");
}

/** Derive an AES-GCM wrapping key from a passphrase/recovery code + salt (PBKDF2-SHA256). */
export async function deriveWrappingKey(secret: string, saltB64: string): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey("raw", bs(enc.encode(secret)), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: bs(unb64(saltB64)), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["wrapKey", "unwrapKey"],
  );
}

/** Generate a fresh random data-encryption key (extractable so it can be re-wrapped). */
export function generateDek(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

/** Wrap the DEK with a wrapping key → base64(iv | wrapped). */
export async function wrapDek(dek: CryptoKey, wrappingKey: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrapped = await crypto.subtle.wrapKey("raw", dek, wrappingKey, {
    name: "AES-GCM",
    iv: bs(iv),
  });
  return b64(concat(iv, new Uint8Array(wrapped)));
}

/** Unwrap the DEK. Throws on a wrong passphrase (GCM tag mismatch). */
export async function unwrapDek(wrappedB64: string, wrappingKey: CryptoKey): Promise<CryptoKey> {
  const raw = unb64(wrappedB64);
  const iv = raw.subarray(0, 12);
  const body = raw.subarray(12);
  return crypto.subtle.unwrapKey(
    "raw",
    bs(body),
    wrappingKey,
    { name: "AES-GCM", iv: bs(iv) },
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

/** Encrypt a string with the DEK → base64(iv | ciphertext). */
export async function encryptField(dek: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: bs(iv) },
    dek,
    bs(enc.encode(plaintext)),
  );
  return b64(concat(iv, new Uint8Array(ct)));
}

/** Decrypt a base64(iv | ciphertext) blob with the DEK. */
export async function decryptField(dek: CryptoKey, sealedB64: string): Promise<string> {
  const raw = unb64(sealedB64);
  const iv = raw.subarray(0, 12);
  const ct = raw.subarray(12);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bs(iv) }, dek, bs(ct));
  return dec.decode(pt);
}

/** A verifier blob (known text sealed with the DEK) — lets us confirm a correct unlock. */
export function makeVerifier(dek: CryptoKey): Promise<string> {
  return encryptField(dek, VERIFIER_TEXT);
}
export async function checkVerifier(dek: CryptoKey, verifier: string): Promise<boolean> {
  try {
    return (await decryptField(dek, verifier)) === VERIFIER_TEXT;
  } catch {
    return false;
  }
}
