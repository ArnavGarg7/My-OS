import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "./switch";

describe("Switch", () => {
  it("exposes the switch role and toggles with the keyboard", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch aria-label="Notifications" onCheckedChange={onCheckedChange} />);

    const toggle = screen.getByRole("switch", { name: "Notifications" });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    toggle.focus();
    expect(toggle).toHaveFocus();
    await user.keyboard(" ");
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("does not toggle when disabled", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch aria-label="Notifications" disabled onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole("switch"));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});
