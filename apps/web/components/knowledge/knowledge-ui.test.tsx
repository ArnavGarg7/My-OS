import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  makeBook,
  makeCourse,
  makeDeckCard,
  makeNote,
  type BacklinkView,
  type DailyReview,
  type ResurfacedItem,
  type SearchHit,
} from "@myos/core/knowledge";
import { NoteViewer } from "./NoteViewer";
import { NoteEditor } from "./NoteEditor";
import { Tags } from "./Tags";
import { Backlinks } from "./Backlinks";
import { References } from "./References";
import { BookCard } from "./BookCard";
import { CourseCard } from "./CourseCard";
import { KnowledgeSearch } from "./KnowledgeSearch";
import { FlashcardReview } from "./FlashcardReview";
import { GraphView } from "./GraphView";
import { GraphInspector } from "./GraphInspector";
import { MemoryResurfacing } from "./MemoryResurfacing";
import {
  BOOK_STATUS_LABEL,
  COURSE_STATUS_LABEL,
  FLASHCARD_STATE_LABEL,
  TYPE_LABEL,
} from "./knowledge-icons";
import { buildGraph } from "@myos/core/knowledge";

describe("knowledge-icons", () => {
  it("labels every type + status", () => {
    expect(TYPE_LABEL.note).toBe("Note");
    expect(BOOK_STATUS_LABEL.reading).toBe("Reading");
    expect(COURSE_STATUS_LABEL.in_progress).toBe("In progress");
    expect(FLASHCARD_STATE_LABEL.mastered).toBe("Mastered");
  });
});

describe("NoteViewer", () => {
  it("renders the title, tags + headings", () => {
    render(
      <NoteViewer note={makeNote({ title: "ML", content: "# Heading\ntext", tags: ["ai"] })} />,
    );
    expect(screen.getByText("ML")).toBeInTheDocument();
    expect(screen.getByText("#ai")).toBeInTheDocument();
    expect(screen.getByText("Heading")).toBeInTheDocument();
  });

  it("renders wiki links inline", () => {
    render(<NoteViewer note={makeNote({ content: "See [[Backprop]] here" })} />);
    expect(screen.getByText("Backprop")).toBeInTheDocument();
  });
});

describe("NoteEditor", () => {
  it("creates a note with typed content", async () => {
    const onCreate = vi.fn();
    render(<NoteEditor onCreate={onCreate} pending={false} />);
    await userEvent.type(screen.getByLabelText("Note content"), "hello");
    await userEvent.click(screen.getByRole("button", { name: /Create note/ }));
    expect(onCreate).toHaveBeenCalledWith({ content: "hello" });
  });
});

describe("Tags / Backlinks / References", () => {
  it("renders tag chips", () => {
    render(<Tags tags={["ai", "ml"]} />);
    expect(screen.getByText("#ai")).toBeInTheDocument();
    expect(screen.getByText("#ml")).toBeInTheDocument();
  });

  it("renders backlinks + orphan state", () => {
    const view: BacklinkView = {
      backlinks: [{ fromId: "n2", fromType: "note", fromTitle: "Other" }],
      unresolved: ["Ghost"],
      orphan: false,
    };
    render(<Backlinks view={view} />);
    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(screen.getByText(/Unresolved/)).toBeInTheDocument();
  });

  it("renders references", () => {
    render(<References linkedTitles={["Linear Algebra"]} />);
    expect(screen.getByText("[[Linear Algebra]]")).toBeInTheDocument();
  });
});

describe("BookCard + CourseCard", () => {
  it("shows book progress + fires finish", async () => {
    const onFinish = vi.fn();
    render(
      <BookCard
        book={makeBook({ currentPage: 200, totalPages: 800, status: "reading" })}
        onFinish={onFinish}
        onAdvance={vi.fn()}
      />,
    );
    expect(screen.getByText(/25%/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Finish/ }));
    expect(onFinish).toHaveBeenCalled();
  });

  it("shows course progress + fires complete", async () => {
    const onComplete = vi.fn();
    render(
      <CourseCard
        course={makeCourse({ completedModules: 10, totalModules: 20, status: "in_progress" })}
        onComplete={onComplete}
        onAdvance={vi.fn()}
      />,
    );
    expect(screen.getByText(/10\/20 modules/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Complete/ }));
    expect(onComplete).toHaveBeenCalled();
  });
});

describe("KnowledgeSearch", () => {
  const hits: SearchHit[] = [
    { id: "n1", type: "note", title: "Vectors", snippet: "…", score: 1000, reason: "Exact title" },
  ];
  it("shows results with the match reason", () => {
    render(<KnowledgeSearch query="Vectors" onQuery={vi.fn()} results={hits} onSelect={vi.fn()} />);
    expect(screen.getByText("Vectors")).toBeInTheDocument();
    expect(screen.getByText("Exact title")).toBeInTheDocument();
  });
  it("fires onSelect", async () => {
    const onSelect = vi.fn();
    render(
      <KnowledgeSearch query="Vectors" onQuery={vi.fn()} results={hits} onSelect={onSelect} />,
    );
    await userEvent.click(screen.getByText("Vectors"));
    expect(onSelect).toHaveBeenCalledWith(hits[0]);
  });
  it("shows empty state for no matches", () => {
    render(<KnowledgeSearch query="zzz" onQuery={vi.fn()} results={[]} onSelect={vi.fn()} />);
    expect(screen.getByText(/No matches/)).toBeInTheDocument();
  });
});

describe("FlashcardReview", () => {
  const daily: DailyReview = {
    cards: [makeDeckCard({ front: "Q", back: "A" })],
    dueCount: 1,
    newCount: 0,
  };
  it("flips + grades a card", async () => {
    const onGrade = vi.fn();
    render(<FlashcardReview daily={daily} onGrade={onGrade} />);
    expect(screen.getByText("Q")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Show answer/ }));
    expect(screen.getByText("A")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Good/ }));
    expect(onGrade).toHaveBeenCalledWith(makeDeckCard().id, "good");
  });
  it("shows caught-up empty state", () => {
    render(<FlashcardReview daily={{ cards: [], dueCount: 0, newCount: 0 }} onGrade={vi.fn()} />);
    expect(screen.getByText("All caught up")).toBeInTheDocument();
  });
});

describe("GraphView + GraphInspector", () => {
  const graph = buildGraph(
    [
      { id: "n1", type: "note", title: "ML", linkedTitles: ["Stats"] },
      { id: "w1", type: "wiki", title: "Stats", linkedTitles: [] },
    ],
    [],
  );
  it("renders nodes + fires select", async () => {
    const onSelect = vi.fn();
    render(<GraphView graph={graph} selectedId={null} onSelect={onSelect} />);
    expect(screen.getByRole("img", { name: "Knowledge graph" })).toBeInTheDocument();
    await userEvent.click(screen.getByText("ML"));
    expect(onSelect).toHaveBeenCalledWith("n1");
  });
  it("inspects a selected node", () => {
    render(<GraphInspector graph={graph} selectedId="n1" />);
    expect(screen.getByText("ML")).toBeInTheDocument();
    expect(screen.getByText(/connection/)).toBeInTheDocument();
  });
  it("shows empty graph message", () => {
    render(<GraphView graph={{ nodes: [], edges: [] }} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText(/No knowledge yet/)).toBeInTheDocument();
  });
});

describe("MemoryResurfacing", () => {
  const items: ResurfacedItem[] = [
    {
      id: "n1",
      type: "note",
      title: "Old",
      reason: "forgotten_knowledge",
      detail: "45 days",
      score: 60,
    },
  ];
  it("renders resurfaced items with reason", () => {
    render(<MemoryResurfacing items={items} />);
    expect(screen.getByText("Old")).toBeInTheDocument();
    expect(screen.getByText("Forgotten")).toBeInTheDocument();
  });
  it("shows empty state", () => {
    render(<MemoryResurfacing items={[]} />);
    expect(screen.getByText("Nothing to resurface")).toBeInTheDocument();
  });
});
