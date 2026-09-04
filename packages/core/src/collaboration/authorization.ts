import { ROLE_CAPABILITIES, ROLE_RANK, type Capability, type MembershipRole } from "./constants";
import type { Actor, Membership, SubjectRef } from "./types";

/**
 * Authorization (Stage 7). PURE, deterministic predicates — the single definition of who
 * may do what in a shared context. The SERVER calls these before every read/write and
 * throws on denial; the client never decides access. Two invariants:
 *
 *  1. The OWNER owns everything — full capabilities everywhere (single-owner deployment).
 *  2. A PERSONAL object (subject with no projectId) is private: only the owner. A shared
 *     object (subject in a project) is visible only to that project's members, and their
 *     powers come solely from their membership role. This is why personal tasks, journal,
 *     health and personal intelligence — none of which live in a project — can never be
 *     reached by a collaborator: there is no membership that grants it.
 */

/** True when `role` is at least as capable as `min`. */
export function roleAtLeast(role: MembershipRole, min: MembershipRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

/** The membership a collaborator holds in a project, if any. */
export function membershipFor(
  actor: Actor,
  projectId: string | null,
  memberships: readonly Membership[],
): Membership | null {
  if (actor.kind !== "collaborator" || !projectId) return null;
  return (
    memberships.find(
      (m) => m.collaboratorId === actor.collaboratorId && m.projectId === projectId,
    ) ?? null
  );
}

/** The capabilities an actor has for a given project. */
export function capabilitiesFor(
  actor: Actor,
  projectId: string | null,
  memberships: readonly Membership[],
): readonly Capability[] {
  if (actor.kind === "owner") return ROLE_CAPABILITIES.admin; // owner ⊇ admin everywhere
  const m = membershipFor(actor, projectId, memberships);
  return m ? ROLE_CAPABILITIES[m.role] : [];
}

/** Does the actor have a capability in a project? */
export function can(
  actor: Actor,
  capability: Capability,
  projectId: string | null,
  memberships: readonly Membership[],
): boolean {
  return capabilitiesFor(actor, projectId, memberships).includes(capability);
}

/** Can the actor access (read) a shared project at all? */
export function canAccessProject(
  actor: Actor,
  projectId: string,
  memberships: readonly Membership[],
): boolean {
  return can(actor, "read", projectId, memberships);
}

/**
 * Can the actor read a conversation subject? Personal subjects (no projectId) are
 * owner-only; project subjects require membership. This is the privacy gate.
 */
export function canAccessSubject(
  actor: Actor,
  subject: SubjectRef,
  memberships: readonly Membership[],
): boolean {
  if (actor.kind === "owner") return true;
  if (subject.projectId === null) return false; // personal object → collaborators denied
  return canAccessProject(actor, subject.projectId, memberships);
}

/** Author-or-admin rule for editing/deleting a message. */
export function canModifyMessage(
  actor: Actor,
  message: { authorCollaboratorId: string | null; projectId: string | null },
  memberships: readonly Membership[],
): boolean {
  const isAuthor =
    (actor.kind === "owner" && message.authorCollaboratorId === null) ||
    (actor.kind === "collaborator" && message.authorCollaboratorId === actor.collaboratorId);
  if (isAuthor) return true;
  return can(actor, "delete_others", message.projectId, memberships);
}
