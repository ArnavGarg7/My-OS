import { describe, expect, it } from "vitest";
import {
  OWNER_ACTOR,
  canAccessProject,
  canAccessSubject,
  canModifyMessage,
  capabilitiesFor,
  can,
  roleAtLeast,
  resolveMentions,
  handleFor,
  validateBody,
  buildMessage,
  applyEdit,
  applyDelete,
  createInvitation,
  acceptInvitation,
  rejectInvitation,
  effectiveStatus,
  buildActivity,
  type Actor,
  type Collaborator,
  type Membership,
  type SubjectRef,
} from "./index";

/**
 * Collaboration domain (Stage 7). Deterministic authorization + communication. The
 * privacy invariant is a first-class concern: a collaborator can only ever reach objects
 * inside a project they are a member of; personal objects (no project) are owner-only.
 */

const now = "2026-09-04T12:00:00.000Z";
const rahul: Collaborator = {
  id: "c-rahul",
  name: "Rahul Verma",
  email: "rahul@example.com",
  userId: null,
  relationshipId: null,
  initials: "RV",
  status: "active",
  createdAt: now,
  updatedAt: now,
};
const priya: Collaborator = { ...rahul, id: "c-priya", name: "Priya Nair", initials: "PN" };
const rahulActor: Actor = { kind: "collaborator", collaboratorId: "c-rahul" };
const priyaActor: Actor = { kind: "collaborator", collaboratorId: "c-priya" };
const memberships: Membership[] = [
  { id: "m1", projectId: "proj-shared", collaboratorId: "c-rahul", role: "editor", createdAt: now },
  {
    id: "m2",
    projectId: "proj-shared",
    collaboratorId: "c-priya",
    role: "commenter",
    createdAt: now,
  },
];

describe("authorization — owner owns everything", () => {
  it("grants the owner every capability, everywhere", () => {
    expect(can(OWNER_ACTOR, "manage_members", "any", [])).toBe(true);
    expect(canAccessProject(OWNER_ACTOR, "any", [])).toBe(true);
    expect(capabilitiesFor(OWNER_ACTOR, null, []).length).toBeGreaterThan(0);
  });
});

describe("authorization — collaborator powers come only from membership", () => {
  it("grants access to a project the collaborator is a member of", () => {
    expect(canAccessProject(rahulActor, "proj-shared", memberships)).toBe(true);
  });
  it("denies access to a project the collaborator is NOT a member of", () => {
    expect(canAccessProject(rahulActor, "proj-other", memberships)).toBe(false);
  });
  it("maps roles to capabilities (editor can edit, commenter cannot)", () => {
    expect(can(rahulActor, "edit", "proj-shared", memberships)).toBe(true);
    expect(can(priyaActor, "comment", "proj-shared", memberships)).toBe(true);
    expect(can(priyaActor, "edit", "proj-shared", memberships)).toBe(false);
    expect(can(priyaActor, "manage_members", "proj-shared", memberships)).toBe(false);
  });
  it("roleAtLeast orders roles", () => {
    expect(roleAtLeast("editor", "commenter")).toBe(true);
    expect(roleAtLeast("viewer", "editor")).toBe(false);
  });
});

describe("PRIVACY — personal objects are owner-only (the mandatory boundary)", () => {
  const personalTask: SubjectRef = { type: "task", id: "t-private", projectId: null };
  const sharedTask: SubjectRef = { type: "task", id: "t-shared", projectId: "proj-shared" };

  it("a collaborator can NEVER read a personal (project-less) object", () => {
    expect(canAccessSubject(rahulActor, personalTask, memberships)).toBe(false);
  });
  it("the owner can read the personal object", () => {
    expect(canAccessSubject(OWNER_ACTOR, personalTask, memberships)).toBe(true);
  });
  it("a member can read a shared object in their project", () => {
    expect(canAccessSubject(rahulActor, sharedTask, memberships)).toBe(true);
  });
  it("a non-member cannot read a shared object in a project they aren't in", () => {
    const stranger: Actor = { kind: "collaborator", collaboratorId: "c-stranger" };
    expect(canAccessSubject(stranger, sharedTask, memberships)).toBe(false);
  });
});

describe("message modification — author or admin only", () => {
  it("lets the author edit their own message", () => {
    expect(
      canModifyMessage(
        rahulActor,
        { authorCollaboratorId: "c-rahul", projectId: "proj-shared" },
        memberships,
      ),
    ).toBe(true);
  });
  it("stops a commenter from deleting someone else's message", () => {
    expect(
      canModifyMessage(
        priyaActor,
        { authorCollaboratorId: "c-rahul", projectId: "proj-shared" },
        memberships,
      ),
    ).toBe(false);
  });
  it("lets an admin delete another author's message", () => {
    const admin: Membership[] = [
      {
        id: "m3",
        projectId: "proj-shared",
        collaboratorId: "c-admin",
        role: "admin",
        createdAt: now,
      },
    ];
    expect(
      canModifyMessage(
        { kind: "collaborator", collaboratorId: "c-admin" },
        { authorCollaboratorId: "c-rahul", projectId: "proj-shared" },
        admin,
      ),
    ).toBe(true);
  });
  it("lets the owner modify their own (null-author) message", () => {
    expect(canModifyMessage(OWNER_ACTOR, { authorCollaboratorId: null, projectId: null }, [])).toBe(
      true,
    );
  });
});

describe("mentions — resolved against the roster only", () => {
  it("resolves @handles to collaborator ids", () => {
    expect(resolveMentions("hey @rahul can you review with @priya?", [rahul, priya])).toEqual([
      "c-rahul",
      "c-priya",
    ]);
  });
  it("ignores handles not in the roster (no leaking outside the context)", () => {
    expect(resolveMentions("@rahul and @stranger", [rahul])).toEqual(["c-rahul"]);
  });
  it("ignores emails (no false @ mention)", () => {
    expect(resolveMentions("mail me at rahul@example.com", [rahul])).toEqual([]);
  });
  it("derives a handle from the first name", () => {
    expect(handleFor(rahul)).toBe("rahul");
  });
});

describe("message lifecycle", () => {
  it("validates body length", () => {
    expect(validateBody("  ").ok).toBe(false);
    expect(validateBody("hello").ok).toBe(true);
  });
  it("builds, edits and soft-deletes deterministically", () => {
    const m = buildMessage({
      id: "msg1",
      conversationId: "conv1",
      authorCollaboratorId: null,
      body: "  original  ",
      mentions: [],
      parentMessageId: null,
      now,
    });
    expect(m.body).toBe("original");
    const edited = applyEdit(m, "updated", ["c-rahul"], "2026-09-04T13:00:00.000Z");
    expect(edited.editedAt).toBe("2026-09-04T13:00:00.000Z");
    expect(edited.mentions).toEqual(["c-rahul"]);
    const deleted = applyDelete(edited, "2026-09-04T14:00:00.000Z");
    expect(deleted.deletedAt).not.toBeNull();
    expect(deleted.body).toBe("");
  });
});

describe("invitations — explicit acceptance, expiry, no illegal transitions", () => {
  const inv = createInvitation({
    id: "inv1",
    collaboratorId: "c-rahul",
    projectId: "proj-shared",
    role: "editor",
    token: "tok",
    invitedBy: "owner",
    now,
  });
  it("starts pending with an expiry", () => {
    expect(inv.status).toBe("pending");
    expect(Date.parse(inv.expiresAt)).toBeGreaterThan(Date.parse(now));
  });
  it("accepts a pending invitation", () => {
    const a = acceptInvitation(inv, "2026-09-05T00:00:00.000Z");
    expect(a.status).toBe("accepted");
    expect(a.respondedAt).not.toBeNull();
  });
  it("reports expiry deterministically", () => {
    expect(effectiveStatus(inv, "2026-10-01T00:00:00.000Z")).toBe("expired");
  });
  it("throws on accepting an expired invitation", () => {
    expect(() => acceptInvitation(inv, "2026-10-01T00:00:00.000Z")).toThrow();
  });
  it("throws on rejecting an already-accepted invitation", () => {
    const a = acceptInvitation(inv, "2026-09-05T00:00:00.000Z");
    expect(() => rejectInvitation(a, "2026-09-06T00:00:00.000Z")).toThrow();
  });
});

describe("activity — attributable, grounded descriptors", () => {
  it("builds a timeline-ready activity for a resolved decision", () => {
    const a = buildActivity({
      kind: "decision_resolved",
      actorLabel: "You",
      subjectType: "decision",
      subjectId: "d1",
      projectId: "proj-shared",
      detail: "Which architecture?",
    });
    expect(a.eventType).toBe("collaboration.decision_resolved");
    expect(a.title).toContain("resolved a decision");
    expect(a.summary).toContain("Which architecture?");
    expect(a.metadata.projectId).toBe("proj-shared");
    expect(a.importance).toBeGreaterThan(0);
  });
});
