import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ContactPagination } from "./contact-pagination";

describe("ContactPagination", () => {
  it("renders nothing when totalPages is 1 or fewer", () => {
    const { container } = render(<ContactPagination page={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the current page indicator", () => {
    render(<ContactPagination page={2} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
  });

  it("disables Previous on the first page and calls onPageChange with the previous page otherwise", () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<ContactPagination page={1} totalPages={3} onPageChange={onPageChange} />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

    rerender(<ContactPagination page={2} totalPages={3} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("disables Next on the last page and calls onPageChange with the next page otherwise", () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<ContactPagination page={3} totalPages={3} onPageChange={onPageChange} />);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    rerender(<ContactPagination page={2} totalPages={3} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
