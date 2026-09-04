/**
 * Collaboration schema (Stage 7). "My OS with other people." People (collaborators),
 * shared-project membership, object-attached conversations + messages, invitations, task
 * collaboration and shared-decision participants. Reuses the existing Notification,
 * Timeline and Decision engines — no second identity, activity or notification system.
 *
 * Privacy by construction: sharing is opt-in. A conversation/message carries the scoping
 * `project_id`; a null scope means a personal object (owner-only). `collaborators.user_id`
 * is the multi-user seam — null in the single-owner deployment, linkable to auth_users
 * when a real second-user auth layer exists.
 */
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const membershipRole = pgEnum("membership_role", ["viewer", "commenter", "editor", "admin"]);

export const collaboratorStatus = pgEnum("collaborator_status", ["invited", "active", "removed"]);

export const invitationStatus = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "rejected",
  "expired",
  "revoked",
]);

export const conversationSubject = pgEnum("conversation_subject", [
  "task",
  "project",
  "decision",
  "event",
  "planner_block",
  "resource",
  "workspace",
]);

/** A person the owner works with. NOT an authenticated identity (single-owner today). */
export const collaborators = pgTable(
  "collaborators",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email"),
    /** Multi-user seam: links to auth_users when a second-user auth layer exists. */
    userId: uuid("user_id"),
    /** Optional link to a CRM relationship (personal network), never required. */
    relationshipId: uuid("relationship_id"),
    initials: text("initials").notNull().default(""),
    status: collaboratorStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({ byStatus: index("collaborators_status_idx").on(t.status) }),
);

/** Membership of a collaborator in a shared project — the sharing boundary. */
export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id").notNull(),
    collaboratorId: uuid("collaborator_id")
      .notNull()
      .references(() => collaborators.id, { onDelete: "cascade" }),
    role: membershipRole("role").notNull().default("commenter"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byProject: index("project_members_project_idx").on(t.projectId),
    uniqueMember: uniqueIndex("project_members_unique").on(t.projectId, t.collaboratorId),
  }),
);

/** A conversation attached to an OS object (polymorphic subject). */
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subjectType: conversationSubject("subject_type").notNull(),
    subjectId: uuid("subject_id").notNull(),
    /** Authorization scope; null = personal object (owner-only). */
    projectId: uuid("project_id"),
    title: text("title"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    bySubject: uniqueIndex("conversations_subject_unique").on(t.subjectType, t.subjectId),
    byProject: index("conversations_project_idx").on(t.projectId),
  }),
);

/** A durable message. Null author = the OS owner. Mentions are resolved collaborator ids. */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    authorCollaboratorId: uuid("author_collaborator_id"),
    body: text("body").notNull().default(""),
    mentions: jsonb("mentions").$type<string[]>().notNull().default([]),
    parentMessageId: uuid("parent_message_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({ byConversation: index("messages_conversation_idx").on(t.conversationId, t.createdAt) }),
);

/** An invitation to a shared project. Nobody is added without an explicit acceptance. */
export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collaboratorId: uuid("collaborator_id")
      .notNull()
      .references(() => collaborators.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull(),
    role: membershipRole("role").notNull().default("commenter"),
    status: invitationStatus("status").notNull().default("pending"),
    token: text("token").notNull(),
    invitedBy: text("invited_by").notNull().default("owner"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (t) => ({
    byProject: index("invitations_project_idx").on(t.projectId),
    byToken: uniqueIndex("invitations_token_unique").on(t.token),
  }),
);

/** Watchers/collaborators on a task (the assignee lives on tasks.assignee_collaborator_id). */
export const taskCollaborators = pgTable(
  "task_collaborators",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id").notNull(),
    collaboratorId: uuid("collaborator_id")
      .notNull()
      .references(() => collaborators.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byTask: index("task_collaborators_task_idx").on(t.taskId),
    uniqueTaskMember: uniqueIndex("task_collaborators_unique").on(t.taskId, t.collaboratorId),
  }),
);

/** Participants in a shared decision (discussion attaches via a conversation). */
export const decisionParticipants = pgTable(
  "decision_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    decisionId: uuid("decision_id").notNull(),
    collaboratorId: uuid("collaborator_id")
      .notNull()
      .references(() => collaborators.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byDecision: index("decision_participants_decision_idx").on(t.decisionId),
    uniqueParticipant: uniqueIndex("decision_participants_unique").on(
      t.decisionId,
      t.collaboratorId,
    ),
  }),
);

export type CollaboratorRow = typeof collaborators.$inferSelect;
export type ProjectMemberRow = typeof projectMembers.$inferSelect;
export type ConversationRow = typeof conversations.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;
export type InvitationRow = typeof invitations.$inferSelect;
export type TaskCollaboratorRow = typeof taskCollaborators.$inferSelect;
export type DecisionParticipantRow = typeof decisionParticipants.$inferSelect;
