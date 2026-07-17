import {
  bookInputSchema,
  courseInputSchema,
  deckInputSchema,
  flashcardInputSchema,
  idSchema,
  linkInputSchema,
  noteInputSchema,
  researchInputSchema,
  reviewCardSchema,
  searchSchema,
  updateBookSchema,
  updateCourseSchema,
  updateNoteSchema,
  updateResearchSchema,
  updateWikiSchema,
  wikiInputSchema,
  type Book,
  type Course,
  type Note,
  type ResearchProject,
  type WikiPage,
} from "@myos/core/knowledge";
import { protectedProcedure, router } from "../trpc";
import * as service from "./service";
import * as searchService from "./search";
import * as graphService from "./graph";
import * as reviewService from "./review";
import * as summaryService from "./summary";

/**
 * Knowledge API (Sprint 4.1). A zod-validated tRPC surface over the deterministic
 * Knowledge & Memory Platform. protectedProcedure only. Every derived view is a query
 * that recomputes from stored entities — nothing derived is persisted.
 */
export const knowledgeRouter = router({
  // Notes
  listNotes: protectedProcedure.query(({ ctx }) => service.listNotes(ctx.db)),
  getNote: protectedProcedure
    .input(idSchema)
    .query(({ ctx, input }) => service.getNote(ctx.db, input.id)),
  createNote: protectedProcedure
    .input(noteInputSchema)
    .mutation(({ ctx, input }) =>
      service.createNote(
        ctx.db,
        input as { title?: string; content?: string; tags?: string[]; pinned?: boolean },
      ),
    ),
  updateNote: protectedProcedure.input(updateNoteSchema).mutation(({ ctx, input }) => {
    const { id, ...patch } = input;
    return service.updateNote(ctx.db, id, patch as Partial<Note>);
  }),
  deleteNote: protectedProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) => service.deleteNote(ctx.db, input.id)),

  // Wiki
  listWiki: protectedProcedure.query(({ ctx }) => service.listWiki(ctx.db)),
  createWiki: protectedProcedure
    .input(wikiInputSchema)
    .mutation(({ ctx, input }) =>
      service.createWiki(ctx.db, input as { title: string; content?: string; tags?: string[] }),
    ),
  updateWiki: protectedProcedure.input(updateWikiSchema).mutation(({ ctx, input }) => {
    const { id, ...patch } = input;
    return service.updateWiki(ctx.db, id, patch as Partial<WikiPage>);
  }),
  backlinks: protectedProcedure
    .input(idSchema)
    .query(({ ctx, input }) => graphService.backlinks(ctx.db, input.id)),
  references: protectedProcedure
    .input(idSchema)
    .query(({ ctx, input }) => graphService.backlinks(ctx.db, input.id)),

  // Books / Courses / Research
  listBooks: protectedProcedure.query(({ ctx }) => service.listBooks(ctx.db)),
  createBook: protectedProcedure
    .input(bookInputSchema)
    .mutation(({ ctx, input }) =>
      service.createBook(ctx.db, input as Partial<Book> & { title: string }),
    ),
  updateBook: protectedProcedure.input(updateBookSchema).mutation(({ ctx, input }) => {
    const { id, ...patch } = input;
    return service.updateBook(ctx.db, id, patch as Partial<Book>);
  }),
  listCourses: protectedProcedure.query(({ ctx }) => service.listCourses(ctx.db)),
  createCourse: protectedProcedure
    .input(courseInputSchema)
    .mutation(({ ctx, input }) =>
      service.createCourse(ctx.db, input as Partial<Course> & { title: string }),
    ),
  updateCourse: protectedProcedure.input(updateCourseSchema).mutation(({ ctx, input }) => {
    const { id, ...patch } = input;
    return service.updateCourse(ctx.db, id, patch as Partial<Course>);
  }),
  listResearch: protectedProcedure.query(({ ctx }) => service.listResearch(ctx.db)),
  createResearch: protectedProcedure
    .input(researchInputSchema)
    .mutation(({ ctx, input }) =>
      service.createResearch(ctx.db, input as Partial<ResearchProject> & { title: string }),
    ),
  updateResearch: protectedProcedure.input(updateResearchSchema).mutation(({ ctx, input }) => {
    const { id, ...patch } = input;
    return service.updateResearch(ctx.db, id, patch as Partial<ResearchProject>);
  }),

  // Flashcards
  listDecks: protectedProcedure.query(({ ctx }) => service.listDecks(ctx.db)),
  createDeck: protectedProcedure
    .input(deckInputSchema)
    .mutation(({ ctx, input }) =>
      service.createDeck(ctx.db, input as { title: string; description?: string; tags?: string[] }),
    ),
  listCards: protectedProcedure.query(({ ctx }) => service.listCards(ctx.db)),
  createCard: protectedProcedure
    .input(flashcardInputSchema)
    .mutation(({ ctx, input }) => service.createCard(ctx.db, input)),
  review: protectedProcedure
    .input(reviewCardSchema)
    .mutation(({ ctx, input }) => service.reviewCard(ctx.db, input.id, input.grade)),
  flashcards: protectedProcedure.query(({ ctx }) => reviewService.daily(ctx.db)),

  // Links
  createLink: protectedProcedure
    .input(linkInputSchema)
    .mutation(({ ctx, input }) => service.createLink(ctx.db, input)),

  // Derived views
  search: protectedProcedure
    .input(searchSchema)
    .query(({ ctx, input }) => searchService.search(ctx.db, input.query, input.limit ?? 20)),
  graph: protectedProcedure.query(({ ctx }) => graphService.graph(ctx.db)),
  portfolio: protectedProcedure.query(({ ctx }) => summaryService.portfolio(ctx.db)),
  summary: protectedProcedure.query(({ ctx }) => summaryService.summary(ctx.db)),
  statistics: protectedProcedure.query(({ ctx }) => summaryService.statistics(ctx.db)),
  signals: protectedProcedure.query(({ ctx }) => summaryService.signals(ctx.db)),
  resurface: protectedProcedure.query(({ ctx }) => reviewService.resurfacing(ctx.db)),
  memory: protectedProcedure.query(({ ctx }) => reviewService.resurfacing(ctx.db)),
});
