import { describe, expect, it } from "vitest";
import {
  averageConnections,
  backlinksFor,
  buildGraph,
  incomingCounts,
  mostConnected,
  neighborhood,
  orphanPages,
  orphans,
  orphanTargets,
  resolveLinks,
  type GraphInputNode,
  type LinkableEntity,
} from "../index";
import { makeLink, makeNote, makeWiki } from "../fixtures";

const note = makeNote(); // links to [[Linear Algebra]]
const wiki = makeWiki(); // "Linear Algebra", links to [[Machine Learning]]

const linkables: LinkableEntity[] = [
  { id: note.id, type: "note", title: note.title, linkedTitles: note.linkedTitles },
  { id: wiki.id, type: "wiki", title: wiki.title, linkedTitles: wiki.linkedTitles },
];

describe("backlinks", () => {
  it("finds incoming links", () => {
    const view = backlinksFor(linkables[1]!, linkables); // Linear Algebra
    expect(view.backlinks.map((b) => b.fromTitle)).toContain("Machine Learning");
  });

  it("reports unresolved outgoing links", () => {
    const solo: LinkableEntity = {
      id: "x",
      type: "note",
      title: "X",
      linkedTitles: ["Nonexistent"],
    };
    const view = backlinksFor(solo, [solo]);
    expect(view.unresolved).toEqual(["Nonexistent"]);
    expect(view.orphan).toBe(false);
  });

  it("flags orphans", () => {
    const solo: LinkableEntity = { id: "x", type: "note", title: "X", linkedTitles: [] };
    expect(backlinksFor(solo, [solo]).orphan).toBe(true);
    expect(orphans([solo])).toHaveLength(1);
  });

  it("counts incoming links per id", () => {
    const counts = incomingCounts(linkables);
    expect(counts.get(wiki.id)).toBe(1); // note → Linear Algebra
    expect(counts.get(note.id)).toBe(1); // wiki → Machine Learning
  });
});

describe("wiki resolution", () => {
  it("resolves known vs unknown titles", () => {
    const { resolved, unresolved } = resolveLinks(
      ["Machine Learning", "Ghost Page"],
      [{ title: "Machine Learning" }],
    );
    expect(resolved).toEqual(["Machine Learning"]);
    expect(unresolved).toEqual(["Ghost Page"]);
  });

  it("lists orphan targets (red links)", () => {
    const entries = [{ id: "a", title: "A", linkedTitles: ["Missing"] }];
    expect(orphanTargets(entries)).toEqual(["missing"]);
  });

  it("lists orphan pages", () => {
    const entries = [
      { id: "a", title: "A", linkedTitles: [] },
      { id: "b", title: "B", linkedTitles: ["A"] },
    ];
    expect(orphanPages(entries).map((e) => e.id)).toEqual([]); // A is linked-to, B links out
  });
});

describe("knowledge graph", () => {
  const nodes: GraphInputNode[] = [
    { id: note.id, type: "note", title: note.title, linkedTitles: note.linkedTitles },
    { id: wiki.id, type: "wiki", title: wiki.title, linkedTitles: wiki.linkedTitles },
  ];

  it("builds deterministic nodes + edges", () => {
    const g1 = buildGraph(nodes, [makeLink()]);
    const g2 = buildGraph(nodes, [makeLink()]);
    expect(g1).toEqual(g2); // deterministic
    expect(g1.nodes).toHaveLength(2);
    expect(g1.edges.length).toBeGreaterThan(0);
  });

  it("positions nodes in [0,1)", () => {
    const g = buildGraph(nodes, []);
    for (const n of g.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(1);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeLessThanOrEqual(1);
    }
  });

  it("derives mentions edges from wiki links", () => {
    const g = buildGraph(nodes, []);
    expect(g.edges.some((e) => e.kind === "mentions")).toBe(true);
  });

  it("computes degree + most connected + average", () => {
    const g = buildGraph(nodes, [makeLink()]);
    expect(mostConnected(g)).not.toBeNull();
    expect(averageConnections(g)).toBeGreaterThan(0);
  });

  it("extracts a node neighborhood", () => {
    const g = buildGraph(nodes, [makeLink()]);
    const n = neighborhood(g, note.id);
    expect(n.nodes.some((x) => x.id === note.id)).toBe(true);
  });

  it("handles an empty graph", () => {
    const g = buildGraph([], []);
    expect(g.nodes).toEqual([]);
    expect(mostConnected(g)).toBeNull();
    expect(averageConnections(g)).toBe(0);
  });
});
