import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  milestones,
  objectives,
  projectDependencies,
  projectHistory,
  projects,
  tasks,
  type MilestoneRow,
  type ObjectiveRow,
  type ProjectDependencyRow,
  type ProjectHistoryRow,
  type ProjectRow,
  type TaskRow,
} from "@myos/db/schema";
import type { Project, ProjectStatus } from "@myos/core/project";
import { projectToColumns } from "./mapper";

/**
 * Project persistence (Sprint 2.8). Pure DB access over the five project tables
 * plus the task ownership columns. No business logic — the service composes
 * these with the pure ProjectEngine.
 */
export function listProjects(db: Database, status?: ProjectStatus): Promise<ProjectRow[]> {
  const where = status ? eq(projects.status, status) : undefined;
  return db.select().from(projects).where(where).orderBy(desc(projects.updatedAt));
}

export async function getProject(db: Database, id: string): Promise<ProjectRow | undefined> {
  const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return row;
}

export async function insertProject(db: Database, project: Project): Promise<ProjectRow> {
  const [row] = await db.insert(projects).values(projectToColumns(project)).returning();
  if (!row) throw new Error("Failed to insert project");
  return row;
}

export async function updateProject(
  db: Database,
  id: string,
  project: Project,
): Promise<ProjectRow> {
  const [row] = await db
    .update(projects)
    .set(projectToColumns(project))
    .where(eq(projects.id, id))
    .returning();
  if (!row) throw new Error("Project not found");
  return row;
}

export async function deleteProject(db: Database, id: string): Promise<void> {
  await db.delete(projects).where(eq(projects.id, id));
}

// --- milestones ---
export function listMilestones(db: Database, projectId: string): Promise<MilestoneRow[]> {
  return db
    .select()
    .from(milestones)
    .where(eq(milestones.projectId, projectId))
    .orderBy(milestones.order);
}

export function listAllMilestones(db: Database): Promise<MilestoneRow[]> {
  return db.select().from(milestones).orderBy(milestones.order);
}

export async function getMilestone(db: Database, id: string): Promise<MilestoneRow | undefined> {
  const [row] = await db.select().from(milestones).where(eq(milestones.id, id)).limit(1);
  return row;
}

export async function insertMilestone(
  db: Database,
  input: {
    projectId: string;
    title: string;
    description: string;
    dueDate: Date | null;
    order: number;
  },
): Promise<MilestoneRow> {
  const [row] = await db.insert(milestones).values(input).returning();
  if (!row) throw new Error("Failed to insert milestone");
  return row;
}

export async function setMilestoneCompleted(
  db: Database,
  id: string,
  completed: boolean,
): Promise<MilestoneRow> {
  const [row] = await db
    .update(milestones)
    .set({ completed })
    .where(eq(milestones.id, id))
    .returning();
  if (!row) throw new Error("Milestone not found");
  return row;
}

// --- objectives ---
export function listObjectives(db: Database, projectId: string): Promise<ObjectiveRow[]> {
  return db.select().from(objectives).where(eq(objectives.projectId, projectId));
}

export async function insertObjective(
  db: Database,
  input: { projectId: string; title: string; targetValue: number; unit: string },
): Promise<ObjectiveRow> {
  const [row] = await db.insert(objectives).values(input).returning();
  if (!row) throw new Error("Failed to insert objective");
  return row;
}

export async function setObjectiveValue(
  db: Database,
  id: string,
  currentValue: number,
  completed: boolean,
): Promise<ObjectiveRow> {
  const [row] = await db
    .update(objectives)
    .set({ currentValue, completed })
    .where(eq(objectives.id, id))
    .returning();
  if (!row) throw new Error("Objective not found");
  return row;
}

export async function getObjective(db: Database, id: string): Promise<ObjectiveRow | undefined> {
  const [row] = await db.select().from(objectives).where(eq(objectives.id, id)).limit(1);
  return row;
}

// --- dependencies ---
export function listDependencies(db: Database): Promise<ProjectDependencyRow[]> {
  return db.select().from(projectDependencies);
}

export function listDependenciesFor(
  db: Database,
  projectId: string,
): Promise<ProjectDependencyRow[]> {
  return db.select().from(projectDependencies).where(eq(projectDependencies.projectId, projectId));
}

export async function addDependency(
  db: Database,
  projectId: string,
  dependsOn: string,
): Promise<void> {
  await db.insert(projectDependencies).values({ projectId, dependsOn }).onConflictDoNothing();
}

export async function removeDependency(
  db: Database,
  projectId: string,
  dependsOn: string,
): Promise<void> {
  await db
    .delete(projectDependencies)
    .where(
      and(
        eq(projectDependencies.projectId, projectId),
        eq(projectDependencies.dependsOn, dependsOn),
      ),
    );
}

// --- tasks (ownership) ---
export function listTasks(db: Database): Promise<TaskRow[]> {
  return db.select().from(tasks);
}

export function tasksForProject(db: Database, projectId: string): Promise<TaskRow[]> {
  return db.select().from(tasks).where(eq(tasks.projectId, projectId));
}

export async function tasksForProjects(db: Database, projectIds: string[]): Promise<TaskRow[]> {
  if (projectIds.length === 0) return [];
  return db.select().from(tasks).where(inArray(tasks.projectId, projectIds));
}

export async function setTaskOwnership(
  db: Database,
  taskId: string,
  ownership: { projectId: string | null; milestoneId: string | null; objectiveId: string | null },
): Promise<TaskRow> {
  const [row] = await db
    .update(tasks)
    .set({ ...ownership, updatedAt: new Date() })
    .where(eq(tasks.id, taskId))
    .returning();
  if (!row) throw new Error("Task not found");
  return row;
}

// --- history ---
export async function logHistory(
  db: Database,
  projectId: string,
  action: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await db.insert(projectHistory).values({ projectId, action, metadata });
}

export function listHistory(
  db: Database,
  projectId: string,
  limit = 50,
): Promise<ProjectHistoryRow[]> {
  return db
    .select()
    .from(projectHistory)
    .where(eq(projectHistory.projectId, projectId))
    .orderBy(desc(projectHistory.createdAt))
    .limit(limit);
}
