import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field } from "./field";
import { Input } from "./input";

describe("Field", () => {
  it("associates the label with the control", () => {
    render(
      <Field label="Email">
        <Input placeholder="you@example.com" />
      </Field>,
    );
    const input = screen.getByLabelText("Email");
    expect(input).toBeInTheDocument();
  });

  it("wires aria-invalid and aria-describedby to the error message", () => {
    render(
      <Field label="Email" error="Required">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const describedBy = input.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(screen.getByText("Required")).toHaveAttribute("id", describedBy);
  });

  it("marks required fields", () => {
    render(
      <Field label="Name" required>
        <Input />
      </Field>,
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });
});
