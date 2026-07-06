import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommandCenterProvider, useRegisterGroups, type CommandGroup } from "@/lib/command-center";
import { useShellStore } from "@/lib/shell/store";
import { CommandPalette } from "./command-palette";

const execAlpha = vi.fn();
const execBravo = vi.fn();
const execCharlie = vi.fn();

// Stable module-level group so the registration effect doesn't re-run.
const GROUPS: CommandGroup[] = [
  {
    id: "test",
    title: "Test Group",
    category: "system",
    commands: [
      {
        id: "t:alpha",
        title: "Alpha",
        category: "system",
        execute: (c) => (c.close(), execAlpha()),
      },
      {
        id: "t:bravo",
        title: "Bravo",
        category: "system",
        execute: (c) => (c.close(), execBravo()),
      },
      {
        id: "t:charlie",
        title: "Charlie",
        category: "system",
        enabled: () => false,
        execute: () => execCharlie(),
      },
    ],
  },
];

function Harness() {
  useRegisterGroups(GROUPS);
  return null;
}

function setup() {
  return render(
    <CommandCenterProvider>
      <Harness />
      <CommandPalette />
    </CommandCenterProvider>,
  );
}

describe("CommandPalette", () => {
  beforeEach(() => {
    execAlpha.mockClear();
    execBravo.mockClear();
    execCharlie.mockClear();
    useShellStore.setState({ commandOpen: true });
  });

  it("renders the category header and its commands when open", async () => {
    setup();
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Group")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Bravo")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("filters with case-insensitive contains()", async () => {
    const user = userEvent.setup();
    setup();
    const input = await screen.findByRole("combobox");
    await user.type(input, "BRAV");
    // Title is split into highlighted segments; assert on the remaining option.
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Bravo");
  });

  it("executes the active command with Enter and closes", async () => {
    const user = userEvent.setup();
    setup();
    const input = await screen.findByRole("combobox");
    input.focus();
    await user.keyboard("{Enter}");
    expect(execAlpha).toHaveBeenCalledTimes(1);
    expect(useShellStore.getState().commandOpen).toBe(false);
  });

  it("navigates with ArrowDown before executing", async () => {
    const user = userEvent.setup();
    setup();
    const input = await screen.findByRole("combobox");
    input.focus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(execBravo).toHaveBeenCalledTimes(1);
    expect(execAlpha).not.toHaveBeenCalled();
  });

  it("does not execute a disabled command", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(await screen.findByText("Charlie"));
    expect(execCharlie).not.toHaveBeenCalled();
  });
});
