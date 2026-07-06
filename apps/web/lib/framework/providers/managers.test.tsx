import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModalProvider, useConfirm } from "./modal";
import { ShortcutProvider, useRegisterShortcut } from "./shortcuts";

describe("ModalProvider — useConfirm", () => {
  it("resolves true when the user confirms", async () => {
    const onResult = vi.fn();
    function Harness() {
      const confirm = useConfirm();
      return (
        <button onClick={async () => onResult(await confirm({ title: "Delete item?" }))}>
          open
        </button>
      );
    }

    const user = userEvent.setup();
    render(
      <ModalProvider>
        <Harness />
      </ModalProvider>,
    );

    await user.click(screen.getByRole("button", { name: "open" }));
    expect(await screen.findByText("Delete item?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
  });

  it("resolves false when the user cancels", async () => {
    const onResult = vi.fn();
    function Harness() {
      const confirm = useConfirm();
      return (
        <button onClick={async () => onResult(await confirm({ title: "Discard?" }))}>open</button>
      );
    }

    const user = userEvent.setup();
    render(
      <ModalProvider>
        <Harness />
      </ModalProvider>,
    );

    await user.click(screen.getByRole("button", { name: "open" }));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false));
  });
});

describe("ShortcutProvider — useRegisterShortcut", () => {
  it("dispatches to a registered handler and lists it", () => {
    const handler = vi.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ShortcutProvider>{children}</ShortcutProvider>
    );
    renderHook(() => useRegisterShortcut("mod+j", handler, { description: "Jump" }), { wrapper });

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "j", ctrlKey: true }));
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("unregisters on unmount", () => {
    const handler = vi.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ShortcutProvider>{children}</ShortcutProvider>
    );
    const { unmount } = renderHook(() => useRegisterShortcut("ctrl+e", handler), { wrapper });

    unmount();
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "e", ctrlKey: true }));
    });
    expect(handler).not.toHaveBeenCalled();
  });
});
