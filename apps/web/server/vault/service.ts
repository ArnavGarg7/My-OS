import "server-only";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Secure Vault service (Stage C, Tier 2 — true E2EE). Deliberately trivial: it stores and returns the
 * client's ciphertext + wrapped keys and NEVER decrypts, searches, or reasons over any of it. The
 * server has no key. All confidentiality lives in the browser (lib/vault/crypto).
 */

/** Unlock material the client needs (salt + wrapped DEK + verifier). Not the recovery wrapping. */
export async function status(db: Database) {
  const meta = await repo.getMeta(db);
  if (!meta) return { setUp: false as const };
  return {
    setUp: true as const,
    kdfSalt: meta.kdfSalt,
    wrappedDek: meta.wrappedDek,
    verifier: meta.verifier,
    hasRecovery: Boolean(meta.recoveryWrappedDek),
  };
}

export interface KeyMaterial {
  kdfSalt: string;
  wrappedDek: string;
  verifier: string;
  recoverySalt: string | null;
  recoveryWrappedDek: string | null;
}

/** First-time setup. Refuses to overwrite an existing vault (that path is `rewrap`). */
export async function setup(db: Database, input: KeyMaterial) {
  if (await repo.getMeta(db)) return { ok: false as const, error: "already_set_up" };
  await repo.insertMeta(db, input);
  return { ok: true as const };
}

/** The recovery-wrapping material, for the "forgot passphrase" flow. */
export async function recovery(db: Database) {
  const meta = await repo.getMeta(db);
  if (!meta?.recoveryWrappedDek || !meta.recoverySalt) return { available: false as const };
  return {
    available: true as const,
    recoverySalt: meta.recoverySalt,
    recoveryWrappedDek: meta.recoveryWrappedDek,
  };
}

/** Re-wrap the DEK under a new passphrase (and optionally a new recovery code). */
export async function rewrap(db: Database, input: KeyMaterial) {
  const meta = await repo.getMeta(db);
  if (!meta) return { ok: false as const, error: "not_set_up" };
  await repo.updateMeta(db, meta.id, input);
  return { ok: true as const };
}

export async function notes(db: Database) {
  const rows = await repo.listNotes(db);
  return rows.map((r) => ({
    id: r.id,
    titleCiphertext: r.titleCiphertext,
    bodyCiphertext: r.bodyCiphertext,
    updatedAt: r.updatedAt,
  }));
}

export function createNote(db: Database, titleCiphertext: string, bodyCiphertext: string) {
  return repo.insertNote(db, titleCiphertext, bodyCiphertext);
}

export function updateNote(
  db: Database,
  id: string,
  titleCiphertext: string,
  bodyCiphertext: string,
) {
  return repo.updateNote(db, id, titleCiphertext, bodyCiphertext);
}

export async function removeNote(db: Database, id: string) {
  await repo.deleteNote(db, id);
  return { ok: true as const };
}
