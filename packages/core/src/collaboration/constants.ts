/**
 * Collaboration constants (Stage 7). Deterministic authorization + communication rules
 * for "My OS with other people". Single source of truth for roles, the permission matrix,
 * mention syntax and message limits. No AI, no randomness, no IO.
 *
 * Membership roles are intentionally distinct from the auth `user_role` ("owner" only):
 * that governs who is the OS owner; THESE govern what a collaborator may do inside a
 * shared context. A collaborator is a real person record, linkable to an authenticated
 * user later (the multi-user seam) without changing this model.
 */

/** Access roles within a shared context (project). Ordered least → most capable. */
export const MEMBERSHIP_ROLES = ["viewer", "commenter", "editor", "admin"] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

/** Numeric rank for role comparisons (higher = more capable). */
export const ROLE_RANK: Record<MembershipRole, number> = {
  viewer: 1,
  commenter: 2,
  editor: 3,
  admin: 4,
};

/** The capabilities a role grants inside a shared context. */
export type Capability =
  | "read" // see the shared object + its discussion + activity
  | "comment" // post messages / comments
  | "edit" // change shared object state (status, priority, due date, assignment)
  | "resolve" // resolve a shared decision
  | "manage_members" // add/remove members, change roles, delete the share
  | "delete_others"; // delete another author's message

/** Deterministic capability matrix — the ONLY place a role's powers are defined. */
export const ROLE_CAPABILITIES: Record<MembershipRole, readonly Capability[]> = {
  viewer: ["read"],
  commenter: ["read", "comment"],
  editor: ["read", "comment", "edit", "resolve"],
  admin: ["read", "comment", "edit", "resolve", "manage_members", "delete_others"],
};

/** Invitation lifecycle. */
export const INVITATION_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "expired",
  "revoked",
] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

/** Default invitation validity (days) before it expires unaccepted. */
export const INVITATION_TTL_DAYS = 14;

/** Object kinds a conversation can attach to (polymorphic subject). */
export const CONVERSATION_SUBJECTS = [
  "task",
  "project",
  "decision",
  "event",
  "planner_block",
  "resource",
  "workspace",
] as const;
export type ConversationSubject = (typeof CONVERSATION_SUBJECTS)[number];

/** A mention is `@` followed by a handle (letters, digits, _-.). Case-insensitive match. */
export const MENTION_PATTERN = /(^|[^\w@])@([a-z0-9._-]{1,40})/gi;

/** Message body limits. */
export const MESSAGE_MAX_LENGTH = 8000;
export const MESSAGE_MIN_LENGTH = 1;

/** Collaborator lifecycle. */
export const COLLABORATOR_STATUSES = ["invited", "active", "removed"] as const;
export type CollaboratorStatus = (typeof COLLABORATOR_STATUSES)[number];
