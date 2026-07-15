import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeNotification } from "@myos/core/notification";
import type { NotificationHistoryEntry } from "@myos/core/notification";
import { NotificationCard } from "./NotificationCard";
import { NotificationList } from "./NotificationList";
import { NotificationFilters } from "./NotificationFilters";
import { NotificationHistory } from "./NotificationHistory";
import {
  PRIORITY_BADGE,
  PRIORITY_LABEL,
  PRIORITY_TONE,
  TYPE_ICON,
  TYPE_LABEL,
} from "./notification-icons";

// next/link + next/navigation stubs for card rendering.
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("notification-icons maps", () => {
  it("labels every type", () => {
    expect(TYPE_LABEL.reminder).toBe("Reminder");
    expect(TYPE_LABEL.finance).toBe("Finance");
    expect(Object.keys(TYPE_ICON)).toHaveLength(13);
  });
  it("maps priority to badge + tone + label", () => {
    expect(PRIORITY_BADGE.critical).toBe("danger");
    expect(PRIORITY_TONE.high).toContain("warning");
    expect(PRIORITY_LABEL.medium).toBe("Medium");
  });
});

describe("NotificationCard", () => {
  const n = makeNotification({
    title: "Meeting in 5 min",
    reason: "Standup soon",
    priority: "high",
    sourceHref: "/calendar",
  });

  it("renders title, reason, priority", () => {
    render(
      <NotificationCard
        notification={n}
        onComplete={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
      />,
    );
    expect(screen.getByText("Meeting in 5 min")).toBeInTheDocument();
    expect(screen.getByText("Standup soon")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });

  it("fires complete/snooze/dismiss", async () => {
    const onComplete = vi.fn();
    const onSnooze = vi.fn();
    const onDismiss = vi.fn();
    render(
      <NotificationCard
        notification={n}
        onComplete={onComplete}
        onDismiss={onDismiss}
        onSnooze={onSnooze}
      />,
    );
    await userEvent.click(screen.getByText("Complete"));
    await userEvent.click(screen.getByText("Snooze"));
    await userEvent.click(screen.getByText("Dismiss"));
    expect(onComplete).toHaveBeenCalledWith(n.id);
    expect(onSnooze).toHaveBeenCalledWith(n.id);
    expect(onDismiss).toHaveBeenCalledWith(n.id);
  });

  it("shows an open-source link when href present", () => {
    render(
      <NotificationCard
        notification={n}
        onComplete={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
      />,
    );
    expect(screen.getByText("Open").closest("a")).toHaveAttribute("href", "/calendar");
  });

  it("hides the open link when no href", () => {
    render(
      <NotificationCard
        notification={makeNotification({ sourceHref: null })}
        onComplete={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
      />,
    );
    expect(screen.queryByText("Open")).not.toBeInTheDocument();
  });
});

describe("NotificationList", () => {
  it("renders cards for each notification", () => {
    render(
      <NotificationList
        notifications={[
          makeNotification({ id: "a", title: "First" }),
          makeNotification({ id: "b", title: "Second" }),
        ]}
        onComplete={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
      />,
    );
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    render(
      <NotificationList
        notifications={[]}
        onComplete={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
        emptyLabel="Nothing here"
      />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});

describe("NotificationFilters", () => {
  it("renders all filters and fires onChange", async () => {
    const onChange = vi.fn();
    render(<NotificationFilters filter="active" onChange={onChange} />);
    for (const label of ["Active", "Unread", "Queued", "All"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    await userEvent.click(screen.getByText("Unread"));
    expect(onChange).toHaveBeenCalledWith("unread");
  });
});

describe("NotificationHistory", () => {
  const entries: NotificationHistoryEntry[] = [
    {
      id: "h1",
      notificationId: "n1",
      status: "delivered",
      at: "2026-07-15T12:00:00Z",
      note: "banner",
    },
    { id: "h2", notificationId: "n1", status: "completed", at: "2026-07-15T12:05:00Z" },
  ];
  it("lists status transitions", () => {
    render(<NotificationHistory entries={entries} />);
    expect(screen.getByText("delivered")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
  });
  it("shows an empty state", () => {
    render(<NotificationHistory entries={[]} />);
    expect(screen.getByText(/No notification history/)).toBeInTheDocument();
  });
});
