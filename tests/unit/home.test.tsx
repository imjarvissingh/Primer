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

  it("lists both experiences: Block Builder as a draft demo, Space Construction as planned", () => {
    render(<Home />);
    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Block Builder");
    expect(items[0]).toHaveTextContent("Draft demo");
    expect(items[1]).toHaveTextContent("Space Construction");
    expect(items[1]).toHaveTextContent("Planned — not yet available");
  });

  it("links only to the Block Builder demo and has no forms (no data collection)", () => {
    render(<Home />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/block-builder");
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
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
