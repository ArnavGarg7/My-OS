import "server-only";
import type {
  DailyReflection,
  JournalEntry,
  JournalLink,
  JournalReview,
  MoodLevel,
  EntryType,
  ReviewPeriod,
} from "@myos/core/journal";
import type {
  DailyReflectionRow,
  JournalEntryRow,
  JournalLinkRow,
  JournalReviewRow,
} from "@myos/db/schema";

/**
 * Journal row ↔ DTO mapping (Sprint 2.10). Timestamps become ISO strings for the
 * pure engine + client. Links are flattened from their columnar form into the
 * engine's {target, targetId} shape.
 */
export function linkRowToLinks(row: JournalLinkRow): JournalLink[] {
  const links: JournalLink[] = [];
  if (row.taskId) links.push({ target: "task", targetId: row.taskId });
  if (row.projectId) links.push({ target: "project", targetId: row.projectId });
  if (row.milestoneId) links.push({ target: "milestone", targetId: row.milestoneId });
  if (row.decisionId) links.push({ target: "decision", targetId: row.decisionId });
  if (row.plannerBlockId) links.push({ target: "planner_block", targetId: row.plannerBlockId });
  return links;
}

export function entryRowToEntry(row: JournalEntryRow, links: JournalLink[] = []): JournalEntry {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    entryType: row.entryType as EntryType,
    mood: (row.mood as MoodLevel | null) ?? null,
    tags: row.tags,
    archived: row.archived,
    links,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function reflectionRowToReflection(row: DailyReflectionRow): DailyReflection {
  return {
    id: row.id,
    date: row.date,
    reflection: row.reflection,
    wins: row.wins,
    lessons: row.lessons,
    gratitude: row.gratitude,
    tomorrowFocus: row.tomorrowFocus,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function reviewRowToReview(row: JournalReviewRow): JournalReview {
  return {
    id: row.id,
    period: row.period as ReviewPeriod,
    summary: row.summary,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Map an engine link into the columnar link insert shape. */
export function linkToColumns(link: JournalLink): {
  taskId: string | null;
  projectId: string | null;
  milestoneId: string | null;
  decisionId: string | null;
  plannerBlockId: string | null;
} {
  return {
    taskId: link.target === "task" ? link.targetId : null,
    projectId: link.target === "project" ? link.targetId : null,
    milestoneId: link.target === "milestone" ? link.targetId : null,
    decisionId: link.target === "decision" ? link.targetId : null,
    plannerBlockId: link.target === "planner_block" ? link.targetId : null,
  };
}
