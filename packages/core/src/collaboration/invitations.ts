import { INVITATION_TTL_DAYS, type InvitationStatus, type MembershipRole } from "./constants";
import type { Invitation } from "./types";

/**
 * Invitation state machine (Stage 7). Pure + deterministic. Nobody is ever silently added
 * to a shared context — an invitation must be created and then explicitly accepted, and it
 * expires. Illegal transitions throw, so the server can rely on the shape.
 *
 * NOTE (single-owner deployment): acceptance is a real state transition on a real row, but
 * a second *authenticated* user cannot accept in this environment. The seam is honest —
 * `accept` produces the accepted invitation + the membership to grant; wiring it to a
 * second login is a future multi-user concern.
 */

export interface NewInvitationInput {
  id: string;
  collaboratorId: string;
  projectId: string;
  role: MembershipRole;
  token: string;
  invitedBy: string;
  now: string;
  ttlDays?: number;
}

export function createInvitation(input: NewInvitationInput): Invitation {
  const created = new Date(input.now);
  const expires = new Date(created.getTime() + (input.ttlDays ?? INVITATION_TTL_DAYS) * 86_400_000);
  return {
    id: input.id,
    collaboratorId: input.collaboratorId,
    projectId: input.projectId,
    role: input.role,
    status: "pending",
    token: input.token,
    invitedBy: input.invitedBy,
    createdAt: input.now,
    expiresAt: expires.toISOString(),
    respondedAt: null,
  };
}

export function isExpired(invitation: Invitation, now: string): boolean {
  return Date.parse(invitation.expiresAt) <= Date.parse(now);
}

/** The effective status accounting for expiry (a pending-but-past invitation is expired). */
export function effectiveStatus(invitation: Invitation, now: string): InvitationStatus {
  if (invitation.status === "pending" && isExpired(invitation, now)) return "expired";
  return invitation.status;
}

function transition(
  invitation: Invitation,
  to: Extract<InvitationStatus, "accepted" | "rejected" | "revoked">,
  now: string,
): Invitation {
  const eff = effectiveStatus(invitation, now);
  if (eff !== "pending") {
    throw new Error(`Cannot ${to} an invitation that is ${eff}.`);
  }
  return { ...invitation, status: to, respondedAt: now };
}

export function acceptInvitation(invitation: Invitation, now: string): Invitation {
  return transition(invitation, "accepted", now);
}

export function rejectInvitation(invitation: Invitation, now: string): Invitation {
  return transition(invitation, "rejected", now);
}

export function revokeInvitation(invitation: Invitation, now: string): Invitation {
  return transition(invitation, "revoked", now);
}
