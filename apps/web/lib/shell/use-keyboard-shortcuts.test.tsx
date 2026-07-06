import { beforeEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";
import { useShellStore } from "./store";

function Harness() {
  useKeyboardShortcuts();
  return null;
}

describe("useKeyboardShortcuts", () => {
  beforeEach(() => {
    useShellStore.setState({ commandOpen: false, collapsed: false });
  });

  it("opens the Command Center on ⌘/Ctrl+K", () => {
    render(<Harness />);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
    expect(useShellStore.getState().commandOpen).toBe(true);
  });

  it("toggles the sidebar on ⌘/Ctrl+B", () => {
    render(<Harness />);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "b", ctrlKey: true }));
    expect(useShellStore.getState().collapsed).toBe(true);
  });

  it("ignores plain keys without a modifier", () => {
    render(<Harness />);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    expect(useShellStore.getState().commandOpen).toBe(false);
  });
});
