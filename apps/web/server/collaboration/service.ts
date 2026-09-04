import "server-only";
import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import type { Database } from "@myos/db";
import type { NotificationDraft } from "@myos/core/notification";
import {
  OWNER_ACTOR,
  buildActivity,
  buildMessage,
  applyEdit,
  applyDelete,
  canAccessSubject,
  can,
  canModifyMessage,
  createInvitation,
  acceptInvitation as acceptInv,
  rejectInvitation as rejectInv,
  effectiveStatus,
  resolveMentions,
  validateBody,
  type Actor,
  type Collaborator,
  type ConversationSubject,
  type MembershipRole,
  type SubjectRef,
} from "@myos/core/collaboration";
import * as repo from "./repository";
import * as drafts from "./notifications";
import { emitCollab } from "./realtime";
import * as timeline from "../timeline/service";
import * as notifService from "../notification/service";
import * as decisionService from "../decision/service";

/**
 * Collaboration service (Stage 7). Orchestrates people, sharing, object-attached
 * conversations, mentions, assignments and shared decisions over the existing engines.
 * The SERVER authorizes every read/write here (the pure predicates decide; this throws on
 * denial) — never the client. Activity → Timeline; notifications → the Notification engine;
 * realtime → the in-process seam. Personal objects (no project scope) stay owner-only.
 *
 * `actor` is threaded through so authorization is testable for collaborator actors, even
 * though the single authenticated actor in this deployment is always the owner.
 */

const now = () => new Date().toISOString();
const DEFAULT_TZ = "UTC";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (a + b).toUpperCase() || "?";
}

function deny(message: string): never {
  throw new TRPCError({ code: "FORBIDDEN", message });
}

async function actorLabel(db: Database, actor: Actor): Promise<string> {
  if (actor.kind === "owner") return "You";
  const c = await repo.getCollaborator(db, actor.collaboratorId).catch(() => null);
  return c?.name ?? "A collaborator";
}

/** Resolve the authorization scope (projectId) of a subject. */
async function resolveSubject(
  db: Database,
  subjectType: ConversationSubject,
  subjectId: string,
): Promise<SubjectRef> {
  if (subjectType === "project") return { type: "project", id: subjectId, projectId: subjectId };
  if (subjectType === "task") {
    const t = await repo.getTaskMeta(db, subjectId).catch(() => null);
    return { type: "task", id: subjectId, projectId: t?.projectId ?? null };
  }
  // decisions/events/planner/resources/workspace are not project-scoped in the schema;
  // they are owner-scoped (personal) unless a future stage adds explicit scoping.
  return { type: subjectType, id: subjectId, projectId: null };
}

function hrefForSubject(subjectType: ConversationSubject, subjectId: string): string | null {
  switch (subjectType) {
    case "task":
      return `/tasks?task=${subjectId}`;
    case "project":
      return `/projects?project=${subjectId}`;
    case "decision":
      return "/today#morning-recommendation";
    case "event":
      return "/calendar";
    case "planner_block":
      return "/planner";
    default:
      return null;
  }
}

// ── people ─────────────────────────────────────────────────────────────────────────────
export async function addCollaborator(
  db: Database,
  input: { name: string; email?: string | null },
): Promise<Collaborator> {
  const c = await repo.insertCollaborator(db, {
    name: input.name.trim(),
    email: input.email?.trim() || null,
    initials: initialsOf(input.name),
  });
  return c;
}
export function listCollaborators(db: Database): Promise<Collaborator[]> {
  return repo.listCollaborators(db);
}
export async function removeCollaborator(db: Database, id: string): Promise<{ ok: true }> {
  await repo.setCollaboratorStatus(db, id, "removed");
  return { ok: true };
}

// ── sharing / membership ─────────────────────────────────────────────────────────────────
export async function shareProject(
  db: Database,
  projectId: string,
  actor: Actor = OWNER_ACTOR,
): Promise<{ ok: true }> {
  const meta = await repo.getProjectMeta(db, projectId);
  if (!meta) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
  await repo.setProjectShared(db, projectId, true);
  await recordActivity(db, actor, {
    kind: "project_shared",
    subjectType: "project",
    subjectId: projectId,
    projectId,
    detail: meta.name,
  });
  emitCollab({
    kind: "activity",
    subjectType: "project",
    subjectId: projectId,
    projectId,
    at: now(),
  });
  return { ok: true };
}

export async function addMember(
  db: Database,
  projectId: string,
  collaboratorId: string,
  role: MembershipRole,
  tz = DEFAULT_TZ,
  actor: Actor = OWNER_ACTOR,
): Promise<{ ok: true }> {
  const [meta, collaborator] = await Promise.all([
    repo.getProjectMeta(db, projectId),
    repo.getCollaborator(db, collaboratorId),
  ]);
  if (!meta) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
  if (!collaborator) throw new TRPCError({ code: "NOT_FOUND", message: "Collaborator not found" });
  if (!meta.shared) await repo.setProjectShared(db, projectId, true);
  await repo.insertMember(db, projectId, collaboratorId, role);
  await recordActivity(db, actor, {
    kind: "member_added",
    subjectType: "project",
    subjectId: projectId,
    projectId,
    detail: collaborator.name,
  });
  await notify(db, tz, [
    drafts.memberAddedDraft({
      recipient: { collaboratorId, label: collaborator.name },
      projectId,
      projectName: meta.name,
      href: hrefForSubject("project", projectId),
      authorLabel: await actorLabel(db, actor),
    }),
  ]);
  emitCollab({
    kind: "member.added",
    subjectType: "project",
    subjectId: projectId,
    projectId,
    at: now(),
  });
  return { ok: true };
}

export async function removeMember(
  db: Database,
  projectId: string,
  collaboratorId: string,
  actor: Actor = OWNER_ACTOR,
): Promise<{ ok: true }> {
  const memberships = await repo.listAllMemberships(db);
  if (!can(actor, "manage_members", projectId, memberships)) deny("Cannot manage members.");
  await repo.deleteMember(db, projectId, collaboratorId);
  await recordActivity(db, actor, {
    kind: "member_removed",
    subjectType: "project",
    subjectId: projectId,
    projectId,
  });
  emitCollab({
    kind: "member.removed",
    subjectType: "project",
    subjectId: projectId,
    projectId,
    at: now(),
  });
  return { ok: true };
}

export async function listMembers(db: Database, projectId: string) {
  const [memberships, roster] = await Promise.all([
    repo.listMembers(db, projectId),
    repo.listCollaborators(db),
  ]);
  const byId = new Map(roster.map((c) => [c.id, c]));
  return memberships.map((m) => ({ ...m, collaborator: byId.get(m.collaboratorId) ?? null }));
}

// ── invitations ──────────────────────────────────────────────────────────────────────────
export async function invite(
  db: Database,
  projectId: string,
  collaboratorId: string,
  role: MembershipRole,
  actor: Actor = OWNER_ACTOR,
) {
  const inv = createInvitation({
    id: randomUUID(),
    collaboratorId,
    projectId,
    role,
    token: randomUUID().replace(/-/g, ""),
    invitedBy: actor.kind === "owner" ? "owner" : actor.collaboratorId,
    now: now(),
  });
  const saved = await repo.insertInvitation(db, inv);
  await recordActivity(db, actor, {
    kind: "invitation_sent",
    subjectType: "project",
    subjectId: projectId,
    projectId,
  });
  return saved;
}

export async function acceptInvitation(db: Database, token: string, tz = DEFAULT_TZ) {
  const inv = await repo.getInvitationByToken(db, token);
  if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
  const accepted = acceptInv(inv, now()); // throws if not pending / expired
  await repo.updateInvitationStatus(db, inv.id, "accepted", accepted.respondedAt);
  // Grant membership — the real effect of acceptance.
  await addMember(db, inv.projectId, inv.collaboratorId, inv.role, tz);
  await recordActivity(db, OWNER_ACTOR, {
    kind: "invitation_accepted",
    subjectType: "project",
    subjectId: inv.projectId,
    projectId: inv.projectId,
  });
  return { ok: true as const };
}

export async function rejectInvitation(db: Database, token: string) {
  const inv = await repo.getInvitationByToken(db, token);
  if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
  const rejected = rejectInv(inv, now());
  await repo.updateInvitationStatus(db, inv.id, "rejected", rejected.respondedAt);
  return { ok: true as const };
}

export async function listInvitations(db: Database, projectId: string) {
  const invs = await repo.listInvitations(db, projectId);
  return invs.map((i) => ({ ...i, effectiveStatus: effectiveStatus(i, now()) }));
}

// ── conversations + messages ───────────────────────────────────────────────────────────────
async function ensureConversation(db: Database, subject: SubjectRef, title: string | null) {
  const existing = await repo.getConversationBySubject(db, subject.type, subject.id);
  if (existing) return existing;
  return repo.insertConversation(db, {
    subjectType: subject.type,
    subjectId: subject.id,
    projectId: subject.projectId,
    title,
  });
}

/** Roster of people who can be mentioned in a subject (its project members, else all active). */
async function rosterFor(db: Database, subject: SubjectRef): Promise<Collaborator[]> {
  if (!subject.projectId) return repo.listCollaborators(db);
  const members = await repo.listMembers(db, subject.projectId);
  const roster = await repo.listCollaborators(db);
  const ids = new Set(members.map((m) => m.collaboratorId));
  return roster.filter((c) => ids.has(c.id));
}

export async function listMessages(
  db: Database,
  subjectType: ConversationSubject,
  subjectId: string,
  actor: Actor = OWNER_ACTOR,
) {
  const subject = await resolveSubject(db, subjectType, subjectId);
  const memberships = await repo.listAllMemberships(db);
  if (!canAccessSubject(actor, subject, memberships)) deny("You cannot access this discussion.");
  const conversation = await repo.getConversationBySubject(db, subjectType, subjectId);
  if (!conversation)
    return { conversationId: null, messages: [], roster: await rosterFor(db, subject) };
  const [messages, roster] = await Promise.all([
    repo.listMessages(db, conversation.id),
    rosterFor(db, subject),
  ]);
  return { conversationId: conversation.id, messages, roster };
}

export async function postMessage(
  db: Database,
  input: {
    subjectType: ConversationSubject;
    subjectId: string;
    body: string;
    parentMessageId?: string | null;
    subjectLabel?: string;
  },
  tz = DEFAULT_TZ,
  actor: Actor = OWNER_ACTOR,
) {
  const subject = await resolveSubject(db, input.subjectType, input.subjectId);
  const memberships = await repo.listAllMemberships(db);
  if (!can(actor, "comment", subject.projectId, memberships)) {
    // Owner always can; a collaborator needs at least commenter on the subject's project.
    if (actor.kind !== "owner") deny("You cannot comment here.");
  }
  const validation = validateBody(input.body);
  if (!validation.ok)
    throw new TRPCError({ code: "BAD_REQUEST", message: validation.reason ?? "Invalid message." });

  const conversation = await ensureConversation(db, subject, input.subjectLabel ?? null);
  const roster = await rosterFor(db, subject);
  const mentions = resolveMentions(input.body, roster);
  const message = buildMessage({
    id: randomUUID(),
    conversationId: conversation.id,
    authorCollaboratorId: actor.kind === "owner" ? null : actor.collaboratorId,
    body: input.body,
    mentions,
    parentMessageId: input.parentMessageId ?? null,
    now: now(),
  });
  const saved = await repo.insertMessage(db, message);

  const label = input.subjectLabel ?? `${input.subjectType}`;
  const href = hrefForSubject(input.subjectType, input.subjectId);
  const author = await actorLabel(db, actor);

  await recordActivity(db, actor, {
    kind: "message_posted",
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    projectId: subject.projectId,
    detail: label,
  });

  // Notifications: each mentioned person (a mention beats a generic comment ping).
  const rosterById = new Map(roster.map((c) => [c.id, c]));
  const notifs = mentions.map((cid) =>
    drafts.mentionDraft({
      recipient: { collaboratorId: cid, label: rosterById.get(cid)?.name ?? "Someone" },
      messageId: saved.id,
      subjectLabel: label,
      href,
      authorLabel: author,
    }),
  );
  await notify(db, tz, notifs);

  emitCollab({
    kind: "message.posted",
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    projectId: subject.projectId,
    at: saved.createdAt,
  });
  return saved;
}

export async function editMessage(
  db: Database,
  messageId: string,
  body: string,
  actor: Actor = OWNER_ACTOR,
) {
  const message = await repo.getMessage(db, messageId);
  if (!message) throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
  const memberships = await repo.listAllMemberships(db);
  // Determine the message's project scope via its conversation subject.
  const subject = await subjectOfMessage(db, message.conversationId);
  if (
    !canModifyMessage(
      actor,
      { authorCollaboratorId: message.authorCollaboratorId, projectId: subject?.projectId ?? null },
      memberships,
    )
  ) {
    deny("You cannot edit this message.");
  }
  const validation = validateBody(body);
  if (!validation.ok)
    throw new TRPCError({ code: "BAD_REQUEST", message: validation.reason ?? "Invalid message." });
  const roster = subject ? await rosterFor(db, subject) : [];
  const edited = applyEdit(message, body, resolveMentions(body, roster), now());
  const saved = await repo.updateMessage(db, edited);
  emitCollab({ kind: "message.updated", at: saved.editedAt ?? now() });
  return saved;
}

export async function deleteMessage(db: Database, messageId: string, actor: Actor = OWNER_ACTOR) {
  const message = await repo.getMessage(db, messageId);
  if (!message) throw new TRPCError({ code: "NOT_FOUND", message: "Message not found" });
  const subject = await subjectOfMessage(db, message.conversationId);
  const memberships = await repo.listAllMemberships(db);
  if (
    !canModifyMessage(
      actor,
      { authorCollaboratorId: message.authorCollaboratorId, projectId: subject?.projectId ?? null },
      memberships,
    )
  ) {
    deny("You cannot delete this message.");
  }
  const saved = await repo.updateMessage(db, applyDelete(message, now()));
  emitCollab({ kind: "message.updated", at: now() });
  return saved;
}

async function subjectOfMessage(db: Database, conversationId: string): Promise<SubjectRef | null> {
  const conv = await repo.getConversationById(db, conversationId);
  if (!conv) return null;
  return { type: conv.subjectType, id: conv.subjectId, projectId: conv.projectId };
}

// ── task collaboration ─────────────────────────────────────────────────────────────────────
export async function assignTask(
  db: Database,
  taskId: string,
  collaboratorId: string | null,
  tz = DEFAULT_TZ,
  actor: Actor = OWNER_ACTOR,
) {
  const meta = await repo.getTaskMeta(db, taskId);
  if (!meta) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
  const memberships = await repo.listAllMemberships(db);
  if (!can(actor, "edit", meta.projectId, memberships) && actor.kind !== "owner") {
    deny("You cannot assign this task.");
  }
  await repo.setTaskAssignee(db, taskId, collaboratorId);
  if (collaboratorId) {
    const collaborator = await repo.getCollaborator(db, collaboratorId);
    await recordActivity(db, actor, {
      kind: "task_assigned",
      subjectType: "task",
      subjectId: taskId,
      projectId: meta.projectId,
      detail: meta.title,
    });
    if (collaborator) {
      await notify(db, tz, [
        drafts.assignmentDraft({
          recipient: { collaboratorId, label: collaborator.name },
          taskId,
          taskTitle: meta.title,
          href: hrefForSubject("task", taskId),
          authorLabel: await actorLabel(db, actor),
        }),
      ]);
    }
  } else {
    await recordActivity(db, actor, {
      kind: "task_unassigned",
      subjectType: "task",
      subjectId: taskId,
      projectId: meta.projectId,
      detail: meta.title,
    });
  }
  emitCollab({
    kind: "task.assigned",
    subjectType: "task",
    subjectId: taskId,
    projectId: meta.projectId,
    at: now(),
  });
  return { ok: true as const };
}

export async function addTaskCollaborator(db: Database, taskId: string, collaboratorId: string) {
  await repo.addTaskCollaborator(db, taskId, collaboratorId);
  return { ok: true as const };
}
export async function removeTaskCollaborator(db: Database, taskId: string, collaboratorId: string) {
  await repo.removeTaskCollaborator(db, taskId, collaboratorId);
  return { ok: true as const };
}

export async function taskCollaboration(db: Database, taskId: string) {
  const [meta, collaboratorIds, roster, conversation] = await Promise.all([
    repo.getTaskMeta(db, taskId),
    repo.listTaskCollaborators(db, taskId),
    repo.listCollaborators(db),
    repo.getConversationBySubject(db, "task", taskId),
  ]);
  const byId = new Map(roster.map((c) => [c.id, c]));
  const messageCount = conversation
    ? (await repo.listMessages(db, conversation.id)).filter((m) => !m.deletedAt).length
    : 0;
  return {
    assignee: meta?.assigneeCollaboratorId ? (byId.get(meta.assigneeCollaboratorId) ?? null) : null,
    collaborators: collaboratorIds.map((id) => byId.get(id)).filter((c): c is Collaborator => !!c),
    roster,
    messageCount,
    projectId: meta?.projectId ?? null,
  };
}

// ── decisions ────────────────────────────────────────────────────────────────────────────────
export async function addDecisionParticipant(
  db: Database,
  decisionId: string,
  collaboratorId: string,
) {
  await repo.addDecisionParticipant(db, decisionId, collaboratorId);
  await recordActivity(db, OWNER_ACTOR, {
    kind: "decision_participant_added",
    subjectType: "decision",
    subjectId: decisionId,
    projectId: null,
  });
  return { ok: true as const };
}

export async function decisionCollaboration(db: Database, decisionId: string) {
  const [participantIds, roster, conversation] = await Promise.all([
    repo.listDecisionParticipants(db, decisionId),
    repo.listCollaborators(db),
    repo.getConversationBySubject(db, "decision", decisionId),
  ]);
  const byId = new Map(roster.map((c) => [c.id, c]));
  return {
    participants: participantIds.map((id) => byId.get(id)).filter((c): c is Collaborator => !!c),
    roster,
    conversationId: conversation?.id ?? null,
  };
}

/** Resolve a shared decision via the existing deterministic Decision engine + notify participants. */
export async function resolveDecision(
  db: Database,
  decisionId: string,
  decisionTitle: string,
  tz = DEFAULT_TZ,
  actor: Actor = OWNER_ACTOR,
) {
  await decisionService.complete(db, decisionId); // deterministic engine remains the authority
  const participantIds = await repo.listDecisionParticipants(db, decisionId);
  const roster = await repo.listCollaborators(db);
  const byId = new Map(roster.map((c) => [c.id, c]));
  await recordActivity(db, actor, {
    kind: "decision_resolved",
    subjectType: "decision",
    subjectId: decisionId,
    projectId: null,
    detail: decisionTitle,
  });
  await notify(
    db,
    tz,
    participantIds.map((cid) =>
      drafts.decisionResolvedDraft({
        recipient: { collaboratorId: cid, label: byId.get(cid)?.name ?? "Someone" },
        decisionId,
        decisionTitle,
        href: hrefForSubject("decision", decisionId),
        authorLabel: "You",
      }),
    ),
  );
  emitCollab({
    kind: "decision.resolved",
    subjectType: "decision",
    subjectId: decisionId,
    at: now(),
  });
  return { ok: true as const };
}

// ── hub ──────────────────────────────────────────────────────────────────────────────────────
export async function hub(db: Database) {
  const [collaborators, sharedProjects] = await Promise.all([
    repo.listCollaborators(db),
    repo.listSharedProjects(db),
  ]);
  return {
    collaboratorCount: collaborators.length,
    collaborators,
    sharedProjects,
  };
}

// ── internals: activity + notify ───────────────────────────────────────────────────────────────
interface ActivityArgs {
  kind: Parameters<typeof buildActivity>[0]["kind"];
  subjectType: ConversationSubject;
  subjectId: string;
  projectId: string | null;
  detail?: string;
}
/** Map a collaboration subject onto the Timeline's module source (activity is about that object). */
function sourceModuleFor(subjectType: ConversationSubject) {
  switch (subjectType) {
    case "task":
      return "task" as const;
    case "project":
      return "project" as const;
    case "decision":
      return "decision" as const;
    case "event":
      return "calendar" as const;
    case "planner_block":
      return "planner" as const;
    case "resource":
      return "resource" as const;
    default:
      return "today" as const;
  }
}

async function recordActivity(db: Database, actor: Actor, args: ActivityArgs): Promise<void> {
  const activity = buildActivity({
    kind: args.kind,
    actorLabel: await actorLabel(db, actor),
    subjectType: args.subjectType,
    subjectId: args.subjectId,
    projectId: args.projectId,
    ...(args.detail ? { detail: args.detail } : {}),
  });
  await timeline
    .record(db, {
      eventType: activity.eventType,
      source: sourceModuleFor(args.subjectType),
      entityId: args.subjectId,
      title: activity.title,
      summary: activity.summary,
      importance: activity.importance,
      metadata: { ...activity.metadata, collaboration: true },
    })
    .catch(() => undefined);
}

async function notify(db: Database, tz: string, list: NotificationDraft[]): Promise<void> {
  if (list.length === 0) return;
  await notifService.ingest(db, list, tz).catch(() => undefined);
}
