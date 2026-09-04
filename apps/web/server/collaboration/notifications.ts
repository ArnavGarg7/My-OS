import "server-only";
import type { NotificationDraft } from "@myos/core/notification";

/**
 * Collaboration → notifications (Stage 7). Builds drafts for the EXISTING notification
 * engine (source "collaboration") — no second notification system; dedup/priority/
 * quiet-hours/lifecycle/delivery and the single status-bar counter are all reused.
 *
 * Each notification names its recipient explicitly. In this single-owner deployment the
 * owner oversees all collaboration, so every collaboration notification surfaces in the
 * owner's feed, attributed to who it is for. In true multiplayer each would route to its
 * recipient's own feed by `recipientCollaboratorId` — the field is carried in the payload
 * so that routing is a filter, not a rewrite.
 */

interface Recipient {
  collaboratorId: string | null; // null = the owner
  label: string; // "You" or a collaborator name
}

function base(
  recipient: Recipient,
  extra: Partial<NotificationDraft> & { title: string; reason: string; dedupeKey: string },
): NotificationDraft {
  return {
    type: "information",
    priority: "medium",
    source: "collaboration",
    trigger: "collaboration_event",
    condition: extra.condition ?? "collaboration",
    payload: { recipientCollaboratorId: recipient.collaboratorId, ...(extra.payload ?? {}) },
    sourceHref: extra.sourceHref ?? null,
    ttlMinutes: extra.ttlMinutes ?? 7 * 24 * 60,
    ...extra,
  };
}

export function mentionDraft(args: {
  recipient: Recipient;
  messageId: string;
  subjectLabel: string;
  href: string | null;
  authorLabel: string;
}): NotificationDraft {
  return base(args.recipient, {
    priority: "high",
    condition: "mention",
    title:
      args.recipient.collaboratorId === null
        ? `You were mentioned in ${args.subjectLabel}`
        : `${args.recipient.label} was mentioned in ${args.subjectLabel}`,
    reason: `${args.authorLabel} mentioned ${args.recipient.label} in a discussion.`,
    dedupeKey: `collab:mention:${args.messageId}:${args.recipient.collaboratorId ?? "owner"}`,
    sourceHref: args.href,
  });
}

export function assignmentDraft(args: {
  recipient: Recipient;
  taskId: string;
  taskTitle: string;
  href: string | null;
  authorLabel: string;
}): NotificationDraft {
  return base(args.recipient, {
    priority: "high",
    condition: "assignment",
    title:
      args.recipient.collaboratorId === null
        ? `You were assigned "${args.taskTitle}"`
        : `"${args.taskTitle}" assigned to ${args.recipient.label}`,
    reason: `${args.authorLabel} assigned the task.`,
    dedupeKey: `collab:assigned:${args.taskId}:${args.recipient.collaboratorId ?? "owner"}`,
    sourceHref: args.href,
  });
}

export function commentDraft(args: {
  recipient: Recipient;
  conversationId: string;
  subjectLabel: string;
  href: string | null;
  authorLabel: string;
}): NotificationDraft {
  return base(args.recipient, {
    condition: "comment",
    title: `New comment in ${args.subjectLabel}`,
    reason: `${args.authorLabel} commented in a discussion you're part of.`,
    // One "new comments" notification per conversation+recipient — refreshes, never spams.
    dedupeKey: `collab:comment:${args.conversationId}:${args.recipient.collaboratorId ?? "owner"}`,
    sourceHref: args.href,
  });
}

export function decisionResolvedDraft(args: {
  recipient: Recipient;
  decisionId: string;
  decisionTitle: string;
  href: string | null;
  authorLabel: string;
}): NotificationDraft {
  return base(args.recipient, {
    priority: "high",
    condition: "decision_resolved",
    title: `Decision resolved — ${args.decisionTitle}`,
    reason: `${args.authorLabel} resolved a decision you participate in.`,
    dedupeKey: `collab:decision-resolved:${args.decisionId}:${args.recipient.collaboratorId ?? "owner"}`,
    sourceHref: args.href,
  });
}

export function memberAddedDraft(args: {
  recipient: Recipient;
  projectId: string;
  projectName: string;
  href: string | null;
  authorLabel: string;
}): NotificationDraft {
  return base(args.recipient, {
    condition: "member_added",
    title:
      args.recipient.collaboratorId === null
        ? `You joined ${args.projectName}`
        : `${args.recipient.label} joined ${args.projectName}`,
    reason: `${args.authorLabel} shared the project.`,
    dedupeKey: `collab:member-added:${args.projectId}:${args.recipient.collaboratorId ?? "owner"}`,
    sourceHref: args.href,
  });
}
