import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PracticeMission } from "@/components/practice/PracticeMission";
import { TenFrames } from "@/components/practice/TenFrames";
import type {
  PracticeFeedback,
  PracticeRequest,
  PracticeResponse,
} from "@/lib/practice-protocol";
import { capitalize, THEMES } from "@/themes";

const SESSION = "123e4567-e89b-42d3-a456-426614174000";
const challenge = {
  missionId: "subtract-practice",
  start: 13,
  takeAway: 5,
  maxAnswer: 20,
} as const;
const started: PracticeResponse = {
  ok: true,
  sessionId: SESSION,
  seq: 0,
  challenge,
};
const reply = (
  seq: number,
  feedback: PracticeFeedback,
  finished = false,
): PracticeResponse => ({
  ok: true,
  seq,
  feedback,
  sessionStatus: finished ? "finished" : "open",
});

let seen: PracticeRequest[];
function mockServer(script: (r: PracticeRequest) => PracticeResponse) {
  seen = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_u: string, init: RequestInit) => {
      const req = JSON.parse(init.body as string) as PracticeRequest;
      seen.push(req);
      return { json: async () => script(req) } as Response;
    }),
  );
}
afterEach(() => vi.unstubAllGlobals());

describe.each(THEMES)("ten-frame hints: $displayName", (theme) => {
  const v = theme.vocabulary;
  const Name = capitalize(v.singular);

  it("hint 1 draws the split stage; hint 2 draws the take-from-ten stage; neither prints the result", () => {
    const { rerender } = render(
      <TenFrames
        vocabulary={v}
        start={13}
        takeAway={5}
        steps={{ takeToTen: 3, takeFromTen: null }}
      />,
    );
    const picture = () => screen.getByRole("img");
    expect(picture().getAttribute("aria-label")).toBe(
      `13 ${v.plural} shown as one full ten and 3 extra. The 3 extra are marked to take first.`,
    );
    expect(document.querySelectorAll('[data-cell="counter"]')).toHaveLength(10);
    expect(document.querySelectorAll('[data-cell="take-now"]')).toHaveLength(3);
    expect(screen.getByText("✕ means take these first.")).toBeInTheDocument();

    rerender(
      <TenFrames
        vocabulary={v}
        start={13}
        takeAway={5}
        steps={{ takeToTen: 3, takeFromTen: 2 }}
      />,
    );
    expect(picture().getAttribute("aria-label")).toBe(
      `The 3 extra ${v.plural} are already taken. The full ten has 2 marked to take next.`,
    );
    expect(document.querySelectorAll('[data-cell="counter"]')).toHaveLength(8);
    expect(document.querySelectorAll('[data-cell="take-now"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-cell="taken"]')).toHaveLength(3);
    // The remaining count is for the learner to find.
    expect(document.body.textContent).not.toMatch(/\b8\b/);
    expect(picture().getAttribute("aria-label")).not.toMatch(/left|remain/i);
  });

  it("is a non-interactive picture: no buttons, links or focusable parts", () => {
    render(
      <TenFrames
        vocabulary={v}
        start={13}
        takeAway={5}
        steps={{ takeToTen: 3, takeFromTen: 2 }}
      />,
    );
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(document.querySelectorAll("[tabindex]")).toHaveLength(0);
  });

  it("draws nothing when the numbers are not a valid cross-ten walkthrough", () => {
    const { container } = render(
      <TenFrames
        vocabulary={v}
        start={13}
        takeAway={3}
        steps={{ takeToTen: 3, takeFromTen: null }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("generalizes beyond 13 - 5", () => {
    render(
      <TenFrames
        vocabulary={v}
        start={16}
        takeAway={7}
        steps={{ takeToTen: 6, takeFromTen: 1 }}
      />,
    );
    expect(document.querySelectorAll('[data-cell="take-now"]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-cell="taken"]')).toHaveLength(6);
  });

  describe("in the mission", () => {
    const user = userEvent.setup();
    async function startAndWrong() {
      render(<PracticeMission theme={theme} />);
      await user.click(screen.getByRole("button", { name: theme.startLabel }));
      await screen.findByRole("heading", { name: theme.playHeading });
      for (let i = 1; i <= 5; i++) {
        await user.click(
          screen.getByRole("button", {
            name: new RegExp(`^${Name} ${i}, ${v.supplyPlace}`),
          }),
        );
      }
      await user.click(screen.getByRole("radio", { name: "9" }));
      await user.click(screen.getByRole("button", { name: "Check my answer" }));
    }
    const hint = (n: 1 | 2): PracticeFeedback =>
      n === 1
        ? {
            kind: "hint",
            hintId: "hint.make-ten.fill-to-ten",
            hintNumber: 1,
            steps: { takeToTen: 3, takeFromTen: null },
          }
        : {
            kind: "hint",
            hintId: "hint.make-ten.take-rest-from-ten",
            hintNumber: 2,
            steps: { takeToTen: 3, takeFromTen: 2 },
          };

    it("shows no picture for neutral feedback, and the server-sent stage for each hint", async () => {
      mockServer((r) =>
        r.action === "start" ? started : reply(1, { kind: "neutral-feedback" }),
      );
      await startAndWrong();
      await screen.findByText(/Not quite yet/);
      expect(screen.queryByRole("img", { name: /ten/ })).toBeNull();
    });

    it("renders the hint 1 picture only, from the server's steps", async () => {
      mockServer((r) => (r.action === "start" ? started : reply(1, hint(1))));
      await startAndWrong();
      const pic = await screen.findByRole("img", {
        name: /marked to take first/,
      });
      expect(pic).toBeInTheDocument();
      expect(screen.queryByRole("img", { name: /take next/ })).toBeNull();
    });

    it("renders the hint 2 picture when the server sends hint 2", async () => {
      mockServer((r) => (r.action === "start" ? started : reply(1, hint(2))));
      await startAndWrong();
      expect(
        await screen.findByRole("img", { name: /marked to take next/ }),
      ).toBeInTheDocument();
    });

    it("keeps one quantity: the picture never changes the construction field", async () => {
      mockServer((r) => (r.action === "start" ? started : reply(1, hint(2))));
      await startAndWrong();
      await screen.findByRole("img", { name: /take next/ });
      expect(
        screen.getAllByRole("button", {
          name: new RegExp(`^${Name} \\d+, ${v.builtPlace}`),
        }),
      ).toHaveLength(5);
      expect(
        screen.getByText(`${capitalize(v.plural)} ${v.builtPlace}: 5`),
      ).toBeInTheDocument();
    });
  });
});

describe.each(THEMES)("prerequisite warm-up: $displayName", (theme) => {
  const v = theme.vocabulary;
  const Name = capitalize(v.singular);
  const user = () => userEvent.setup();
  const supplyRe = new RegExp(`^${Name} \\d+, ${v.supplyPlace}`);

  async function toOffer(u: ReturnType<typeof user>) {
    render(<PracticeMission theme={theme} />);
    await u.click(screen.getByRole("button", { name: theme.startLabel }));
    await screen.findByRole("heading", { name: theme.playHeading });
    for (let i = 1; i <= 5; i++) {
      await u.click(
        screen.getByRole("button", {
          name: new RegExp(`^${Name} ${i}, ${v.supplyPlace}`),
        }),
      );
    }
    await u.click(screen.getByRole("radio", { name: "9" }));
    await u.click(screen.getByRole("button", { name: "Check my answer" }));
    return screen.findByRole("heading", { name: /warm-up first/i });
  }

  function script(): (r: PracticeRequest) => PracticeResponse {
    return (r) => {
      switch (r.action) {
        case "start":
          return started;
        case "attempt":
          // First attempt in the mission opens the offer; in the warm-up, any answer returns.
          return r.seq === 0
            ? reply(1, { kind: "support-offer" })
            : reply(3, { kind: "support-finished" });
        case "support":
          return r.choice === "start"
            ? reply(2, {
                kind: "support-started",
                challenge: { start: 10, takeAway: 6, maxAnswer: 20 },
              })
            : reply(2, { kind: "easier-practice" }, true);
        case "skip":
          return reply(3, { kind: "support-finished" });
        case "stop":
          return reply(
            r.seq + 1,
            { kind: "ended", reason: "learner-stopped" },
            true,
          );
      }
    };
  }

  it("offers the warm-up calmly, moves focus to it, and names an exit", async () => {
    mockServer(script());
    const u = user();
    const heading = await toOffer(u);
    expect(heading).toHaveFocus();
    expect(
      screen.getByRole("button", { name: "Try the warm-up" }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Not now" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Stop for now" })).toBeEnabled();
    expect(screen.queryByText(/wrong|bad|fail|behind|struggl/i)).toBeNull();
  });

  it("shows the server's smaller numbers during the warm-up, then returns to 13", async () => {
    mockServer(script());
    const u = user();
    await toOffer(u);
    await u.click(screen.getByRole("button", { name: "Try the warm-up" }));
    const warm = await screen.findByRole("heading", { name: "Warm-up" });
    expect(warm).toHaveFocus();
    expect(
      screen.getByText(new RegExp(`has 10 ${v.plural}`)),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: supplyRe })).toHaveLength(10);

    for (let i = 1; i <= 6; i++) {
      await u.click(
        screen.getByRole("button", {
          name: new RegExp(`^${Name} ${i}, ${v.supplyPlace}`),
        }),
      );
    }
    await u.click(screen.getByRole("radio", { name: "4" }));
    await u.click(screen.getByRole("button", { name: "Check my answer" }));

    const back = await screen.findByRole("heading", {
      name: theme.playHeading,
    });
    expect(back).toHaveFocus();
    expect(screen.getByText(/You are back at the mission/)).toBeInTheDocument();
    // A fresh field for the original mission: 13 available, none placed.
    expect(screen.getAllByRole("button", { name: supplyRe })).toHaveLength(13);
    expect(
      screen.getByText(`${capitalize(v.plural)} ${v.builtPlace}: 0`),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "8" })).toBeDisabled();
  });

  it("sends only the learner's choices; the server alone decides what happens next", async () => {
    mockServer(script());
    const u = user();
    await toOffer(u);
    await u.click(screen.getByRole("button", { name: "Try the warm-up" }));
    await screen.findByRole("heading", { name: "Warm-up" });
    await u.click(screen.getByRole("button", { name: "Back to the mission" }));
    await screen.findByRole("heading", { name: theme.playHeading });
    expect(seen.map((r) => r.action)).toEqual([
      "start",
      "attempt",
      "support",
      "skip",
    ]);
    expect(seen[2]).toEqual({
      action: "support",
      sessionId: SESSION,
      seq: 1,
      choice: "start",
    });
  });

  it("Not now ends calmly with no failure language and no mastery claim", async () => {
    mockServer(script());
    const u = user();
    await toOffer(u);
    await u.click(screen.getByRole("button", { name: "Not now" }));
    const out = await screen.findByRole("heading", {
      name: /a little easier/i,
    });
    expect(out).toBeInTheDocument();
    expect(screen.getByText(/does not measure mastery/)).toBeInTheDocument();
    expect(screen.queryByText(/wrong|bad|fail/i)).toBeNull();
  });

  it("Stop for now works from the offer and from the warm-up", async () => {
    mockServer(script());
    const u = user();
    await toOffer(u);
    await u.click(screen.getByRole("button", { name: "Stop for now" }));
    expect(
      await screen.findByRole("heading", { name: "Taking a break" }),
    ).toBeInTheDocument();
  });

  it("has the same controls and requests in both themes", async () => {
    mockServer(script());
    const u = user();
    await toOffer(u);
    const names = screen.getAllByRole("button").map((b) => b.textContent);
    expect(names).toEqual(["Try the warm-up", "Not now", "Stop for now"]);
    const region = screen.getByRole("heading", { name: /warm-up first/i })
      .parentElement as HTMLElement;
    expect(within(region).getAllByRole("button")).toHaveLength(3);
  });
});
