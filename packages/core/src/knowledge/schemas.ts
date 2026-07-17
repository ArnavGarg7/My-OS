import { z } from "zod";
import {
  BOOK_STATUSES,
  COURSE_STATUSES,
  KNOWLEDGE_TYPES,
  LEARNING_STATUSES,
  LINK_KINDS,
  REVIEW_GRADES,
} from "./constants";

/**
 * Knowledge zod schemas (Sprint 4.1). Validate the tRPC surface. Deterministic — every
 * derived view (graph/portfolio/search) is a query over these validated inputs.
 */
const title = z.string().min(1).max(200);
const tags = z.array(z.string().min(1).max(40)).max(30).optional();

export const noteInputSchema = z.object({
  title: title.optional(),
  content: z.string().max(100_000).optional(),
  tags,
  pinned: z.boolean().optional(),
});

export const updateNoteSchema = noteInputSchema.partial().extend({
  id: z.string().uuid(),
  archived: z.boolean().optional(),
});

export const wikiInputSchema = z.object({
  title,
  content: z.string().max(100_000).optional(),
  tags,
});

export const updateWikiSchema = wikiInputSchema.partial().extend({ id: z.string().uuid() });

export const bookInputSchema = z.object({
  title,
  author: z.string().max(200).optional(),
  status: z.enum(BOOK_STATUSES).optional(),
  totalPages: z.number().int().min(0).max(100_000).optional(),
  currentPage: z.number().int().min(0).max(100_000).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().max(50_000).optional(),
  minutesRead: z.number().int().min(0).optional(),
});

export const updateBookSchema = bookInputSchema.partial().extend({ id: z.string().uuid() });

export const courseInputSchema = z.object({
  title,
  provider: z.string().max(200).optional(),
  status: z.enum(COURSE_STATUSES).optional(),
  totalModules: z.number().int().min(0).max(10_000).optional(),
  completedModules: z.number().int().min(0).max(10_000).optional(),
  hoursSpent: z.number().min(0).max(100_000).optional(),
  certificate: z.boolean().optional(),
  notes: z.string().max(50_000).optional(),
});

export const updateCourseSchema = courseInputSchema.partial().extend({ id: z.string().uuid() });

export const researchInputSchema = z.object({
  title,
  question: z.string().max(2000).optional(),
  hypothesis: z.string().max(2000).optional(),
  status: z.enum(LEARNING_STATUSES).optional(),
  sources: z.array(z.string().max(500)).max(200).optional(),
  experiments: z.array(z.string().max(1000)).max(200).optional(),
  conclusions: z.string().max(10_000).optional(),
});

export const updateResearchSchema = researchInputSchema.partial().extend({ id: z.string().uuid() });

export const deckInputSchema = z.object({
  title,
  description: z.string().max(2000).optional(),
  tags,
});

export const flashcardInputSchema = z.object({
  deckId: z.string().uuid(),
  front: z.string().min(1).max(5000),
  back: z.string().min(1).max(5000),
});

export const reviewCardSchema = z.object({
  id: z.string().uuid(),
  grade: z.enum(REVIEW_GRADES),
});

export const linkInputSchema = z.object({
  sourceId: z.string().uuid(),
  sourceType: z.enum(KNOWLEDGE_TYPES),
  targetId: z.string().uuid(),
  targetType: z.enum(KNOWLEDGE_TYPES),
  kind: z.enum(LINK_KINDS),
});

export const idSchema = z.object({ id: z.string().uuid() });

export const searchSchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(100).optional(),
});

export const listSchema = z
  .object({ limit: z.number().int().min(1).max(500).optional() })
  .optional();
