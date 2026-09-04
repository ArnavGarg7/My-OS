import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Database } from "@myos/db";
import type { Actor, Membership } from "@myos/core/collaboration";

/**
 * Collaboration server authorization + PRIVACY (Stage 7). The pure predicates are proven
 * in the core suite; here we prove the SERVICE enforces them — it throws FORBIDDEN for an
 * unauthorized collaborator and never lets a collaborator reach a personal (project-less)
 * object. This is the mandatory privacy boundary: personal tasks/journal/health/etc. carry
 * no project, so no membership can ever grant access.
 */

vi.mock("server-only", () => ({}));

const state: { taskProjectId: string | null; memberships: Membership[] } = {
  taskProjectId: null,
  memberships: [],
};

vi.mock("./repository", () => ({
  getTaskMeta: vi.fn(async () => ({
    id: "t1",
    title: "T",
    projectId: state.taskProjectId,
    assigneeCollaboratorId: null,
  })),
  getProjectMeta: vi.fn(async () => ({ id: "p1", name: "P", shared: true })),
  listAllMemberships: vi.fn(async () => state.memberships),
  listMembers: vi.fn(async () =>
    state.memberships.map((m) => ({ collaboratorId: m.collaboratorId })),
  ),
  listCollaborators: vi.fn(async () => [
    {
      id: "c-rahul",
      name: "Rahul",
      email: null,
      userId: null,
      relationshipId: null,
      initials: "R",
      status: "active",
      createdAt: "",
      updatedAt: "",
    },
  ]),
  getConversationBySubject: vi.fn(async () => null),
  insertConversation: vi.fn(async () => ({
    id: "conv1",
    subjectType: "task",
    subjectId: "t1",
    projectId: state.taskProjectId,
    title: null,
    createdAt: "",
  })),
  insertMessage: vi.fn(async (_db: unknown, m: unknown) => m),
  getCollaborator: vi.fn(async () => null),
}));
vi.mock("../timeline/service", () => ({ record: vi.fn(async () => undefined) }));
vi.mock("../notification/service", () => ({
  ingest: vi.fn(async () => ({ created: 0, delivered: 0, suppressed: 0 })),
}));
vi.mock("../decision/service", () => ({ complete: vi.fn(async () => undefined) }));
vi.mock("./realtime", () => ({ emitCollab: vi.fn() }));

import * as service from "./service";
const db = {} as Database;
const owner: Actor = { kind: "owner" };
const rahul: Actor = { kind: "collaborator", collaboratorId: "c-rahul" };
const stranger: Actor = { kind: "collaborator", collaboratorId: "c-stranger" };

beforeEach(() => {
  state.taskProjectId = null;
  state.memberships = [];
});

describe("privacy — a personal (project-less) task", () => {
  it("lets the owner read its discussion", async () => {
    await expect(service.listMessages(db, "task", "t1", owner)).resolves.toBeDefined();
  });
  it("DENIES any collaborator (no membership can grant a personal object)", async () => {
    await expect(service.listMessages(db, "task", "t1", rahul)).rejects.toThrow(/cannot access/i);
  });
});

describe("authorization — a shared task in a project", () => {
  beforeEach(() => {
    state.taskProjectId = "p1";
    state.memberships = [
      { id: "m1", projectId: "p1", collaboratorId: "c-rahul", role: "editor", createdAt: "" },
    ];
  });
  it("lets a member read + comment", async () => {
    await expect(service.listMessages(db, "task", "t1", rahul)).resolves.toBeDefined();
    await expect(
      service.postMessage(db, { subjectType: "task", subjectId: "t1", body: "hi" }, "UTC", rahul),
    ).resolves.toBeDefined();
  });
  it("DENIES a non-member read", async () => {
    await expect(service.listMessages(db, "task", "t1", stranger)).rejects.toThrow(
      /cannot access/i,
    );
  });
  it("DENIES a non-member comment", async () => {
    await expect(
      service.postMessage(
        db,
        { subjectType: "task", subjectId: "t1", body: "hi" },
        "UTC",
        stranger,
      ),
    ).rejects.toThrow(/cannot comment/i);
  });
});

describe("comment permission — viewer cannot comment", () => {
  it("denies a viewer from posting", async () => {
    state.taskProjectId = "p1";
    state.memberships = [
      { id: "m2", projectId: "p1", collaboratorId: "c-rahul", role: "viewer", createdAt: "" },
    ];
    await expect(
      service.postMessage(db, { subjectType: "task", subjectId: "t1", body: "hi" }, "UTC", rahul),
    ).rejects.toThrow(/cannot comment/i);
  });
});
