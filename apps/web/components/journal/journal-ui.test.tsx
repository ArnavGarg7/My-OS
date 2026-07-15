import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { JournalEntry, Prompt } from "@myos/core/journal";
import { MoodTracker } from "./MoodTracker";
import { ListSection } from "./ListSection";
import { WinsSection } from "./WinsSection";
import { WritingWorkspace } from "./WritingWorkspace";
import { PromptSection } from "./PromptSection";
import { JournalSearch } from "./JournalSearch";
import { JournalViewer } from "./JournalViewer";
import { JournalHistory } from "./JournalHistory";
import { JournalEditor } from "./JournalEditor";
import { JournalQuickCapture } from "./JournalQuickCapture";
import { DailyReflection } from "./DailyReflection";
import { MoodTracker as _MT } from "./MoodTracker";

const iso = (h: number) => new Date(Date.UTC(2026, 6, 7, h)).toISOString();

function entry(over: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: "e1",
    title: "A good day",
    content: "Today I shipped the journal.",
    entryType: "daily",
    mood: "good",
    tags: ["work"],
    archived: false,
    links: [],
    createdAt: iso(9),
    updatedAt: iso(9),
    ...over,
  };
}

describe("MoodTracker", () => {
  it("selects a mood", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<MoodTracker value={null} onChange={onChange} />);
    await user.click(screen.getByLabelText("Excellent"));
    expect(onChange).toHaveBeenCalledWith("excellent");
  });

  it("marks the active mood via aria-pressed", () => {
    render(<MoodTracker value="good" onChange={() => {}} />);
    expect(screen.getByLabelText("Good")).toHaveAttribute("aria-pressed", "true");
  });

  it("renders all five moods", () => {
    render(<MoodTracker value={null} onChange={() => {}} />);
    for (const label of ["Very low", "Low", "Neutral", "Good", "Excellent"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });
});

describe("ListSection", () => {
  it("adds an item", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ListSection label="Wins" placeholder="add" items={[]} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("add"), "shipped");
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(["shipped"]);
  });

  it("removes an item", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ListSection label="Wins" placeholder="add" items={["one"]} onChange={onChange} />);
    await user.click(screen.getByLabelText("Remove one"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("renders existing items", () => {
    render(<WinsSection items={["shipped it"]} onChange={() => {}} />);
    expect(screen.getByText("• shipped it")).toBeInTheDocument();
  });

  it("does not add blank items", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ListSection label="Wins" placeholder="add" items={[]} onChange={onChange} />);
    await user.type(screen.getByPlaceholderText("add"), "   ");
    await user.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("WritingWorkspace", () => {
  it("shows a live word count", () => {
    render(<WritingWorkspace value="one two three" onChange={() => {}} />);
    expect(screen.getByText(/3 words/)).toBeInTheDocument();
  });

  it("emits typed text", () => {
    const onChange = vi.fn();
    render(<WritingWorkspace value="" onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("Write freely…"), { target: { value: "hi" } });
    expect(onChange).toHaveBeenCalledWith("hi");
  });

  it("shows reading time", () => {
    render(<WritingWorkspace value="a b c" onChange={() => {}} />);
    expect(screen.getByText(/1 min read/)).toBeInTheDocument();
  });
});

describe("PromptSection", () => {
  const prompts: Prompt[] = [{ id: "m-0", context: "morning", text: "What is today's intention?" }];

  it("renders prompts and picks one", async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    render(<PromptSection prompts={prompts} onPick={onPick} />);
    await user.click(screen.getByText("What is today's intention?"));
    expect(onPick).toHaveBeenCalledWith("What is today's intention?");
  });

  it("renders nothing without prompts", () => {
    const { container } = render(<PromptSection prompts={[]} onPick={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("JournalSearch", () => {
  it("emits typed input", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<JournalSearch value="" onChange={onChange} />);
    await user.type(screen.getByLabelText("Search journal"), "x");
    expect(onChange).toHaveBeenCalled();
  });
});

describe("JournalViewer", () => {
  it("renders title, content and tags", () => {
    render(<JournalViewer entry={entry()} onArchive={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("A good day")).toBeInTheDocument();
    expect(screen.getByText("Today I shipped the journal.")).toBeInTheDocument();
    expect(screen.getByText("#work")).toBeInTheDocument();
  });

  it("fires archive + delete", async () => {
    const onArchive = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<JournalViewer entry={entry()} onArchive={onArchive} onDelete={onDelete} />);
    await user.click(screen.getByLabelText("Archive entry"));
    await user.click(screen.getByLabelText("Delete entry"));
    expect(onArchive).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("falls back to Untitled entry", () => {
    render(<JournalViewer entry={entry({ title: "" })} onArchive={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Untitled entry")).toBeInTheDocument();
  });

  it("shows a word/reading readout", () => {
    render(<JournalViewer entry={entry()} onArchive={() => {}} onDelete={() => {}} />);
    expect(screen.getByText(/min read/)).toBeInTheDocument();
  });
});

describe("JournalHistory", () => {
  it("shows an empty state", () => {
    render(<JournalHistory entries={[]} selectedId={null} onSelect={() => {}} />);
    expect(screen.getByText("Nothing written yet")).toBeInTheDocument();
  });

  it("renders + selects entries", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <JournalHistory
        entries={[entry({ id: "a", title: "First" }), entry({ id: "b", title: "Second" })]}
        selectedId="a"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText("Second")).toBeInTheDocument();
    await user.click(screen.getByText("First"));
    expect(onSelect).toHaveBeenCalledWith("a");
  });
});

describe("JournalEditor", () => {
  it("saves a composed entry", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<JournalEditor onSave={onSave} />);
    await user.type(screen.getByLabelText("Entry title"), "My day");
    await user.click(screen.getByRole("button", { name: /save entry/i }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ title: "My day", entryType: "daily" }),
    );
  });

  it("parses tags from the tags input", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<JournalEditor onSave={onSave} />);
    await user.type(screen.getByLabelText("Entry title"), "t");
    await user.type(screen.getByLabelText("Tags"), "#work #focus");
    await user.click(screen.getByRole("button", { name: /save entry/i }));
    expect(onSave.mock.calls[0]?.[0].tags).toEqual(["work", "focus"]);
  });

  it("disables save when empty", () => {
    render(<JournalEditor onSave={() => {}} />);
    expect(screen.getByRole("button", { name: /save entry/i })).toBeDisabled();
  });

  it("seeds content from a prompt", () => {
    render(<JournalEditor seed="What is today's intention?" onSave={() => {}} />);
    expect(screen.getByDisplayValue(/What is today's intention/)).toBeInTheDocument();
  });
});

describe("JournalQuickCapture", () => {
  it("parses a capture with a mood directive", async () => {
    const onCapture = vi.fn();
    const user = userEvent.setup();
    render(<JournalQuickCapture onCapture={onCapture} />);
    await user.type(screen.getByLabelText("Quick journal capture"), "Rough day /mood low");
    await user.keyboard("{Enter}");
    expect(onCapture).toHaveBeenCalledWith(expect.objectContaining({ mood: "low" }));
  });
});

describe("DailyReflection", () => {
  it("saves a reflection draft", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<DailyReflection onSave={onSave} />);
    await user.type(screen.getByPlaceholderText("How did today go?"), "Good day");
    await user.click(screen.getByRole("button", { name: /save reflection/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ reflection: "Good day" }));
  });
});

void _MT;
