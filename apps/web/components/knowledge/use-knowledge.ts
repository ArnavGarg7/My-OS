"use client";

import { useMemo, useState } from "react";
import type { Note, ReviewGrade } from "@myos/core/knowledge";
import { useToaster } from "@/lib/framework";
import { trpc } from "@/lib/trpc/client";
import { useOptionalTimeline } from "@/lib/timeline";
import { useOptionalAnalytics } from "@/lib/analytics";

/**
 * Knowledge Center controller (Sprint 4.1). Owns every knowledge query + mutation —
 * notes, wiki, reading, learning, flashcards, research — and the selected note. Emits
 * timeline + analytics events on mutation. Deterministic; reflects engine state.
 */
export function useKnowledge() {
  const utils = trpc.useUtils();
  const toaster = useToaster();
  const timeline = useOptionalTimeline();
  const analytics = useOptionalAnalytics();

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const notes = trpc.knowledge.listNotes.useQuery();
  const wiki = trpc.knowledge.listWiki.useQuery();
  const books = trpc.knowledge.listBooks.useQuery();
  const courses = trpc.knowledge.listCourses.useQuery();
  const research = trpc.knowledge.listResearch.useQuery();
  const cards = trpc.knowledge.listCards.useQuery();
  const decks = trpc.knowledge.listDecks.useQuery();
  const graph = trpc.knowledge.graph.useQuery();
  const summary = trpc.knowledge.summary.useQuery(undefined, { refetchInterval: 60_000 });
  const portfolio = trpc.knowledge.portfolio.useQuery();
  const statistics = trpc.knowledge.statistics.useQuery();
  const resurface = trpc.knowledge.resurface.useQuery();
  const daily = trpc.knowledge.flashcards.useQuery();
  const searchResults = trpc.knowledge.search.useQuery(
    { query },
    { enabled: query.trim().length > 0 },
  );

  const refresh = () => {
    utils.knowledge.invalidate();
  };

  const createNote = trpc.knowledge.createNote.useMutation({
    onSuccess: (note) => {
      refresh();
      toaster.success("Note created");
      if (note) setSelectedNoteId(note.id);
      timeline.emit({ kind: "note.created", source: "knowledge", title: "Note created" });
      analytics.track({ kind: "knowledge.notes", value: 1 });
    },
    onError: (e) => toaster.error(e.message),
  });
  const updateNote = trpc.knowledge.updateNote.useMutation({ onSuccess: refresh });
  const deleteNote = trpc.knowledge.deleteNote.useMutation({
    onSuccess: () => {
      refresh();
      setSelectedNoteId(null);
    },
  });
  const createWiki = trpc.knowledge.createWiki.useMutation({
    onSuccess: () => {
      refresh();
      toaster.success("Wiki page created");
      timeline.emit({ kind: "wiki.created", source: "knowledge", title: "Wiki page created" });
    },
  });
  const createBook = trpc.knowledge.createBook.useMutation({ onSuccess: refresh });
  const updateBook = trpc.knowledge.updateBook.useMutation({
    onSuccess: (b) => {
      refresh();
      if (b?.status === "finished")
        timeline.emit({ kind: "book.finished", source: "knowledge", title: `Finished ${b.title}` });
    },
  });
  const createCourse = trpc.knowledge.createCourse.useMutation({ onSuccess: refresh });
  const updateCourse = trpc.knowledge.updateCourse.useMutation({
    onSuccess: (c) => {
      refresh();
      if (c?.status === "completed")
        timeline.emit({
          kind: "course.completed",
          source: "knowledge",
          title: `Completed ${c.title}`,
        });
    },
  });
  const createResearch = trpc.knowledge.createResearch.useMutation({
    onSuccess: () => {
      refresh();
      timeline.emit({ kind: "research.created", source: "knowledge", title: "Research created" });
    },
  });
  const updateResearch = trpc.knowledge.updateResearch.useMutation({ onSuccess: refresh });
  const createDeck = trpc.knowledge.createDeck.useMutation({ onSuccess: refresh });
  const createCard = trpc.knowledge.createCard.useMutation({ onSuccess: refresh });
  const reviewCard = trpc.knowledge.review.useMutation({
    onSuccess: () => {
      refresh();
      timeline.emit({
        kind: "flashcard.reviewed",
        source: "knowledge",
        title: "Flashcard reviewed",
      });
      analytics.track({ kind: "knowledge.flashcards_reviewed", value: 1 });
    },
  });

  const allNotes = useMemo(() => (notes.data ?? []) as Note[], [notes.data]);
  const selectedNote = useMemo(
    () => allNotes.find((n) => n.id === selectedNoteId) ?? null,
    [allNotes, selectedNoteId],
  );

  return {
    notes: allNotes,
    wiki: wiki.data ?? [],
    books: books.data ?? [],
    courses: courses.data ?? [],
    research: research.data ?? [],
    cards: cards.data ?? [],
    decks: decks.data ?? [],
    graph: graph.data ?? { nodes: [], edges: [] },
    summary: summary.data ?? null,
    portfolio: portfolio.data ?? null,
    statistics: statistics.data ?? null,
    resurface: resurface.data ?? [],
    daily: daily.data ?? null,
    isLoading: notes.isLoading,

    selectedNote,
    selectedNoteId,
    setSelectedNoteId,

    query,
    setQuery,
    searchResults: searchResults.data ?? [],

    createNote: (input: { title?: string; content?: string; tags?: string[] }) =>
      createNote.mutate(input),
    updateNote: (id: string, patch: { content?: string; title?: string; pinned?: boolean }) =>
      updateNote.mutate({ id, ...patch }),
    deleteNote: (id: string) => deleteNote.mutate({ id }),
    createWiki: (input: { title: string; content?: string }) => createWiki.mutate(input),
    createBook: (input: { title: string; author?: string; totalPages?: number }) =>
      createBook.mutate(input),
    updateBook: (id: string, patch: { currentPage?: number; rating?: number }) =>
      updateBook.mutate({ id, ...patch }),
    finishBook: (id: string) => updateBook.mutate({ id, status: "finished" }),
    createCourse: (input: { title: string; provider?: string; totalModules?: number }) =>
      createCourse.mutate(input),
    updateCourse: (id: string, patch: { completedModules?: number }) =>
      updateCourse.mutate({ id, ...patch }),
    completeCourse: (id: string) => updateCourse.mutate({ id, status: "completed" }),
    createResearch: (input: { title: string; question?: string }) => createResearch.mutate(input),
    updateResearch: (id: string, patch: { conclusions?: string }) =>
      updateResearch.mutate({ id, ...patch }),
    createDeck: (input: { title: string }) => createDeck.mutate(input),
    createCard: (input: { deckId: string; front: string; back: string }) =>
      createCard.mutate(input),
    reviewCard: (id: string, grade: ReviewGrade) => reviewCard.mutate({ id, grade }),
    pending: createNote.isPending || createWiki.isPending,
  };
}

export type UseKnowledge = ReturnType<typeof useKnowledge>;
