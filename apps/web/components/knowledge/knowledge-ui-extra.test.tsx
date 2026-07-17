import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeBook, makeCourse, makeDeckCard, makeResearch, makeWiki } from "@myos/core/knowledge";
import { WikiExplorer } from "./WikiExplorer";
import { WikiPageView } from "./WikiPage";
import { ReadingTracker } from "./ReadingTracker";
import { LearningWorkspace } from "./LearningWorkspace";
import { FlashcardDeck } from "./FlashcardDeck";
import { ResearchWorkspace } from "./ResearchWorkspace";
import { NoteViewer } from "./NoteViewer";

describe("WikiExplorer", () => {
  it("creates a page + lists pages", async () => {
    const onCreate = vi.fn();
    render(
      <WikiExplorer
        pages={[makeWiki({ title: "Linear Algebra" })]}
        selectedId={null}
        onSelect={vi.fn()}
        onCreate={onCreate}
      />,
    );
    expect(screen.getByText("Linear Algebra")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Wiki title"), "New Page");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(onCreate).toHaveBeenCalledWith({ title: "New Page" });
  });

  it("fires onSelect", async () => {
    const onSelect = vi.fn();
    render(
      <WikiExplorer
        pages={[makeWiki({ id: "w1", title: "Stats" })]}
        selectedId={null}
        onSelect={onSelect}
        onCreate={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("Stats"));
    expect(onSelect).toHaveBeenCalledWith("w1");
  });

  it("shows an empty state", () => {
    render(<WikiExplorer pages={[]} selectedId={null} onSelect={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText("No wiki pages")).toBeInTheDocument();
  });
});

describe("WikiPageView", () => {
  it("renders the page body, slug + references", () => {
    render(
      <WikiPageView
        page={makeWiki({ title: "Linear Algebra", content: "Foundational [[Machine Learning]]." })}
        backlinks={{ backlinks: [], unresolved: [], orphan: true }}
      />,
    );
    expect(screen.getByText("Linear Algebra")).toBeInTheDocument();
    expect(screen.getByText(/Slug:/)).toBeInTheDocument();
    expect(screen.getByText("[[Machine Learning]]")).toBeInTheDocument();
  });
});

describe("ReadingTracker", () => {
  it("adds a book", async () => {
    const onAdd = vi.fn();
    render(<ReadingTracker books={[]} onAdd={onAdd} onFinish={vi.fn()} onAdvance={vi.fn()} />);
    await userEvent.type(screen.getByLabelText("Book title"), "DL");
    await userEvent.type(screen.getByLabelText("Total pages"), "800");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onAdd).toHaveBeenCalledWith({ title: "DL", totalPages: 800 });
  });
  it("lists books", () => {
    render(
      <ReadingTracker
        books={[makeBook({ title: "Deep Learning" })]}
        onAdd={vi.fn()}
        onFinish={vi.fn()}
        onAdvance={vi.fn()}
      />,
    );
    expect(screen.getByText("Deep Learning")).toBeInTheDocument();
  });
  it("shows an empty state", () => {
    render(<ReadingTracker books={[]} onAdd={vi.fn()} onFinish={vi.fn()} onAdvance={vi.fn()} />);
    expect(screen.getByText("No books yet")).toBeInTheDocument();
  });
});

describe("LearningWorkspace", () => {
  it("adds a course", async () => {
    const onAdd = vi.fn();
    render(
      <LearningWorkspace courses={[]} onAdd={onAdd} onComplete={vi.fn()} onAdvance={vi.fn()} />,
    );
    await userEvent.type(screen.getByLabelText("Course title"), "CS229");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onAdd).toHaveBeenCalledWith({ title: "CS229", totalModules: 0 });
  });
  it("lists courses", () => {
    render(
      <LearningWorkspace
        courses={[makeCourse({ title: "CS229" })]}
        onAdd={vi.fn()}
        onComplete={vi.fn()}
        onAdvance={vi.fn()}
      />,
    );
    expect(screen.getByText("CS229")).toBeInTheDocument();
  });
});

describe("FlashcardDeck", () => {
  it("adds a deck + shows state counts", async () => {
    const onAddDeck = vi.fn();
    render(
      <FlashcardDeck
        decks={[{ id: "d1", title: "Deck A" }]}
        cards={[makeDeckCard({ deckId: "d1", state: "review" })]}
        onAddDeck={onAddDeck}
        onAddCard={vi.fn()}
      />,
    );
    expect(screen.getByText("Deck A")).toBeInTheDocument();
    expect(screen.getByText(/1 review/)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Deck title"), "New Deck");
    await userEvent.click(screen.getByRole("button", { name: "Add deck" }));
    expect(onAddDeck).toHaveBeenCalledWith("New Deck");
  });
});

describe("ResearchWorkspace", () => {
  it("adds research", async () => {
    const onAdd = vi.fn();
    render(<ResearchWorkspace research={[]} onAdd={onAdd} />);
    await userEvent.type(screen.getByLabelText("Research title"), "RAG");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onAdd).toHaveBeenCalledWith({ title: "RAG" });
  });
  it("lists research with status", () => {
    render(
      <ResearchWorkspace
        research={[makeResearch({ title: "RAG", status: "in_progress" })]}
        onAdd={vi.fn()}
      />,
    );
    expect(screen.getByText("RAG")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });
});

describe("NoteViewer markdown", () => {
  it("renders code fences + lists", () => {
    render(<NoteViewer note={makeNoteWith("```\ncode\n```\n- item one\n- item two")} />);
    expect(screen.getByText("code")).toBeInTheDocument();
    expect(screen.getByText("item one")).toBeInTheDocument();
  });
});

function makeNoteWith(content: string) {
  return {
    id: "n",
    title: "T",
    content,
    tags: [],
    linkedTitles: [],
    archived: false,
    pinned: false,
    createdAt: "2026-07-10T00:00:00Z",
    updatedAt: "2026-07-10T00:00:00Z",
  };
}
