import type {
  Book,
  Course,
  Flashcard,
  KnowledgePortfolio,
  Note,
  ResearchProject,
  WikiPage,
} from "./types";
import { averageConnections, buildGraph, mostConnected, type GraphInputNode } from "./graph";
import { learningHours, readingVelocity } from "./learning";
import { toPlainText } from "./markdown";
import type { KnowledgeLink } from "./types";

/**
 * Knowledge portfolio (Sprint 4.1). A fully DERIVED snapshot of the second brain — never
 * stored. Totals, writing/learning hours, graph size + connectivity, most-connected
 * topic and reading velocity. Pure.
 */

export interface PortfolioInput {
  notes: Note[];
  wiki: WikiPage[];
  books: Book[];
  courses: Course[];
  flashcards: Flashcard[];
  research: ResearchProject[];
  links: KnowledgeLink[];
  now: Date;
}

/** Rough writing hours: 200 words ≈ 1 minute of writing effort (deterministic proxy). */
function writingHours(notes: Note[], wiki: WikiPage[]): number {
  const words = [...notes, ...wiki].reduce((n, e) => {
    const text = toPlainText(e.content);
    return n + (text ? text.split(/\s+/).length : 0);
  }, 0);
  return Number((words / 200 / 60).toFixed(1));
}

export function buildPortfolio(input: PortfolioInput): KnowledgePortfolio {
  const { notes, wiki, books, courses, flashcards, research, links, now } = input;
  const active = notes.filter((n) => !n.archived);

  const graphNodes: GraphInputNode[] = [
    ...active.map((n) => ({
      id: n.id,
      type: "note" as const,
      title: n.title,
      linkedTitles: n.linkedTitles,
    })),
    ...wiki.map((w) => ({
      id: w.id,
      type: "wiki" as const,
      title: w.title,
      linkedTitles: w.linkedTitles,
    })),
    ...books.map((b) => ({ id: b.id, type: "book" as const, title: b.title, linkedTitles: [] })),
    ...courses.map((c) => ({
      id: c.id,
      type: "course" as const,
      title: c.title,
      linkedTitles: [],
    })),
    ...research.map((r) => ({
      id: r.id,
      type: "research" as const,
      title: r.title,
      linkedTitles: [],
    })),
  ];
  const graph = buildGraph(graphNodes, links);
  const top = mostConnected(graph);

  return {
    totalNotes: active.length,
    wikiPages: wiki.length,
    books: books.length,
    courses: courses.length,
    flashcards: flashcards.length,
    researchProjects: research.length,
    writingHours: writingHours(active, wiki),
    learningHours: learningHours(books, courses),
    graphSize: graph.nodes.length,
    averageConnections: averageConnections(graph),
    mostConnectedTopic: top && top.degree > 0 ? top.title : null,
    readingVelocity: readingVelocity(books, now),
  };
}
