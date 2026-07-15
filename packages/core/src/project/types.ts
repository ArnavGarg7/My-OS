import type { Task } from "../task";
import type { ProjectColor, ProjectHealth, ProjectPriority, ProjectStatus } from "./constants";

/**
 * Project domain types (Sprint 2.8). Projects own milestones + objectives; tasks
 * belong to a project (optionally a milestone/objective). Progress/health/
 * forecast are always derived, never stored.
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  color: ProjectColor;
  owner: string;
  startDate: string | null; // ISO date
  targetDate: string | null; // ISO date
  completedAt: string | null; // ISO
  createdAt: string; // ISO
  updatedAt: string; // ISO
  /** Hydrated relations (default []). */
  milestones: Milestone[];
  objectives: Objective[];
  dependencies: string[]; // project ids this depends on
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: string | null; // ISO date
  completed: boolean;
  order: number;
}

export interface Objective {
  id: string;
  projectId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  completed: boolean;
}

export interface ProjectDependency {
  projectId: string;
  dependsOn: string;
}

export interface ProjectProgress {
  tasksPercent: number;
  milestonesPercent: number;
  objectivesPercent: number;
  schedulePercent: number;
  overall: number; // 0–100
  completedTasks: number;
  totalTasks: number;
  completedMilestones: number;
  totalMilestones: number;
}

export interface HealthResult {
  status: ProjectHealth;
  score: number; // 0–100 (higher = healthier)
  reasons: string[];
}

export interface Forecast {
  velocityPerDay: number; // tasks completed per day
  remainingTasks: number;
  estimatedCompletion: string | null; // ISO date
  confidence: number; // 0–100
  onTrack: boolean;
  bufferDays: number;
  predictedDelayDays: number;
}

export interface BurndownPoint {
  date: string; // ISO date
  remaining: number;
  ideal: number;
}

export interface RoadmapItem {
  quarter: string; // e.g. "2026 Q3"
  month: string; // e.g. "2026-07"
  projectId: string;
  projectName: string;
  milestoneId: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface PortfolioSummary {
  projectCount: number;
  activeCount: number;
  overallCompletion: number; // 0–100
  healthDistribution: Record<ProjectHealth, number>;
  atRiskCount: number;
  openMilestones: number;
  blockedTasks: number;
  upcomingDeadlines: { projectId: string; title: string; dueDate: string }[];
}

/** Everything the engine needs to summarize a project. */
export interface ProjectContext {
  project: Project;
  tasks: Task[];
  now: Date;
}
