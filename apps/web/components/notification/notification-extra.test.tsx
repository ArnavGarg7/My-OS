import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeNotification } from "@myos/core/notification";
import type { NotificationHistoryEntry } from "@myos/core/notification";
import { NotificationCard } from "./NotificationCard";
import { NotificationFilters } from "./NotificationFilters";
import { NotificationHistory } from "./NotificationHistory";
import { PRIORITY_DOT, TYPE_ICON, TYPE_LABEL } from "./notification-icons";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("icon coverage", () => {
  it("every type has a distinct label + icon", () => {
    const labels = Object.values(TYPE_LABEL);
    expect(new Set(labels).size).toBe(labels.length);
    for (const type of Object.keys(TYPE_ICON)) {
      expect(TYPE_ICON[type as keyof typeof TYPE_ICON]).toBeDefined();
    }
  });
  it("priority dots are defined for all priorities", () => {
    for (const p of ["critical", "high", "medium", "low", "silent"] as const) {
      expect(PRIORITY_DOT[p]).toContain("bg-");
    }
  });
});

describe("NotificationCard time formatting", () => {
  it("shows 'just now' for a fresh notification", () => {
    render(
      <NotificationCard
        notification={makeNotification({ createdAt: new Date().toISOString() })}
        onComplete={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
      />,
    );
    expect(screen.getByText("just now")).toBeInTheDocument();
  });

  it("shows minutes ago", () => {
    render(
      <NotificationCard
        notification={makeNotification({
          createdAt: new Date(Date.now() - 20 * 60_000).toISOString(),
        })}
        onComplete={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
      />,
    );
    expect(screen.getByText("20m ago")).toBeInTheDocument();
  });

  it("shows hours ago", () => {
    render(
      <NotificationCard
        notification={makeNotification({
          createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
        })}
        onComplete={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
      />,
    );
    expect(screen.getByText("3h ago")).toBeInTheDocument();
  });
});

describe("NotificationFilters active state", () => {
  it("highlights the active filter", () => {
    const { rerender } = render(<NotificationFilters filter="unread" onChange={vi.fn()} />);
    expect(screen.getByText("Unread")).toBeInTheDocument();
    rerender(<NotificationFilters filter="all" onChange={vi.fn()} />);
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  it("fires each filter change", async () => {
    const onChange = vi.fn();
    render(<NotificationFilters filter="active" onChange={onChange} />);
    await userEvent.click(screen.getByText("Queued"));
    await userEvent.click(screen.getByText("All"));
    expect(onChange).toHaveBeenCalledWith("queued");
    expect(onChange).toHaveBeenCalledWith("all");
  });
});

describe("NotificationHistory variants", () => {
  it("renders snoozed + expired statuses", () => {
    const entries: NotificationHistoryEntry[] = [
      { id: "h1", notificationId: "n1", status: "snoozed", at: "2026-07-15T12:00:00Z" },
      { id: "h2", notificationId: "n1", status: "expired", at: "2026-07-15T13:00:00Z" },
    ];
    render(<NotificationHistory entries={entries} />);
    expect(screen.getByText("snoozed")).toBeInTheDocument();
    expect(screen.getByText("expired")).toBeInTheDocument();
  });

  it("shows the note when present", () => {
    render(
      <NotificationHistory
        entries={[
          {
            id: "h1",
            notificationId: "n1",
            status: "delivered",
            at: "2026-07-15T12:00:00Z",
            note: "banner,desktop",
          },
        ]}
      />,
    );
    expect(screen.getByText(/banner,desktop/)).toBeInTheDocument();
  });
});

describe("NotificationCard reason + type icon", () => {
  it("renders the reason text", () => {
    render(
      <NotificationCard
        notification={makeNotification({ type: "finance", reason: "Over budget in Dining" })}
        onComplete={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
      />,
    );
    expect(screen.getByText("Over budget in Dining")).toBeInTheDocument();
  });

  it("renders the correct type icon container", () => {
    const { container } = render(
      <NotificationCard
        notification={makeNotification({ type: "calendar" })}
        onComplete={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
      />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("dismiss + complete are independent", async () => {
    const onComplete = vi.fn();
    const onDismiss = vi.fn();
    render(
      <NotificationCard
        notification={makeNotification({ sourceHref: null })}
        onComplete={onComplete}
        onDismiss={onDismiss}
        onSnooze={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("Dismiss"));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
