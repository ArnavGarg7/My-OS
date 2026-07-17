import "server-only";
import {
  backlinksFor,
  buildGraph,
  neighborhood,
  type BacklinkView,
  type GraphInputNode,
  type KnowledgeGraph,
  type LinkableEntity,
} from "@myos/core/knowledge";
import type { Database } from "@myos/db";
import * as repo from "./repository";

/**
 * Knowledge graph (Sprint 4.1). Assembles graph nodes from notes/wiki/books/courses/
 * research and defers to the pure, deterministic core graph builder. Positions are
 * stable (hash-based), never simulated.
 */
async function graphNodes(
  db: Database,
): Promise<{ nodes: GraphInputNode[]; linkables: LinkableEntity[] }> {
  const [notes, wiki, booksList, coursesList, research] = await Promise.all([
    repo.listNotes(db),
    repo.listWiki(db),
    repo.listBooks(db),
    repo.listCourses(db),
    repo.listResearch(db),
  ]);
  const nodes: GraphInputNode[] = [
    ...notes
      .filter((n) => !n.archived)
      .map((n) => ({
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
    ...booksList.map((b) => ({
      id: b.id,
      type: "book" as const,
      title: b.title,
      linkedTitles: [],
    })),
    ...coursesList.map((c) => ({
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
  const linkables: LinkableEntity[] = [
    ...notes
      .filter((n) => !n.archived)
      .map((n) => ({
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
  ];
  return { nodes, linkables };
}

export async function graph(db: Database): Promise<KnowledgeGraph> {
  const [{ nodes }, links] = await Promise.all([graphNodes(db), repo.listLinks(db)]);
  return buildGraph(nodes, links);
}

export async function nodeNeighborhood(db: Database, id: string): Promise<KnowledgeGraph> {
  return neighborhood(await graph(db), id);
}

/** Backlinks for a note/wiki entity by id. */
export async function backlinks(db: Database, id: string): Promise<BacklinkView | null> {
  const { linkables } = await graphNodes(db);
  const target = linkables.find((e) => e.id === id);
  if (!target) return null;
  return backlinksFor(target, linkables);
}
