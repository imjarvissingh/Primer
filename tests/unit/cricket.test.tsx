import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PracticeMission } from "@/components/practice/PracticeMission";
import { CricketIntro } from "@/components/practice/cricket/CricketIntro";
import { CricketAftermath } from "@/components/practice/cricket/CricketStation";
import { MakeTenLab } from "@/components/practice/cricket/MakeTenLab";
import { CRICKET_THEME } from "@/themes";

function mockMatchMedia(reduce: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((q: string) => ({
      matches: reduce && q.includes("reduce"),
      media: q,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })),
  );
}
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Cricket introduction", () => {
  beforeEach(() => mockMatchMedia(false));

  it("plays through four captioned beats on its own and then offers a replay", () => {
    vi.useFakeTimers();
    render(<CricketIntro />);
    const section = document.querySelector("[data-intro-beat]")!;
    expect(section.getAttribute("data-intro-beat")).toBe("arrive");
    const seen = [section.getAttribute("data-intro-beat")];
    for (let i = 0; i < 3; i++) {
      act(() => void vi.advanceTimersByTime(3800));
      seen.push(section.getAttribute("data-intro-beat"));
    }
    expect(seen).toEqual(["arrive", "station", "nets", "job"]);
    act(() => void vi.advanceTimersByTime(3800));
    expect(section.getAttribute("data-intro-mode")).toBe("finished");
    expect(screen.getByRole("button", { name: "Replay story" })).toBeVisible();
  });

  it("can be skipped to the last frame and replayed from the first", async () => {
    const user = userEvent.setup();
    render(<CricketIntro />);
    await user.click(screen.getByRole("button", { name: "Skip story" }));
    expect(screen.getByTestId("intro-caption")).toHaveTextContent(/Your job/);
    await user.click(screen.getByRole("button", { name: "Replay story" }));
    expect(screen.getByTestId("intro-caption")).toHaveTextContent(/Welcome/);
  });

  it("draws a basket mound whose ball count is not the answer", () => {
    const { container } = render(<CricketIntro />);
    const heap = container.querySelectorAll(".intro-basket clipPath + g > g");
    expect(heap.length).toBeGreaterThan(0);
    expect(heap.length).not.toBe(8);
    expect(heap.length).not.toBe(13);
  });

  it("announces story captions politely", () => {
    render(<CricketIntro />);
    expect(screen.getByTestId("intro-caption")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("never draws numerals or a remainder in its captions", () => {
    render(<CricketIntro />);
    expect(screen.getByTestId("intro-caption").textContent).not.toMatch(
      /\d{2}|\b8\b/,
    );
  });
});

describe("Cricket introduction with reduced motion", () => {
  beforeEach(() => mockMatchMedia(true));

  it("does not autoplay; steps with buttons and keeps every frame reachable", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<CricketIntro />);
    act(() => void vi.advanceTimersByTime(20000));
    expect(screen.getByTestId("intro-caption")).toHaveTextContent(/Welcome/);
    expect(screen.queryByRole("button", { name: /Pause story/ })).toBeNull();
    for (let i = 0; i < 3; i++)
      await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByTestId("intro-caption")).toHaveTextContent(/Your job/);
    expect(screen.getByRole("button", { name: "Replay story" })).toBeVisible();
  });
});

describe("Cricket mission presentation", () => {
  const SESSION = "123e4567-e89b-42d3-a456-426614174000";
  beforeEach(() => {
    mockMatchMedia(false);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_u: string, init: RequestInit) => {
        const req = JSON.parse(init.body as string);
        const body =
          req.action === "start"
            ? {
                ok: true,
                sessionId: SESSION,
                seq: 0,
                challenge: {
                  missionId: "subtract-practice",
                  start: 13,
                  takeAway: 5,
                  maxAnswer: 20,
                },
              }
            : {
                ok: true,
                seq: 1,
                feedback: { kind: "correct" },
                sessionStatus: "finished",
              };
        return { json: async () => body } as Response;
      }),
    );
  });

  async function play() {
    const user = userEvent.setup();
    render(<PracticeMission theme={CRICKET_THEME} />);
    await user.click(screen.getByRole("button", { name: "Start practice" }));
    await screen.findByRole("heading", { name: "Fill the practice nets" });
    return user;
  }

  it("keeps start, used and left apart, and never shows a remainder", async () => {
    const user = await play();
    const board = screen.getByLabelText("Scoreboard");
    expect(within(board).getByText("13")).toBeInTheDocument();
    expect(
      board.querySelector('[data-board="left"] [aria-hidden]'),
    ).toHaveTextContent("?");
    for (let n = 1; n <= 5; n++)
      await user.click(
        screen.getByRole("button", { name: new RegExp(`^Ball ${n}, in the`) }),
      );
    expect(board.querySelector('[data-board="used"]')).toHaveTextContent(
      "5 of 5",
    );
    expect(board.textContent).not.toMatch(/\b8\b/);
  });

  it("'Make a ten' regroups the same balls without changing the selection", async () => {
    const user = await play();
    await user.click(screen.getByRole("button", { name: /^Ball 3, in the/ }));
    await user.click(screen.getByRole("button", { name: "Make a ten" }));
    const rack = screen.getByRole("group", { name: "Rack of ten" });
    // Ball 3 left the rack (it is at the nets), so nine balls remain in the rack.
    expect(within(rack).getAllByRole("button")).toHaveLength(9);
    expect(
      screen
        .getByRole("group", { name: "Extra balls" })
        .querySelectorAll("button"),
    ).toHaveLength(3);
    expect(
      screen.getAllByRole("button", { name: /^Ball \d+, in the basket/ }),
    ).toHaveLength(12);
    await user.click(screen.getByRole("button", { name: "Just the balls" }));
    expect(
      screen.getAllByRole("button", { name: /^Ball \d+, in the basket/ }),
    ).toHaveLength(12);
  });

  it("shows the real remaining balls only after the server confirms success", async () => {
    const user = await play();
    expect(document.querySelector("[data-aftermath]")).toBeNull();
    for (const n of [1, 4, 7, 10, 13])
      await user.click(
        screen.getByRole("button", { name: new RegExp(`^Ball ${n}, in the`) }),
      );
    await user.click(screen.getByRole("radio", { name: "8" }));
    await user.click(screen.getByRole("button", { name: "Check my answer" }));
    await screen.findByText("Practice can begin!");
    const nets = document.querySelector('[data-aftermath="nets"]')!;
    const basket = document.querySelector('[data-aftermath="basket"]')!;
    expect(nets.querySelectorAll(".item")).toHaveLength(5);
    expect(basket.querySelectorAll(".item")).toHaveLength(8);
  });
});

describe("Cricket aftermath", () => {
  it("draws exactly the learner's own selection and the rest", () => {
    render(<CricketAftermath total={13} used={new Set([2, 3, 5, 8, 13])} />);
    expect(screen.getByRole("figure")).toHaveTextContent(
      "5 balls at the nets, 8 balls left",
    );
  });
});

describe("Draft make-ten lab page", () => {
  beforeEach(() => {
    // jsdom does not implement scrolling; the lab scrolls its new step into view.
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  });

  it("only enables balls that can act in the current step", async () => {
    render(<MakeTenLab />);
    // Step 1: every loose ball can go to the rack.
    const loose = screen.getAllByRole("button", { name: /outside the rack/ });
    expect(loose).toHaveLength(13);
    expect(loose.every((b) => !(b as HTMLButtonElement).disabled)).toBe(true);
  });

  it("fills the rack by tapping, then needs the learner's number before going on", async () => {
    const user = userEvent.setup();
    render(<MakeTenLab />);
    for (let n = 1; n <= 10; n++)
      await user.click(
        screen.getByRole("button", {
          name: new RegExp(`^Ball ${n}, outside the rack`),
        }),
      );
    expect(screen.getByTestId("lab-status")).toHaveTextContent(
      "The rack is full.",
    );
    // The count outside the rack is not printed for the learner.
    expect(screen.getByTestId("lab-status")).not.toHaveTextContent(/3/);
    const next = screen.getByRole("button", { name: "Next step" });
    expect(next).toHaveAttribute("aria-disabled", "true");
    await user.click(next);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Make a ten",
    );
    await user.click(screen.getByRole("radio", { name: "3" }));
    await user.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByTestId("lab-feedback")).toHaveTextContent(
      "Yes. 13 is 10 and 3.",
    );
    await user.click(next);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Start with the extras",
    );
    expect(screen.queryByTestId("lab-result")).toBeNull();
  });

  const fillRack = async (user: ReturnType<typeof userEvent.setup>) => {
    for (let n = 1; n <= 10; n++)
      await user.click(
        screen.getByRole("button", {
          name: new RegExp(`^Ball ${n}, outside the rack`),
        }),
      );
  };

  it("announces moves in one hidden live region and shows no empty status card", async () => {
    const user = userEvent.setup();
    render(<MakeTenLab />);
    const status = screen.getByTestId("lab-status");
    expect(status).toHaveAttribute("role", "status");
    expect(status).toHaveClass("sr-only");
    await user.click(
      screen.getByRole("button", { name: /^Ball 1, outside the rack/ }),
    );
    expect(status).toHaveTextContent("Ball 1 moved to the rack.");
    // The visible page holds no card whose only job is to announce.
    expect(document.querySelectorAll(".card").length).toBe(0);
  });

  it("offers a way to count, and more support only after repeated mix-ups, never the number", async () => {
    const user = userEvent.setup();
    render(<MakeTenLab />);
    await fillRack(user);
    expect(screen.getByTestId("lab-count-aid")).toHaveTextContent(
      "Tap each ball outside the rack to mark it as you count.",
    );
    const mark = screen.getByRole("button", {
      name: /^Ball 11, outside the rack/,
    });
    expect(mark).toHaveAttribute("aria-pressed", "false");
    await user.click(mark);
    expect(mark).toHaveAttribute("aria-pressed", "true");
    const wrong = async (n: string) => {
      await user.click(screen.getByRole("radio", { name: n }));
      await user.click(screen.getByRole("button", { name: "Check" }));
    };
    await wrong("5");
    expect(screen.getByTestId("lab-feedback")).not.toHaveTextContent(
      /one at a time/,
    );
    await wrong("6");
    expect(screen.getByTestId("lab-feedback")).toHaveTextContent(
      /one at a time/,
    );
    await wrong("7");
    expect(screen.getByTestId("lab-feedback")).toHaveTextContent(
      /grown-up can count with you/,
    );
    // None of this support states the number of balls outside.
    expect(screen.getByTestId("lab-feedback")).not.toHaveTextContent(/\b3\b/);
  });
});
