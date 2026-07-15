import "server-only";
import {
  addDependency as addDep,
  objectiveProgress,
  OPEN_PROJECT_STATUSES,
  projectEngine,
  topProject as topProjectSelect,
  UPCOMING_DAYS,
  updateObjective as updateObjectiveValue,
  type BurndownPoint,
  type Forecast,
  type HealthResult,
  type Milestone,
  type Objective,
  type Project,
  type ProjectDependency,
  type ProjectProgress,
  type ProjectStatus,
} from "@myos/core/project";
import type { Database } from "@myos/db";
import type { ProjectHistoryRow } from "@myos/db/schema";
import * as analytics from "./analytics";
import {
  dependencyRowToId,
  milestoneRowToMilestone,
  objectiveRowToObjective,
  projectRowToProject,
} from "./mapper";
import { portfolioSummary, roadmap as buildRoadmapItems } from "./portfolio";
import * as repo from "./repository";
import { buildTimeline, type ProjectTimeline } from "./timeline";

/**
 * ProjectService (Sprint 2.8). Bridges the pure ProjectEngine with persistence.
 * Projects own long-term outcomes; progress / health / forecast are always
 * derived (never stored). Every mutation appends to the project history log.
 */
async function hydrate(
  db: Database,
  row: Awaited<ReturnType<typeof repo.getProject>>,
): Promise<Project> {
  if (!row) throw new Error("Project not found");
  const [milestones, objectives, deps] = await Promise.all([
    repo.listMilestones(db, row.id),
    repo.listObjectives(db, row.id),
    repo.listDependenciesFor(db, row.id),
  ]);
  return projectRowToProject(
    row,
    milestones.map(milestoneRowToMilestone),
    objectives.map(objectiveRowToObjective),
    deps.map(dependencyRowToId),
  );
}

async function hydrateAll(db: Database, status?: ProjectStatus): Promise<Project[]> {
  const rows = await repo.listProjects(db, status);
  return Promise.all(rows.map((r) => hydrate(db, r)));
}

export async function list(
  db: Database,
  input: { status?: ProjectStatus | undefined },
): Promise<Project[]> {
  return hydrateAll(db, input.status);
}

export async function get(db: Database, id: string): Promise<Project> {
  return hydrate(db, await repo.getProject(db, id));
}

export async function create(
  db: Database,
  input: {
    name: string;
    description?: string | undefined;
    priority?: Project["priority"] | undefined;
    color?: Project["color"] | undefined;
    owner?: string | undefined;
    startDate?: string | null | undefined;
    targetDate?: string | null | undefined;
  },
): Promise<Project> {
  const draft = projectEngine.create(input, new Date());
  const errors = projectEngine.validate(draft);
  if (errors.length) throw new Error(errors.join(" "));
  const row = await repo.insertProject(db, draft);
  await repo.logHistory(db, row.id, "created", { name: row.name });
  return hydrate(db, row);
}

export async function update(
  db: Database,
  input: {
    id: string;
    name?: string | undefined;
    description?: string | undefined;
    status?: ProjectStatus | undefined;
    priority?: Project["priority"] | undefined;
    color?: Project["color"] | undefined;
    startDate?: string | null | undefined;
    targetDate?: string | null | undefined;
  },
): Promise<Project> {
  const current = await get(db, input.id);
  const now = new Date();
  let next: Project = {
    ...current,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.priority !== undefined ? { priority: input.priority } : {}),
    ...(input.color !== undefined ? { color: input.color } : {}),
    ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
    ...(input.targetDate !== undefined ? { targetDate: input.targetDate } : {}),
    updatedAt: now.toISOString(),
  };
  if (input.status !== undefined && input.status !== current.status) {
    next = projectEngine.setStatus(next, input.status, now);
  }
  const errors = projectEngine.validate(next);
  if (errors.length) throw new Error(errors.join(" "));
  const row = await repo.updateProject(db, input.id, next);
  await repo.logHistory(db, input.id, "updated", {});
  return hydrate(db, row);
}

export async function remove(db: Database, id: string): Promise<{ id: string }> {
  await repo.deleteProject(db, id);
  return { id };
}

export async function archive(db: Database, id: string): Promise<Project> {
  const current = await get(db, id);
  const next = projectEngine.archive(current, new Date());
  const row = await repo.updateProject(db, id, next);
  await repo.logHistory(db, id, "archived", {});
  return hydrate(db, row);
}

// --- derived analytics ---
export async function progress(db: Database, id: string): Promise<ProjectProgress> {
  return analytics.progress(db, await get(db, id));
}

export async function health(db: Database, id: string): Promise<HealthResult> {
  return analytics.health(db, await get(db, id));
}

export async function forecast(db: Database, id: string): Promise<Forecast> {
  return analytics.projectForecast(db, await get(db, id));
}

export async function burndown(db: Database, id: string): Promise<BurndownPoint[]> {
  return analytics.burndown(db, await get(db, id));
}

export async function timeline(db: Database, id: string): Promise<ProjectTimeline> {
  return buildTimeline(db, await get(db, id));
}

export async function portfolio(db: Database) {
  const projects = await hydrateAll(db);
  return portfolioSummary(db, projects);
}

export async function roadmap(db: Database) {
  return buildRoadmapItems(await hydrateAll(db));
}

/** A per-project headline (progress + health + forecast + next milestone). */
export async function summary(db: Database, id: string) {
  const project = await get(db, id);
  const tasks = await analytics.tasksFor(db, id);
  return projectEngine.summary(project, tasks, new Date());
}

// --- milestones ---
export async function createMilestone(
  db: Database,
  input: {
    projectId: string;
    title: string;
    description?: string | undefined;
    dueDate?: string | null | undefined;
    order?: number | undefined;
  },
): Promise<Milestone> {
  const existing = await repo.listMilestones(db, input.projectId);
  const row = await repo.insertMilestone(db, {
    projectId: input.projectId,
    title: input.title,
    description: input.description ?? "",
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    order: input.order ?? existing.length,
  });
  await repo.logHistory(db, input.projectId, "milestone_created", { title: input.title });
  return milestoneRowToMilestone(row);
}

export async function completeMilestone(db: Database, id: string): Promise<Milestone> {
  const existing = await repo.getMilestone(db, id);
  if (!existing) throw new Error("Milestone not found");
  const row = await repo.setMilestoneCompleted(db, id, true);
  await repo.logHistory(db, existing.projectId, "milestone_completed", { id });
  return milestoneRowToMilestone(row);
}

export async function listMilestones(db: Database, projectId: string): Promise<Milestone[]> {
  return (await repo.listMilestones(db, projectId)).map(milestoneRowToMilestone);
}

// --- objectives ---
export async function createObjective(
  db: Database,
  input: { projectId: string; title: string; targetValue: number; unit: string },
): Promise<Objective> {
  const row = await repo.insertObjective(db, input);
  await repo.logHistory(db, input.projectId, "objective_created", { title: input.title });
  return objectiveRowToObjective(row);
}

export async function updateObjective(
  db: Database,
  input: { id: string; currentValue: number },
): Promise<Objective> {
  const existing = await repo.getObjective(db, input.id);
  if (!existing) throw new Error("Objective not found");
  const next = updateObjectiveValue(objectiveRowToObjective(existing), input.currentValue);
  const row = await repo.setObjectiveValue(db, input.id, next.currentValue, next.completed);
  return objectiveRowToObjective(row);
}

export async function listObjectives(
  db: Database,
  projectId: string,
): Promise<(Objective & { progress: number })[]> {
  return (await repo.listObjectives(db, projectId))
    .map(objectiveRowToObjective)
    .map((o) => ({ ...o, progress: objectiveProgress(o) }));
}

// --- dependencies ---
export async function listDependencies(db: Database): Promise<ProjectDependency[]> {
  return (await repo.listDependencies(db)).map((d) => ({
    projectId: d.projectId,
    dependsOn: d.dependsOn,
  }));
}

export async function addDependency(
  db: Database,
  input: { projectId: string; dependsOn: string },
): Promise<{ ok: boolean; error?: string }> {
  const existing = await listDependencies(db);
  const result = addDep(existing, input.projectId, input.dependsOn);
  if (!result.ok) return { ok: false, error: result.error ?? "invalid" };
  await repo.addDependency(db, input.projectId, input.dependsOn);
  await repo.logHistory(db, input.projectId, "dependency_added", { dependsOn: input.dependsOn });
  return { ok: true };
}

export async function removeDependency(
  db: Database,
  input: { projectId: string; dependsOn: string },
): Promise<{ ok: true }> {
  await repo.removeDependency(db, input.projectId, input.dependsOn);
  return { ok: true };
}

// --- task ownership ---
export async function attachTask(
  db: Database,
  input: {
    taskId: string;
    projectId: string | null;
    milestoneId?: string | null | undefined;
    objectiveId?: string | null | undefined;
  },
): Promise<{ id: string }> {
  const row = await repo.setTaskOwnership(db, input.taskId, {
    projectId: input.projectId,
    milestoneId: input.milestoneId ?? null,
    objectiveId: input.objectiveId ?? null,
  });
  if (input.projectId)
    await repo.logHistory(db, input.projectId, "task_attached", { taskId: input.taskId });
  return { id: row.id };
}

export async function detachTask(db: Database, taskId: string): Promise<{ id: string }> {
  const row = await repo.setTaskOwnership(db, taskId, {
    projectId: null,
    milestoneId: null,
    objectiveId: null,
  });
  return { id: row.id };
}

// --- history + search ---
export async function history(db: Database, projectId: string): Promise<ProjectHistoryRow[]> {
  return repo.listHistory(db, projectId);
}

/**
 * Derived project signals for cross-module consumers (Decision, Morning) —
 * Sprint 2.8. Deterministic; nothing stored. `criticalMilestones` are open
 * milestones due within the upcoming window across active projects.
 */
export async function signals(
  db: Database,
  now = new Date(),
): Promise<{
  topProjectName: string | null;
  criticalMilestones: { projectName: string; title: string; dueInDays: number }[];
  atRiskCount: number;
}> {
  const projects = await hydrateAll(db);
  const summary = await portfolioSummary(db, projects, now);
  const top = topProjectSelect(projects);
  const day = 86_400_000;
  const critical = projects
    .filter((p) => OPEN_PROJECT_STATUSES.includes(p.status))
    .flatMap((p) =>
      p.milestones
        .filter((m) => !m.completed && m.dueDate)
        .map((m) => ({
          projectName: p.name,
          title: m.title,
          dueInDays: Math.ceil((new Date(m.dueDate!).getTime() - now.getTime()) / day),
        })),
    )
    .filter((m) => m.dueInDays <= UPCOMING_DAYS)
    .sort((a, b) => a.dueInDays - b.dueInDays);
  return {
    topProjectName: top?.name ?? null,
    criticalMilestones: critical,
    atRiskCount: summary.atRiskCount,
  };
}

export async function search(db: Database, text: string): Promise<Project[]> {
  const q = text.trim().toLowerCase();
  const projects = await hydrateAll(db);
  if (!q) return projects;
  return projects.filter(
    (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
  );
}
