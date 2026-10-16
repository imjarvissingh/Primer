import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { ExperienceCard } from "@/components/ExperienceCard";

describe("Home page", () => {
  it("has a single top-level Primer heading", () => {
    render(<Home />);
    expect(
      screen.getAllByRole("heading", { level: 1 }).map((h) => h.textContent),
    ).toEqual(["Primer"]);
  });

  it("lists both planned experiences, marked as not yet available", () => {
    render(<Home />);
    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Block Builder");
    expect(items[1]).toHaveTextContent("Space Construction");
    items.forEach((item) =>
      expect(item).toHaveTextContent("Planned — not yet available"),
    );
  });

  it("offers no interactive controls or forms (no data collection)", () => {
    render(<Home />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});

describe("ExperienceCard", () => {
  it("renders the given name and description", () => {
    render(
      <ul>
        <ExperienceCard name="Test Theme" description="A test description." />
      </ul>,
    );
    expect(
      screen.getByRole("heading", { level: 3, name: "Test Theme" }),
    ).toBeInTheDocument();
    expect(screen.getByText("A test description.")).toBeInTheDocument();
  });
});
