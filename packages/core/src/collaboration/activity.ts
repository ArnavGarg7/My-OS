import type { ConversationSubject } from "./constants";

/**
 * Collaboration activity (Stage 7). Pure mapping from a collaboration event to a
 * normalized, attributable activity descriptor the SERVER records into the existing
 * Timeline engine (2.13) — no second activity system. Grounded only: an activity exists
 * because a real operation happened. The server supplies actor + subject labels.
 */

export type CollabActivityKind =
  | "project_shared"
  | "member_added"
  | "member_removed"
  | "role_changed"
  | "invitation_sent"
  | "invitation_accepted"
  | "task_assigned"
  | "task_unassigned"
  | "collaborator_added"
  | "message_posted"
  | "decision_participant_added"
  | "decision_resolved";

export interface CollabActivityInput {
  kind: CollabActivityKind;
  /** Who performed it (display label, e.g. "You" or a collaborator name). */
  actorLabel: string;
  subjectType: ConversationSubject;
  subjectId: string;
  /** Scoping project (for a project-scoped activity feed), or null. */
  projectId: string | null;
  /** Short human detail, e.g. a task title or member name. */
  detail?: string;
}

export interface CollabActivity {
  eventType: string;
  title: string;
  summary: string;
  importance: number; // 0..1
  metadata: Record<string, unknown>;
}

const IMPORTANCE: Record<CollabActivityKind, number> = {
  project_shared: 0.6,
  member_added: 0.5,
  member_removed: 0.5,
  role_changed: 0.3,
  invitation_sent: 0.3,
  invitation_accepted: 0.5,
  task_assigned: 0.6,
  task_unassigned: 0.3,
  collaborator_added: 0.3,
  message_posted: 0.2,
  decision_participant_added: 0.3,
  decision_resolved: 0.8,
};

const PHRASE: Record<CollabActivityKind, string> = {
  project_shared: "shared the project",
  member_added: "added a member",
  member_removed: "removed a member",
  role_changed: "changed a member's role",
  invitation_sent: "invited someone",
  invitation_accepted: "joined",
  task_assigned: "assigned a task",
  task_unassigned: "unassigned a task",
  collaborator_added: "added a collaborator",
  message_posted: "commented",
  decision_participant_added: "added a decision participant",
  decision_resolved: "resolved a decision",
};

export function buildActivity(input: CollabActivityInput): CollabActivity {
  const phrase = PHRASE[input.kind];
  const detail = input.detail ? ` — ${input.detail}` : "";
  return {
    eventType: `collaboration.${input.kind}`,
    title: `${input.actorLabel} ${phrase}`,
    summary: `${input.actorLabel} ${phrase}${detail}`,
    importance: IMPORTANCE[input.kind],
    metadata: {
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      ...(input.projectId ? { projectId: input.projectId } : {}),
      kind: input.kind,
    },
  };
}
