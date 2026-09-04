import { MESSAGE_MAX_LENGTH, MESSAGE_MIN_LENGTH } from "./constants";
import type { Message } from "./types";

/**
 * Message domain (Stage 7). Pure validation + lifecycle transforms. Messages are durable
 * server-side objects; this module only shapes them deterministically. Time + ids are
 * injected so the same input always yields the same result.
 */

export interface MessageValidation {
  ok: boolean;
  reason?: string;
}

/** Validate a body for posting/editing. */
export function validateBody(body: string): MessageValidation {
  const trimmed = body.trim();
  if (trimmed.length < MESSAGE_MIN_LENGTH) return { ok: false, reason: "Message is empty." };
  if (trimmed.length > MESSAGE_MAX_LENGTH) {
    return { ok: false, reason: `Message exceeds ${MESSAGE_MAX_LENGTH} characters.` };
  }
  return { ok: true };
}

export interface NewMessageInput {
  id: string;
  conversationId: string;
  authorCollaboratorId: string | null;
  body: string;
  mentions: string[];
  parentMessageId: string | null;
  now: string;
}

/** Build a fresh message (post-validation). */
export function buildMessage(input: NewMessageInput): Message {
  return {
    id: input.id,
    conversationId: input.conversationId,
    authorCollaboratorId: input.authorCollaboratorId,
    body: input.body.trim(),
    mentions: input.mentions,
    parentMessageId: input.parentMessageId,
    createdAt: input.now,
    editedAt: null,
    deletedAt: null,
  };
}

/** Apply an edit (new body + mentions), stamping editedAt. */
export function applyEdit(
  message: Message,
  body: string,
  mentions: string[],
  now: string,
): Message {
  return { ...message, body: body.trim(), mentions, editedAt: now };
}

/** Soft-delete: keep the row (thread integrity) but blank the body. */
export function applyDelete(message: Message, now: string): Message {
  return { ...message, body: "", mentions: [], deletedAt: now };
}

/** A message is visible if not soft-deleted (deleted ones render as a tombstone). */
export function isDeleted(message: Message): boolean {
  return message.deletedAt !== null;
}
