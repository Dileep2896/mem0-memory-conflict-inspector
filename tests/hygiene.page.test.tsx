import { describe, it, expect } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HygieneInspector } from "@/components/hygiene/inspector";

const score = () => Number(screen.getByRole("meter", { name: /health score/i }).getAttribute("aria-valuenow"));
const count = () => Number(screen.getByTestId("cluster-count").textContent);

describe("/hygiene inspector", () => {
  it("renders sam's health score and clusters", () => {
    render(<HygieneInspector />);
    expect(score()).toBe(67);
    expect(count()).toBe(5);
    expect(screen.getByRole("heading", { name: /memory hygiene/i })).toBeInTheDocument();
  });

  it("shows a before/after recall diff for the selected cluster's probe", () => {
    render(<HygieneInspector />);
    const probe = screen.getByLabelText(/probe query/i) as HTMLInputElement;
    expect(probe.value).toBe("Where does Sam live?");
    const before = screen.getByTestId("recall-before");
    const after = screen.getByTestId("recall-after");
    expect(within(before).getByText(/Lisbon/)).toBeInTheDocument();
    expect(within(after).queryByText(/Lisbon/)).toBeNull();
    expect(within(after).getByText(/Berlin now/)).toBeInTheDocument();
  });

  it("supersede lowers the cluster count and raises the score; undo restores both", async () => {
    const user = userEvent.setup();
    render(<HygieneInspector />);
    await user.click(screen.getByRole("button", { name: /^supersede/i }));
    expect(count()).toBe(4);
    expect(score()).toBeGreaterThan(67);
    await user.click(screen.getByRole("button", { name: /undo/i }));
    expect(count()).toBe(5);
    expect(score()).toBe(67);
  });

  it("asks for confirmation before deleting", async () => {
    const user = userEvent.setup();
    render(<HygieneInspector />);
    await user.click(screen.getByRole("button", { name: /^delete/i }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/permanently/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: /delete 1 memory/i }));
    expect(count()).toBe(4);
  });

  it("filters by kind and switches entity", async () => {
    const user = userEvent.setup();
    render(<HygieneInspector />);
    await user.click(screen.getByRole("tab", { name: /duplicates/i }));
    // exiting items animate out before they leave the DOM
    await waitFor(() => expect(screen.getAllByTestId("cluster-item")).toHaveLength(1));
    await user.click(screen.getByRole("radio", { name: /priya/i }));
    expect(score()).toBe(60);
  });

  it("shows the all-clean state after resolving everything", async () => {
    const user = userEvent.setup();
    render(<HygieneInspector />);
    await user.click(screen.getByRole("radio", { name: /lee/i }));
    for (let i = 0; i < 3; i++) await user.click(screen.getByRole("button", { name: /apply suggested/i }));
    expect(score()).toBe(100);
    expect(screen.getByText(/all clean/i)).toBeInTheDocument();
  });
});
