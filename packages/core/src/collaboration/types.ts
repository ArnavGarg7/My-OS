import type {
  CollaboratorStatus,
  ConversationSubject,
  InvitationStatus,
  MembershipRole,
} from "./constants";

/**
 * Collaboration types (Stage 7). A `Collaborator` is a real person record inside the OS.
 * It is NOT a second identity system: `userId` links to an authenticated `auth_users`
 * row when (and only when) multi-user auth exists — null today, in a single-owner
 * deployment. `ownerActor` is the sentinel for "the OS owner" as an actor.
 */

/** A person the owner works with. */
export interface Collaborator {
  id: string;
  name: string;
  email: string | null;
  /** Link to an authenticated user — the multi-user seam. Null in single-owner mode. */
  userId: string | null;
  /** Optional link to a CRM relationship (personal network), never required. */
  relationshipId: string | null;
  /** Two-letter monogram for the avatar (derived, presentational). */
  initials: string;
  status: CollaboratorStatus;
  createdAt: string;
  updatedAt: string;
}

/** An actor performing a collaboration operation. The owner, or a collaborator. */
export type Actor = { kind: "owner" } | { kind: "collaborator"; collaboratorId: string };

/** The owner sentinel actor. */
export const OWNER_ACTOR: Actor = { kind: "owner" };

/** A collaborator's membership in a shared project. */
export interface Membership {
  id: string;
  projectId: string;
  collaboratorId: string;
  role: MembershipRole;
  createdAt: string;
}

/** A polymorphic reference to the OS object a conversation is about. */
export interface SubjectRef {
  type: ConversationSubject;
  id: string;
  /** The project this subject belongs to, for authorization scoping (null = personal/global). */
  projectId: string | null;
}

/** A conversation attached to an OS object. */
export interface Conversation {
  id: string;
  subjectType: ConversationSubject;
  subjectId: string;
  /** Scoping project (authorization boundary); null when attached to a personal object. */
  projectId: string | null;
  title: string | null;
  createdAt: string;
}

/** A single message in a conversation. */
export interface Message {
  id: string;
  conversationId: string;
  /** Null author = the OS owner; otherwise a collaborator id. */
  authorCollaboratorId: string | null;
  body: string;
  /** Collaborator ids mentioned in the body (resolved at post time). */
  mentions: string[];
  /** Reply target within the same conversation, or null for a top-level message. */
  parentMessageId: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
}

/** An invitation to a shared project. */
export interface Invitation {
  id: string;
  collaboratorId: string;
  projectId: string;
  role: MembershipRole;
  status: InvitationStatus;
  token: string;
  /** Actor who invited (owner sentinel or a collaborator id). */
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  respondedAt: string | null;
}

/** A participant in a shared decision. */
export interface DecisionParticipant {
  id: string;
  decisionId: string;
  collaboratorId: string;
  createdAt: string;
}
