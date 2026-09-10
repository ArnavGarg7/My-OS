import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import { schema } from "@myos/db";

/**
 * Secure Vault repository (Stage C, Tier 2). Reads/writes ONLY opaque ciphertext + wrapped keys.
 * Nothing here can decrypt anything — there is no key on the server. Single owner → one meta row.
 */
const { secureVault, secureNotes } = schema;

export async function getMeta(db: Database) {
  const [row] = await db.select().from(secureVault).limit(1);
  return row ?? null;
}

export async function insertMeta(
  db: Database,
  v: {
    kdfSalt: string;
    wrappedDek: string;
    verifier: string;
    recoverySalt: string | null;
    recoveryWrappedDek: string | null;
  },
) {
  const [row] = await db.insert(secureVault).values(v).returning();
  return row;
}

export async function updateMeta(
  db: Database,
  id: string,
  v: {
    kdfSalt: string;
    wrappedDek: string;
    verifier: string;
    recoverySalt: string | null;
    recoveryWrappedDek: string | null;
  },
) {
  const [row] = await db
    .update(secureVault)
    .set({ ...v, updatedAt: new Date() })
    .where(eq(secureVault.id, id))
    .returning();
  return row;
}

export async function listNotes(db: Database) {
  return db.select().from(secureNotes).orderBy(desc(secureNotes.updatedAt));
}

export async function insertNote(db: Database, titleCiphertext: string, bodyCiphertext: string) {
  const [row] = await db
    .insert(secureNotes)
    .values({ titleCiphertext, bodyCiphertext })
    .returning();
  return row;
}

export async function updateNote(
  db: Database,
  id: string,
  titleCiphertext: string,
  bodyCiphertext: string,
) {
  const [row] = await db
    .update(secureNotes)
    .set({ titleCiphertext, bodyCiphertext, updatedAt: new Date() })
    .where(eq(secureNotes.id, id))
    .returning();
  return row;
}

export async function deleteNote(db: Database, id: string) {
  await db.delete(secureNotes).where(eq(secureNotes.id, id));
}
