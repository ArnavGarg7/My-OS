import { beforeEach, describe, expect, it } from "vitest";
import { SIDEBAR_MAX_WIDTH, SIDEBAR_MIN_WIDTH, useShellStore } from "./store";

describe("shell store", () => {
  beforeEach(() => {
    useShellStore.setState({ collapsed: false, width: 236, commandOpen: false });
  });

  it("toggles the sidebar collapsed state", () => {
    expect(useShellStore.getState().collapsed).toBe(false);
    useShellStore.getState().toggleCollapsed();
    expect(useShellStore.getState().collapsed).toBe(true);
  });

  it("clamps the sidebar width to the min/max bounds", () => {
    useShellStore.getState().setWidth(9999);
    expect(useShellStore.getState().width).toBe(SIDEBAR_MAX_WIDTH);
    useShellStore.getState().setWidth(10);
    expect(useShellStore.getState().width).toBe(SIDEBAR_MIN_WIDTH);
  });

  it("toggles the command center open state", () => {
    useShellStore.getState().toggleCommand();
    expect(useShellStore.getState().commandOpen).toBe(true);
  });
});
