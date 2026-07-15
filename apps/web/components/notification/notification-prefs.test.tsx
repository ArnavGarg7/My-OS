import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { defaultPreferences, makeNotification } from "@myos/core/notification";
import { NotificationPreferences } from "./NotificationPreferences";
import { NotificationSettings } from "./NotificationSettings";
import { NotificationCard } from "./NotificationCard";
import { NotificationList } from "./NotificationList";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("NotificationPreferences", () => {
  it("renders global toggles", () => {
    render(<NotificationPreferences preferences={defaultPreferences()} onUpdate={vi.fn()} />);
    expect(screen.getByText("Do not disturb")).toBeInTheDocument();
    expect(screen.getByText("Quiet hours")).toBeInTheDocument();
    expect(screen.getByText("Weekend suppression")).toBeInTheDocument();
    expect(screen.getByText("Working hours only")).toBeInTheDocument();
  });

  it("toggles mute", async () => {
    const onUpdate = vi.fn();
    render(<NotificationPreferences preferences={defaultPreferences()} onUpdate={onUpdate} />);
    const muteRow = screen.getByText("Do not disturb").closest("label")!;
    await userEvent.click(muteRow.querySelector('[role="switch"]')!);
    expect(onUpdate).toHaveBeenCalledWith({ muted: true });
  });

  it("shows the quiet-hours window", () => {
    render(<NotificationPreferences preferences={defaultPreferences()} onUpdate={vi.fn()} />);
    expect(screen.getByText("22:00–07:00")).toBeInTheDocument();
  });

  it("lists every category", () => {
    render(<NotificationPreferences preferences={defaultPreferences()} onUpdate={vi.fn()} />);
    for (const label of ["Reminder", "Calendar", "Finance", "Focus", "Health"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("toggles a category", async () => {
    const onUpdate = vi.fn();
    render(<NotificationPreferences preferences={defaultPreferences()} onUpdate={onUpdate} />);
    const row = screen.getByText("Reminder").closest("label")!;
    await userEvent.click(row.querySelector('[role="switch"]')!);
    expect(onUpdate).toHaveBeenCalledWith({ category: { type: "reminder", enabled: false } });
  });
});

describe("NotificationSettings", () => {
  it("renders the channel matrix header", () => {
    render(<NotificationSettings preferences={defaultPreferences()} onUpdate={vi.fn()} />);
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("desktop")).toBeInTheDocument();
    expect(screen.getByText("push")).toBeInTheDocument();
  });

  it("toggles a channel checkbox", async () => {
    const onUpdate = vi.fn();
    render(<NotificationSettings preferences={defaultPreferences()} onUpdate={onUpdate} />);
    await userEvent.click(screen.getByLabelText("Reminder desktop"));
    expect(onUpdate).toHaveBeenCalledWith({ category: { type: "reminder", desktop: true } });
  });

  it("reflects existing channel state", () => {
    render(<NotificationSettings preferences={defaultPreferences()} onUpdate={vi.fn()} />);
    // calendar.sound defaults true
    expect((screen.getByLabelText("Calendar sound") as HTMLInputElement).checked).toBe(true);
  });
});

describe("NotificationCard priorities", () => {
  it("renders a critical badge", () => {
    render(
      <NotificationCard
        notification={makeNotification({ priority: "critical", title: "Urgent" })}
        onComplete={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
      />,
    );
    expect(screen.getByText("Critical")).toBeInTheDocument();
  });

  it("renders a low badge", () => {
    render(
      <NotificationCard
        notification={makeNotification({ priority: "low", title: "FYI" })}
        onComplete={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
      />,
    );
    expect(screen.getByText("Low")).toBeInTheDocument();
  });
});

describe("NotificationList ordering passthrough", () => {
  it("renders in the order given", () => {
    render(
      <NotificationList
        notifications={[
          makeNotification({ id: "a", title: "Alpha" }),
          makeNotification({ id: "b", title: "Beta" }),
          makeNotification({ id: "c", title: "Gamma" }),
        ]}
        onComplete={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
      />,
    );
    const titles = screen.getAllByText(/Alpha|Beta|Gamma/).map((el) => el.textContent);
    expect(titles).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  it("wires the snooze callback", async () => {
    const onSnooze = vi.fn();
    render(
      <NotificationList
        notifications={[makeNotification({ id: "a", title: "Alpha" })]}
        onComplete={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={onSnooze}
      />,
    );
    await userEvent.click(screen.getByText("Snooze"));
    expect(onSnooze).toHaveBeenCalledWith("a");
  });
});
