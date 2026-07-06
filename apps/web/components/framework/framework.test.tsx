import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "./error";
import { EMPTY_PRESETS, PageEmpty } from "./empty";
import { PageContainer, PageContent } from "./page";
import { Workspace } from "./workspace";
import { WorkspaceProvider } from "@/lib/framework/providers/workspace";

describe("AppErrorBoundary", () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  afterEach(() => spy.mockClear());

  it("renders the fallback when a child throws, then recovers on retry", async () => {
    let shouldThrow = true;
    function Boom() {
      if (shouldThrow) throw new Error("kaboom");
      return <p>recovered</p>;
    }

    const user = userEvent.setup();
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("kaboom")).toBeInTheDocument();

    shouldThrow = false;
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(screen.getByText("recovered")).toBeInTheDocument();
  });
});

describe("PageEmpty", () => {
  it("renders preset copy", () => {
    render(<PageEmpty preset="tasks" />);
    expect(screen.getByText(EMPTY_PRESETS.tasks.title)).toBeInTheDocument();
    expect(screen.getByText(EMPTY_PRESETS.tasks.description)).toBeInTheDocument();
  });

  it("lets explicit props override the preset", () => {
    render(<PageEmpty preset="notes" title="Custom title" />);
    expect(screen.getByText("Custom title")).toBeInTheDocument();
    expect(screen.queryByText(EMPTY_PRESETS.notes.title)).not.toBeInTheDocument();
  });
});

describe("layout primitives", () => {
  it("PageContainer + PageContent render children", () => {
    render(
      <PageContainer>
        <PageContent>hello page</PageContent>
      </PageContainer>,
    );
    expect(screen.getByText("hello page")).toBeInTheDocument();
  });

  it("Workspace renders inside the WorkspaceProvider", () => {
    render(
      <WorkspaceProvider>
        <Workspace>work area</Workspace>
      </WorkspaceProvider>,
    );
    expect(screen.getByText("work area")).toBeInTheDocument();
  });
});
