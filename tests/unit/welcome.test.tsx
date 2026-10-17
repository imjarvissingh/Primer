import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import WelcomePage from "@/app/welcome/page";
import { INTERESTS } from "@/interests";

async function toChooser() {
  const user = userEvent.setup();
  render(<WelcomePage />);
  await user.click(screen.getByRole("button", { name: "Choose an interest" }));
  return user;
}

describe("Welcome: parent introduction", () => {
  it("explains Primer and keeps every required disclosure visible", () => {
    render(<WelcomePage />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(
      /what your child loves/i,
    );
    for (const h of ["What is Primer?", "Who is it for?", "What do you do?"]) {
      expect(screen.getByRole("heading", { name: h })).toBeInTheDocument();
    }
    const box = screen.getByTestId("disclosures");
    for (const phrase of [
      /draft demonstration/i,
      /qualified educator/i,
      /made-up demonstration data/i,
      /not ready for children to use on their own/i,
      /Nothing here shows that Primer improves learning/i,
    ]) {
      expect(within(box).getByText(phrase)).toBeVisible();
    }
    expect(screen.getByTestId("draft-banner")).toBeVisible();
  });

  it("explains in plain words how Primer works, without claiming results", () => {
    render(<WelcomePage />);
    const how = screen.getByTestId("how-it-works");
    expect(within(how).getAllByRole("listitem")).toHaveLength(5);
    for (const phrase of [
      /chooses/i,
      /math does not/i,
      /not a test/i,
      /independent check is different/i,
      /limited evidence, not mastery/i,
    ]) {
      expect(within(how).getByText(phrase, { exact: false })).toBeVisible();
    }
    expect(how.textContent).not.toMatch(
      /improv|proven|learn(s|ed) faster|mastered|progress (chart|over time report)/i,
    );
  });

  it("asks for no personal information and has no text inputs", () => {
    render(<WelcomePage />);
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(document.querySelectorAll("form, input").length).toBe(0);
  });
});

describe("Welcome: choosing an interest", () => {
  it("shows five interests plus Surprise me as one radio group, none chosen at first", async () => {
    await toChooser();
    const group = screen.getByRole("group", { name: "Choose an interest" });
    const radios = within(group).getAllByRole("radio");
    expect(radios.map((r) => r.getAttribute("value"))).toEqual([
      "cricket",
      "building",
      "space",
      "basketball",
      "soccer",
      "surprise",
    ]);
    radios.forEach((r) => expect(r).not.toBeChecked());
    expect(
      screen.getByRole("button", { name: /adventure preview/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("heading", { level: 1, name: "What do you love?" }),
    ).toBeInTheDocument();
  });

  it("gives each option an accessible name and description", async () => {
    await toChooser();
    for (const i of INTERESTS) {
      const radio = screen.getByRole("radio", { name: new RegExp(i.title) });
      expect(radio).toHaveAccessibleDescription(i.cardLine);
    }
  });

  it("expresses selection as checked state, and changing it moves the state", async () => {
    const user = await toChooser();
    await user.click(screen.getByRole("radio", { name: /Cricket/ }));
    expect(screen.getByRole("radio", { name: /Cricket/ })).toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent("Selected: Cricket.");
    await user.click(screen.getByRole("radio", { name: /Soccer/ }));
    expect(screen.getByRole("radio", { name: /Cricket/ })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /Soccer/ })).toBeChecked();
    expect(
      screen.getByRole("button", { name: /adventure preview/i }),
    ).toBeEnabled();
  });

  it("supports keyboard selection with arrow keys", async () => {
    const user = await toChooser();
    await user.tab();
    await user.keyboard(" ");
    const first = screen.getByRole("radio", { name: /Cricket/ });
    expect(first).toBeChecked();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: /Building/ })).toBeChecked();
  });

  it("goes back to the introduction", async () => {
    const user = await toChooser();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(
      screen.getByRole("button", { name: "Choose an interest" }),
    ).toBeInTheDocument();
  });
});

describe("Welcome: adventure previews", () => {
  it.each(INTERESTS)(
    "$title preview tells its own story with the shared 13 − 5 question",
    async (i) => {
      const user = await toChooser();
      await user.click(
        screen.getByRole("radio", { name: new RegExp(i.title) }),
      );
      await user.click(
        screen.getByRole("button", { name: /adventure preview/i }),
      );
      expect(
        screen.getByRole("heading", { level: 1, name: i.worldName }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("story").textContent).toContain(
        i.resourceNoun.split(" ").slice(-1)[0],
      );
      expect(screen.getByTestId("story").textContent!.match(/\d+/g)).toEqual([
        "13",
        "5",
      ]);
      expect(screen.getByTestId("question")).toHaveTextContent(i.question);
      expect(screen.getByTestId("number-sentence")).toHaveTextContent(
        "13 − 5 = ?",
      );
      // No answer is ever shown.
      expect(document.body.textContent).not.toMatch(/=\s*8\b|\b8 remain/);
      // No fabricated progress.
      expect(document.body.textContent).not.toMatch(
        /streak|points|score|level up|great job|mastery achieved/i,
      );
    },
  );

  it("offers a real Start link for every one of the five interests, and never says 'not playable'", async () => {
    const user = await toChooser();
    for (const [title, href] of [
      ["Cricket", "/cricket"],
      ["Building", "/block-builder"],
      ["Space", "/space-construction"],
      ["Basketball", "/basketball"],
      ["Soccer", "/soccer"],
    ]) {
      await user.click(screen.getByRole("radio", { name: new RegExp(title) }));
      await user.click(
        screen.getByRole("button", { name: /adventure preview/i }),
      );
      const box = screen.getByTestId("availability");
      expect(
        within(box).getByRole("link", {
          name: `Start the ${title.toLowerCase()} mission`,
        }),
      ).toHaveAttribute("href", href);
      expect(within(box).getAllByRole("link")).toHaveLength(1);
      expect(document.body).not.toHaveTextContent(/not playable|preview only/i);
      await user.click(screen.getByRole("button", { name: "Change interest" }));
    }
  });

  it("keeps the choice when going back, and lets it change", async () => {
    const user = await toChooser();
    await user.click(screen.getByRole("radio", { name: /Space/ }));
    await user.click(
      screen.getByRole("button", { name: /adventure preview/i }),
    );
    await user.click(screen.getByRole("button", { name: "Change interest" }));
    expect(screen.getByRole("radio", { name: /Space/ })).toBeChecked();
    await user.click(screen.getByRole("radio", { name: /Basketball/ }));
    await user.click(
      screen.getByRole("button", { name: /adventure preview/i }),
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Basketball Challenge" }),
    ).toBeInTheDocument();
  });

  it("Surprise me lands on a real interest and says it was picked by Primer", async () => {
    const user = await toChooser();
    await user.click(screen.getByRole("radio", { name: /Surprise me/ }));
    await user.click(
      screen.getByRole("button", { name: /adventure preview/i }),
    );
    expect(screen.getByTestId("surprise-note")).toHaveTextContent(
      /Primer picked .* for you/,
    );
    const h1 = screen.getByRole("heading", { level: 1 }).textContent;
    expect(INTERESTS.map((i) => i.worldName)).toContain(h1);
    expect(
      screen.getByRole("button", { name: "Surprise me again" }),
    ).toBeInTheDocument();
  });

  it("moves focus to the new screen's heading", async () => {
    const user = await toChooser();
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
    await user.click(screen.getByRole("radio", { name: /Cricket/ }));
    await user.click(
      screen.getByRole("button", { name: /adventure preview/i }),
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveFocus();
  });
});
