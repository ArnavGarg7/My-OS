import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { InboxItem } from "@myos/core/inbox";
import { InboxRow } from "./InboxRow";
import { InboxList } from "./InboxList";
import { InboxViewer } from "./InboxViewer";
import { InboxSearch } from "./InboxSearch";
import { InboxMetadata } from "./InboxMetadata";

function item(over: Partial<InboxItem> = {}): InboxItem {
  const iso = "2026-07-07T06:00:00.000Z";
  return {
    id: "i1",
    type: "note",
    title: "Buy milk",
    content: "grocery run",
    metadata: {},
    status: "new",
    source: "quick_add",
    capturedAt: iso,
    organizedAt: null,
    archivedAt: null,
    deletedAt: null,
    createdAt: iso,
    updatedAt: iso,
    ...over,
  };
}

describe("InboxRow", () => {
  it("renders the title + preview and fires onSelect", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<InboxRow item={item()} selected={false} onSelect={onSelect} />);
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("grocery run")).toBeInTheDocument();
    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("marks the selected row via aria-pressed", () => {
    render(<InboxRow item={item()} selected onSelect={() => {}} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("shows a status badge for non-new items", () => {
    render(<InboxRow item={item({ status: "archived" })} selected={false} onSelect={() => {}} />);
    expect(screen.getByText("archived")).toBeInTheDocument();
  });
});

describe("InboxList", () => {
  it("renders an empty state when there are no items", () => {
    render(<InboxList items={[]} selectedId={null} onSelect={() => {}} emptyLabel="All clear" />);
    expect(screen.getByText("All clear")).toBeInTheDocument();
  });

  it("renders one row per item", () => {
    render(
      <InboxList
        items={[item({ id: "1", title: "A" }), item({ id: "2", title: "B" })]}
        selectedId="1"
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});

describe("InboxViewer", () => {
  it("renders content and archives on click", async () => {
    const onArchive = vi.fn();
    const user = userEvent.setup();
    render(
      <InboxViewer
        item={item()}
        onArchive={onArchive}
        onDelete={() => {}}
        onRestore={() => {}}
        pending={false}
      />,
    );
    expect(screen.getByText("grocery run")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /archive/i }));
    expect(onArchive).toHaveBeenCalledOnce();
  });

  it("offers Restore for archived items", () => {
    render(
      <InboxViewer
        item={item({ status: "archived" })}
        onArchive={() => {}}
        onDelete={() => {}}
        onRestore={() => {}}
        pending={false}
      />,
    );
    expect(screen.getByRole("button", { name: /restore/i })).toBeInTheDocument();
  });
});

describe("InboxSearch", () => {
  it("emits typed text", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<InboxSearch value="" onChange={onChange} />);
    await user.type(screen.getByRole("searchbox"), "m");
    expect(onChange).toHaveBeenCalledWith("m");
  });
});

describe("InboxMetadata", () => {
  it("shows the url when present", () => {
    render(<InboxMetadata item={item({ type: "url", metadata: { url: "example.com/x" } })} />);
    expect(screen.getByText("example.com/x")).toBeInTheDocument();
  });
});
