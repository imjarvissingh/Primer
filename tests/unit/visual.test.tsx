import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { THEMES } from "@/themes";

describe("visual system", () => {
  it("home page says what Primer is and that it is a draft demo", () => {
    const { container, getByText } = render(<Home />);
    getByText(/Math becomes an adventure/);
    getByText(/Draft demonstration/);
    getByText(/ages 6.9/);
    // Decorative artwork stays out of the accessibility tree.
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(3);
    svgs.forEach((svg) => expect(svg).toHaveAttribute("aria-hidden", "true"));
  });

  it("makes no claims of verified results on the home page", () => {
    const { container } = render(<Home />);
    expect(container.textContent).not.toMatch(
      /proven|clinically|guarantee|mastery achieved|improves? scores/i,
    );
  });

  it("every theme states a goal, as presentation-only text", () => {
    for (const t of THEMES) expect(t.goal.length).toBeGreaterThan(10);
  });

  it("only animates when the user has not asked for reduced motion", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    // Remove every no-preference block, then no animation may remain.
    const marker = "@media (prefers-reduced-motion: no-preference) {";
    let rest = css;
    for (let i = rest.indexOf(marker); i !== -1; i = rest.indexOf(marker)) {
      let depth = 0;
      let end = i;
      for (let j = i; j < rest.length; j++) {
        if (rest[j] === "{") depth++;
        if (rest[j] === "}" && --depth === 0) {
          end = j + 1;
          break;
        }
      }
      rest = rest.slice(0, i) + rest.slice(end);
    }
    expect(rest).not.toMatch(/animation\s*:|transition\s*:/);
  });
});
