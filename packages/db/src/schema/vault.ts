/**
 * Secure Vault schema (Stage C, Tier 2 — true E2EE). Stores ONLY client-encrypted material: the
 * server never sees plaintext, the passphrase, or the data-encryption key. Everything here is opaque
 * ciphertext/base64 the browser produced. There is deliberately no search, no AI, no server-side
 * decryption of any of it. Single-user (05 §0: no user_id).
 */
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Key material for the vault (a single row for the single owner). All fields are opaque to the server:
 * the DEK is wrapped by a key derived from the user's passphrase (and, optionally, a recovery code).
 */
export const secureVault = pgTable("secure_vault", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** Base64 salt for the passphrase KDF (PBKDF2). */
  kdfSalt: text("kdf_salt").notNull(),
  /** The data-encryption key, wrapped (AES-GCM) by the passphrase-derived key. */
  wrappedDek: text("wrapped_dek").notNull(),
  /** A known value encrypted with the DEK — lets the client verify a correct unlock. */
  verifier: text("verifier").notNull(),
  /** Salt for the recovery-code KDF (null until a recovery code is set). */
  recoverySalt: text("recovery_salt"),
  /** The DEK wrapped by the recovery-code-derived key (null until set). */
  recoveryWrappedDek: text("recovery_wrapped_dek"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** An end-to-end-encrypted note. Title + body are ciphertext the client sealed with the DEK. */
export const secureNotes = pgTable("secure_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  titleCiphertext: text("title_ciphertext").notNull(),
  bodyCiphertext: text("body_ciphertext").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
