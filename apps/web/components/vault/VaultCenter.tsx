"use client";

import { useState } from "react";
import { KeyRound, Lock, LockOpen, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Badge, Button, Card, MonoLabel, Text, cn } from "@myos/ui";
import { PageContainer, PageHeader, PageLoading } from "@/components/framework";
import { trpc } from "@/lib/trpc/client";
import { useToaster } from "@/lib/framework";
import {
  checkVerifier,
  decryptField,
  deriveWrappingKey,
  encryptField,
  generateDek,
  makeVerifier,
  randomRecoveryCode,
  randomSaltB64,
  unwrapDek,
  wrapDek,
} from "@/lib/vault/crypto";

/**
 * Secure Vault (Stage C, Tier 2 — true E2EE). Everything confidential happens in THIS component, in
 * the browser: the passphrase and the data-encryption key never leave the device, and the server only
 * ever sees ciphertext. Three states — set up a passphrase, unlock, or (unlocked) read/write notes.
 * The DEK lives only in React state for the session; locking or a refresh discards it.
 */
interface DecryptedNote {
  id: string;
  title: string;
  body: string;
}

export function VaultCenter() {
  const status = trpc.vault.status.useQuery();
  const [dek, setDek] = useState<CryptoKey | null>(null);
  const [notes, setNotes] = useState<DecryptedNote[]>([]);

  if (status.isLoading) return <PageLoading label="Checking your vault…" />;

  return (
    <PageContainer>
      <PageHeader
        eyebrow={<MonoLabel tone="subtle">System · Secure Vault</MonoLabel>}
        title="Secure Vault"
        description="End-to-end encrypted notes. Encrypted on this device with your passphrase — the server only ever stores ciphertext, and the OS/AI can never read them. That also means: no search, and if you lose your passphrase and recovery code, the notes are gone."
      />
      {!status.data?.setUp ? (
        <SetupPanel onDone={() => void status.refetch()} />
      ) : !dek ? (
        <UnlockPanel
          meta={status.data}
          onUnlock={(key, decrypted) => {
            setDek(key);
            setNotes(decrypted);
          }}
        />
      ) : (
        <NotesPanel dek={dek} notes={notes} setNotes={setNotes} onLock={() => setDek(null)} />
      )}
    </PageContainer>
  );
}

// ── Setup ─────────────────────────────────────────────────────────────────────────────────────
function SetupPanel({ onDone }: { onDone: () => void }) {
  const toaster = useToaster();
  const setup = trpc.vault.setup.useMutation();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [recovery, setRecovery] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (pass.length < 8) return toaster.error("Too short", "Use at least 8 characters.");
    if (pass !== confirm) return toaster.error("Mismatch", "The passphrases don't match.");
    setBusy(true);
    try {
      const dek = await generateDek();
      const kdfSalt = randomSaltB64();
      const wrappedDek = await wrapDek(dek, await deriveWrappingKey(pass, kdfSalt));
      const verifier = await makeVerifier(dek);
      const recoveryCode = randomRecoveryCode();
      const recoverySalt = randomSaltB64();
      const recoveryWrappedDek = await wrapDek(
        dek,
        await deriveWrappingKey(recoveryCode, recoverySalt),
      );
      const res = await setup.mutateAsync({
        kdfSalt,
        wrappedDek,
        verifier,
        recoverySalt,
        recoveryWrappedDek,
      });
      if (!res.ok) return toaster.error("Couldn't set up", res.error);
      setRecovery(recoveryCode); // show once
    } catch {
      toaster.error("Setup failed", "Your browser couldn't complete the encryption.");
    } finally {
      setBusy(false);
    }
  };

  if (recovery) {
    return (
      <Card variant="insight" padding="lg" className="flex max-w-lg flex-col gap-3">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-warning" aria-hidden />
          <Text variant="body-m" className="font-medium">
            Save your recovery code
          </Text>
        </div>
        <Text variant="body-s" tone="muted">
          This is the <strong>only</strong> way back in if you forget your passphrase. It is shown
          once and never stored in readable form. Write it down somewhere safe.
        </Text>
        <div className="bg-inset border-border rounded-lg border p-3 text-center">
          <Text variant="mono" className="tracking-[0.15em]">
            {recovery}
          </Text>
        </div>
        <Button variant="primary" onClick={onDone}>
          I&rsquo;ve saved it — continue
        </Button>
      </Card>
    );
  }

  return (
    <Card variant="standard" padding="lg" className="flex max-w-lg flex-col gap-3">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-fg-subtle" aria-hidden />
        <Text variant="body-m" className="font-medium">
          Set an encryption passphrase
        </Text>
      </div>
      <Text variant="body-s" tone="muted">
        Separate from your login. It never leaves this device — we can&rsquo;t reset it. Choose
        something strong you won&rsquo;t forget.
      </Text>
      <VaultInput value={pass} onChange={setPass} placeholder="Passphrase (8+ characters)" />
      <VaultInput value={confirm} onChange={setConfirm} placeholder="Confirm passphrase" />
      <Button variant="primary" onClick={create} disabled={busy}>
        {busy ? "Encrypting…" : "Create secure vault"}
      </Button>
    </Card>
  );
}

// ── Unlock ────────────────────────────────────────────────────────────────────────────────────
function UnlockPanel({
  meta,
  onUnlock,
}: {
  meta: { kdfSalt: string; wrappedDek: string; verifier: string; hasRecovery: boolean };
  onUnlock: (dek: CryptoKey, notes: DecryptedNote[]) => void;
}) {
  const toaster = useToaster();
  const utils = trpc.useUtils();
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);

  const decryptAllNotes = async (dek: CryptoKey): Promise<DecryptedNote[]> => {
    const rows = await utils.vault.notes.fetch();
    return Promise.all(
      rows.map(async (r) => ({
        id: r.id,
        title: await decryptField(dek, r.titleCiphertext).catch(() => "(unreadable)"),
        body: await decryptField(dek, r.bodyCiphertext).catch(() => ""),
      })),
    );
  };

  const unlock = async () => {
    setBusy(true);
    try {
      const kek = await deriveWrappingKey(pass, meta.kdfSalt);
      const dek = await unwrapDek(meta.wrappedDek, kek).catch(() => null);
      if (!dek || !(await checkVerifier(dek, meta.verifier))) {
        return toaster.error("Wrong passphrase", "That didn't unlock the vault.");
      }
      onUnlock(dek, await decryptAllNotes(dek));
    } catch {
      toaster.error("Couldn't unlock", "Something went wrong decrypting.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card variant="standard" padding="lg" className="flex max-w-lg flex-col gap-3">
      <div className="flex items-center gap-2">
        <Lock size={16} className="text-fg-subtle" aria-hidden />
        <Text variant="body-m" className="font-medium">
          Vault locked
        </Text>
        <Badge variant="success" size="sm">
          end-to-end encrypted
        </Badge>
      </div>
      <Text variant="body-s" tone="muted">
        Enter your passphrase to decrypt your notes on this device.
      </Text>
      <VaultInput
        value={pass}
        onChange={setPass}
        placeholder="Passphrase"
        onEnter={() => void unlock()}
      />
      <Button variant="primary" onClick={unlock} disabled={busy || !pass}>
        {busy ? "Unlocking…" : "Unlock"}
      </Button>
      {meta.hasRecovery ? (
        <Text variant="caption" tone="subtle">
          Forgot it? Recovery via your one-time code is coming — for now, keep the passphrase safe.
        </Text>
      ) : null}
    </Card>
  );
}

// ── Notes (unlocked) ──────────────────────────────────────────────────────────────────────────
function NotesPanel({
  dek,
  notes,
  setNotes,
  onLock,
}: {
  dek: CryptoKey;
  notes: DecryptedNote[];
  setNotes: (n: DecryptedNote[]) => void;
  onLock: () => void;
}) {
  const toaster = useToaster();
  const create = trpc.vault.createNote.useMutation();
  const del = trpc.vault.deleteNote.useMutation();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const row = await create.mutateAsync({
        titleCiphertext: await encryptField(dek, title.trim()),
        bodyCiphertext: await encryptField(dek, body),
      });
      if (!row) throw new Error("no row");
      setNotes([{ id: row.id, title: title.trim(), body }, ...notes]);
      setTitle("");
      setBody("");
    } catch {
      toaster.error("Couldn't save", "Encryption or save failed.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await del.mutateAsync({ id }).catch(() => {});
    setNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LockOpen size={15} className="text-success" aria-hidden />
          <MonoLabel tone="subtle">Unlocked · {notes.length} note(s)</MonoLabel>
        </div>
        <Button variant="secondary" size="sm" onClick={onLock} leftIcon={<Lock size={13} />}>
          Lock
        </Button>
      </div>

      <Card variant="standard" padding="lg" className="flex flex-col gap-2">
        <VaultInput value={title} onChange={setTitle} placeholder="Note title" type="text" />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Encrypted body… (never leaves this device unencrypted)"
          rows={3}
          className="border-border bg-inset text-body-s text-fg placeholder:text-fg-subtle w-full rounded-lg border px-3 py-2 outline-none"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={add}
          disabled={busy || !title.trim()}
          leftIcon={<Plus size={13} />}
          className="self-start"
        >
          {busy ? "Encrypting…" : "Add encrypted note"}
        </Button>
      </Card>

      <div className="flex flex-col gap-2">
        {notes.length === 0 ? (
          <Text variant="body-s" tone="subtle" className="py-6 text-center">
            No notes yet. Anything you add here is encrypted on this device before it&rsquo;s
            stored.
          </Text>
        ) : (
          notes.map((n) => (
            <Card
              key={n.id}
              variant="standard"
              padding="md"
              className={cn("flex items-start justify-between gap-3")}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <Text variant="body-m" className="truncate font-medium">
                  {n.title}
                </Text>
                {n.body ? (
                  <Text variant="body-s" tone="muted" className="whitespace-pre-wrap">
                    {n.body}
                  </Text>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void remove(n.id)}
                aria-label="Delete note"
                className="text-fg-subtle hover:text-danger shrink-0"
              >
                <Trash2 size={15} aria-hidden />
              </button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function VaultInput({
  value,
  onChange,
  placeholder,
  onEnter,
  type = "password",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onEnter?: () => void;
  type?: "password" | "text";
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      placeholder={placeholder}
      className="border-border bg-inset text-body-s text-fg placeholder:text-fg-subtle w-full rounded-lg border px-3 py-2 outline-none"
    />
  );
}
