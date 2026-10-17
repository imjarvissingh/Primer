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

  it("lists both experiences, each a draft demo linking to its own route", () => {
    render(<Home />);
    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Block Builder");
    expect(items[1]).toHaveTextContent("Space Construction");
    items.forEach((item) => expect(item).toHaveTextContent("Draft demo"));
  });

  it("links only to interest choice, the two missions, and the check (the summary needs a finished session, so it is not linked bare), and has no forms (no data collection)", () => {
    render(<Home />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/welcome",
      "/block-builder",
      "/space-construction",
      "/assessment",
    ]);
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
