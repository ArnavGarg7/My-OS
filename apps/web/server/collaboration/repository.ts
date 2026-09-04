import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  collaborators,
  conversations,
  decisionParticipants,
  invitations,
  messages,
  projectMembers,
  projects,
  tasks,
  taskCollaborators,
  type CollaboratorRow,
  type ConversationRow,
  type InvitationRow,
  type MessageRow,
  type ProjectMemberRow,
} from "@myos/db/schema";
import type {
  Collaborator,
  Conversation,
  ConversationSubject,
  Invitation,
  InvitationStatus,
  Membership,
  MembershipRole,
  Message,
} from "@myos/core/collaboration";

/** Collaboration persistence (Stage 7). Pure DB access — no authorization here (the service
 * authorizes before calling), no business logic. Rows map to the pure domain types. */

// ── mappers ──────────────────────────────────────────────────────────────────────────
export function toCollaborator(r: CollaboratorRow): Collaborator {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    userId: r.userId,
    relationshipId: r.relationshipId,
    initials: r.initials,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
function toMembership(r: ProjectMemberRow): Membership {
  return {
    id: r.id,
    projectId: r.projectId,
    collaboratorId: r.collaboratorId,
    role: r.role,
    createdAt: r.createdAt.toISOString(),
  };
}
function toConversation(r: ConversationRow): Conversation {
  return {
    id: r.id,
    subjectType: r.subjectType,
    subjectId: r.subjectId,
    projectId: r.projectId,
    title: r.title,
    createdAt: r.createdAt.toISOString(),
  };
}
function toMessage(r: MessageRow): Message {
  return {
    id: r.id,
    conversationId: r.conversationId,
    authorCollaboratorId: r.authorCollaboratorId,
    body: r.body,
    mentions: r.mentions,
    parentMessageId: r.parentMessageId,
    createdAt: r.createdAt.toISOString(),
    editedAt: r.editedAt?.toISOString() ?? null,
    deletedAt: r.deletedAt?.toISOString() ?? null,
  };
}
function toInvitation(r: InvitationRow): Invitation {
  return {
    id: r.id,
    collaboratorId: r.collaboratorId,
    projectId: r.projectId,
    role: r.role,
    status: r.status,
    token: r.token,
    invitedBy: r.invitedBy,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
    respondedAt: r.respondedAt?.toISOString() ?? null,
  };
}

// ── collaborators ────────────────────────────────────────────────────────────────────
export async function insertCollaborator(
  db: Database,
  input: { name: string; email: string | null; initials: string },
): Promise<Collaborator> {
  const [row] = await db.insert(collaborators).values(input).returning();
  return toCollaborator(row!);
}
export async function listCollaborators(db: Database): Promise<Collaborator[]> {
  const rows = await db
    .select()
    .from(collaborators)
    .where(eq(collaborators.status, "active"))
    .orderBy(asc(collaborators.name));
  return rows.map(toCollaborator);
}
export async function getCollaborator(db: Database, id: string): Promise<Collaborator | null> {
  const [row] = await db.select().from(collaborators).where(eq(collaborators.id, id)).limit(1);
  return row ? toCollaborator(row) : null;
}
export async function setCollaboratorStatus(
  db: Database,
  id: string,
  status: Collaborator["status"],
): Promise<void> {
  await db
    .update(collaborators)
    .set({ status, updatedAt: new Date() })
    .where(eq(collaborators.id, id));
}

// ── memberships ──────────────────────────────────────────────────────────────────────
export async function insertMember(
  db: Database,
  projectId: string,
  collaboratorId: string,
  role: MembershipRole,
): Promise<Membership> {
  const [row] = await db
    .insert(projectMembers)
    .values({ projectId, collaboratorId, role })
    .onConflictDoUpdate({
      target: [projectMembers.projectId, projectMembers.collaboratorId],
      set: { role },
    })
    .returning();
  return toMembership(row!);
}
export async function listMembers(db: Database, projectId: string): Promise<Membership[]> {
  const rows = await db
    .select()
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));
  return rows.map(toMembership);
}
/** All memberships — the authorization set (small in single-owner deployments). */
export async function listAllMemberships(db: Database): Promise<Membership[]> {
  const rows = await db.select().from(projectMembers);
  return rows.map(toMembership);
}
export async function deleteMember(
  db: Database,
  projectId: string,
  collaboratorId: string,
): Promise<void> {
  await db
    .delete(projectMembers)
    .where(
      and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.collaboratorId, collaboratorId),
      ),
    );
}

// ── projects (share flag + name for activity) ──────────────────────────────────────────
export async function setProjectShared(
  db: Database,
  projectId: string,
  shared: boolean,
): Promise<void> {
  await db
    .update(projects)
    .set({ shared, updatedAt: new Date() })
    .where(eq(projects.id, projectId));
}
export async function getProjectMeta(
  db: Database,
  projectId: string,
): Promise<{ id: string; name: string; shared: boolean } | null> {
  const [row] = await db
    .select({ id: projects.id, name: projects.name, shared: projects.shared })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  return row ?? null;
}
export async function listSharedProjects(db: Database): Promise<{ id: string; name: string }[]> {
  return db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(eq(projects.shared, true))
    .orderBy(asc(projects.name));
}

// ── conversations + messages ───────────────────────────────────────────────────────────
export async function getConversationBySubject(
  db: Database,
  subjectType: ConversationSubject,
  subjectId: string,
): Promise<Conversation | null> {
  const [row] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.subjectType, subjectType), eq(conversations.subjectId, subjectId)))
    .limit(1);
  return row ? toConversation(row) : null;
}
export async function getConversationById(db: Database, id: string): Promise<Conversation | null> {
  const [row] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return row ? toConversation(row) : null;
}
export async function insertConversation(
  db: Database,
  input: {
    subjectType: ConversationSubject;
    subjectId: string;
    projectId: string | null;
    title: string | null;
  },
): Promise<Conversation> {
  const [row] = await db.insert(conversations).values(input).returning();
  return toConversation(row!);
}
export async function insertMessage(db: Database, m: Message): Promise<Message> {
  const [row] = await db
    .insert(messages)
    .values({
      id: m.id,
      conversationId: m.conversationId,
      authorCollaboratorId: m.authorCollaboratorId,
      body: m.body,
      mentions: m.mentions,
      parentMessageId: m.parentMessageId,
      createdAt: new Date(m.createdAt),
    })
    .returning();
  return toMessage(row!);
}
export async function listMessages(db: Database, conversationId: string): Promise<Message[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));
  return rows.map(toMessage);
}
export async function getMessage(db: Database, id: string): Promise<Message | null> {
  const [row] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return row ? toMessage(row) : null;
}
export async function updateMessage(db: Database, m: Message): Promise<Message> {
  const [row] = await db
    .update(messages)
    .set({
      body: m.body,
      mentions: m.mentions,
      editedAt: m.editedAt ? new Date(m.editedAt) : null,
      deletedAt: m.deletedAt ? new Date(m.deletedAt) : null,
    })
    .where(eq(messages.id, m.id))
    .returning();
  return toMessage(row!);
}

// ── invitations ────────────────────────────────────────────────────────────────────────
export async function insertInvitation(db: Database, inv: Invitation): Promise<Invitation> {
  const [row] = await db
    .insert(invitations)
    .values({
      id: inv.id,
      collaboratorId: inv.collaboratorId,
      projectId: inv.projectId,
      role: inv.role,
      status: inv.status,
      token: inv.token,
      invitedBy: inv.invitedBy,
      createdAt: new Date(inv.createdAt),
      expiresAt: new Date(inv.expiresAt),
    })
    .returning();
  return toInvitation(row!);
}
export async function getInvitationByToken(
  db: Database,
  token: string,
): Promise<Invitation | null> {
  const [row] = await db.select().from(invitations).where(eq(invitations.token, token)).limit(1);
  return row ? toInvitation(row) : null;
}
export async function updateInvitationStatus(
  db: Database,
  id: string,
  status: InvitationStatus,
  respondedAt: string | null,
): Promise<void> {
  await db
    .update(invitations)
    .set({ status, respondedAt: respondedAt ? new Date(respondedAt) : null })
    .where(eq(invitations.id, id));
}
export async function listInvitations(db: Database, projectId: string): Promise<Invitation[]> {
  const rows = await db
    .select()
    .from(invitations)
    .where(eq(invitations.projectId, projectId))
    .orderBy(desc(invitations.createdAt));
  return rows.map(toInvitation);
}

// ── task collaboration ─────────────────────────────────────────────────────────────────
export async function setTaskAssignee(
  db: Database,
  taskId: string,
  collaboratorId: string | null,
): Promise<void> {
  await db
    .update(tasks)
    .set({ assigneeCollaboratorId: collaboratorId, updatedAt: new Date() })
    .where(eq(tasks.id, taskId));
}
export async function getTaskMeta(
  db: Database,
  taskId: string,
): Promise<{
  id: string;
  title: string;
  projectId: string | null;
  assigneeCollaboratorId: string | null;
} | null> {
  const [row] = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      projectId: tasks.projectId,
      assigneeCollaboratorId: tasks.assigneeCollaboratorId,
    })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);
  return row ?? null;
}
export async function addTaskCollaborator(
  db: Database,
  taskId: string,
  collaboratorId: string,
): Promise<void> {
  await db.insert(taskCollaborators).values({ taskId, collaboratorId }).onConflictDoNothing();
}
export async function removeTaskCollaborator(
  db: Database,
  taskId: string,
  collaboratorId: string,
): Promise<void> {
  await db
    .delete(taskCollaborators)
    .where(
      and(
        eq(taskCollaborators.taskId, taskId),
        eq(taskCollaborators.collaboratorId, collaboratorId),
      ),
    );
}
export async function listTaskCollaborators(db: Database, taskId: string): Promise<string[]> {
  const rows = await db
    .select({ id: taskCollaborators.collaboratorId })
    .from(taskCollaborators)
    .where(eq(taskCollaborators.taskId, taskId));
  return rows.map((r) => r.id);
}

// ── decision participants ────────────────────────────────────────────────────────────────
export async function addDecisionParticipant(
  db: Database,
  decisionId: string,
  collaboratorId: string,
): Promise<void> {
  await db
    .insert(decisionParticipants)
    .values({ decisionId, collaboratorId })
    .onConflictDoNothing();
}
export async function listDecisionParticipants(
  db: Database,
  decisionId: string,
): Promise<string[]> {
  const rows = await db
    .select({ id: decisionParticipants.collaboratorId })
    .from(decisionParticipants)
    .where(eq(decisionParticipants.decisionId, decisionId));
  return rows.map((r) => r.id);
}
