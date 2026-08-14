import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContactFormModal } from "./contact-form-modal";
import { ContactFieldError } from "@/lib/contact-form-errors";

describe("ContactFormModal validation (T14)", () => {
  it("blocks submission and shows errors when required fields are empty", async () => {
    const onSubmit = vi.fn();

    render(
      <ContactFormModal open onOpenChange={vi.fn()} mode="create" existingEmails={new Set()} onSubmit={onSubmit} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Branch is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("rejects an invalid email format without calling onSubmit", async () => {
    const onSubmit = vi.fn();

    render(
      <ContactFormModal open onOpenChange={vi.fn()} mode="create" existingEmails={new Set()} onSubmit={onSubmit} />
    );

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ada Lovelace" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByLabelText("Branch"), { target: { value: "London" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("preserves entered values after a validation error", async () => {
    render(
      <ContactFormModal open onOpenChange={vi.fn()} mode="create" existingEmails={new Set()} onSubmit={vi.fn()} />
    );

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ada Lovelace" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Name")).toHaveValue("Ada Lovelace");
    expect(screen.getByLabelText("Email")).toHaveValue("not-an-email");
  });

  it("submits and closes the modal when all fields are valid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <ContactFormModal open onOpenChange={onOpenChange} mode="create" existingEmails={new Set()} onSubmit={onSubmit} />
    );

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ada Lovelace" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByLabelText("Branch"), { target: { value: "London" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Ada Lovelace",
        email: "ada@example.com",
        branch: "London",
      });
    });
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("maps a server-side field error onto the form without closing", async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ContactFieldError("email", "A contact with this email already exists"));
    const onOpenChange = vi.fn();

    render(
      <ContactFormModal open onOpenChange={onOpenChange} mode="create" existingEmails={new Set()} onSubmit={onSubmit} />
    );

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Ada Lovelace" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByLabelText("Branch"), { target: { value: "London" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("A contact with this email already exists")).toBeInTheDocument();
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByLabelText("Email")).toHaveValue("ada@example.com");
  });
});
