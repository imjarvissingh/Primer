import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PracticeMission } from "@/components/practice/PracticeMission";
import { presentHint } from "@/components/practice/hints";
import type {
  PracticeFeedback,
  PracticeRequest,
  PracticeResponse,
} from "@/lib/practice-protocol";
import { capitalize, THEMES, type ThemeConfig } from "@/themes";

const SESSION = "123e4567-e89b-42d3-a456-426614174000";
const challenge = {
  missionId: "subtract-practice",
  start: 13,
  takeAway: 5,
  maxAnswer: 20,
} as const;

type Script = (
  req: PracticeRequest,
) => PracticeResponse | Promise<PracticeResponse>;
let seen: PracticeRequest[];

function mockServer(script: Script) {
  seen = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      const req = JSON.parse(init.body as string) as PracticeRequest;
      seen.push(req);
      const body = await script(req);
      return { json: async () => body } as Response;
    }),
  );
}
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
const neutralServer: Script = (r) =>
  r.action === "start" ? started : reply(1, { kind: "neutral-feedback" });

afterEach(() => vi.unstubAllGlobals());

describe.each(THEMES)("shared mission engine: $displayName", (theme) => {
  const v = theme.vocabulary;
  const Name = capitalize(v.singular);
  const supplyRe = new RegExp(`^${Name} \\d+, ${v.supplyPlace}`);
  const builtRe = new RegExp(`^${Name} \\d+, ${v.builtPlace}`);
  const supply = () => screen.queryAllByRole("button", { name: supplyRe });
  const built = () => screen.queryAllByRole("button", { name: builtRe });
  const item = (n: number, place: "supply" | "built") =>
    screen.getByRole("button", {
      name: new RegExp(
        `^${Name} ${n}, ${place === "supply" ? v.supplyPlace : v.builtPlace}`,
      ),
    });
  const counter = (n: number) =>
    screen.getByText(`${capitalize(v.plural)} ${v.builtPlace}: ${n}`);
  const checkButton = () =>
    screen.getByRole("button", { name: "Check my answer" });

  function view() {
    return render(
      <PracticeMission theme={theme} scene={<svg data-testid="scene" />} />,
    );
  }
  async function start() {
    const user = userEvent.setup();
    view();
    await user.click(screen.getByRole("button", { name: theme.startLabel }));
    await screen.findByRole("heading", { name: theme.playHeading });
    return user;
  }
  async function build(user: ReturnType<typeof userEvent.setup>, n = 5) {
    for (let i = 1; i <= n; i++) await user.click(item(i, "supply"));
  }
  async function submit(user: ReturnType<typeof userEvent.setup>, n: number) {
    await user.click(screen.getByRole("radio", { name: String(n) }));
    await user.click(checkButton());
  }

  beforeEach(() => mockServer(neutralServer));

  describe("introduction", () => {
    it("shows the themed introduction, scene and start button, with no numbers or answer", () => {
      view();
      expect(
        screen.getByRole("heading", { name: theme.missionTitle }),
      ).toBeInTheDocument();
      expect(screen.getByText(theme.intro)).toBeInTheDocument();
      expect(screen.getByTestId("scene")).toBeInTheDocument();
      expect(screen.queryByRole("radio")).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    it("starts a server session and states the challenge in the theme's words", async () => {
      await start();
      expect(seen).toEqual([
        { action: "start", missionId: "subtract-practice" },
      ]);
      expect(
        screen.getByText(new RegExp(`has 13 ${v.plural}`)),
      ).toBeInTheDocument();
    });

    it("stays on the intro with a calm message if the server is unreachable", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => Promise.reject(new Error("offline"))),
      );
      const user = userEvent.setup();
      view();
      await user.click(screen.getByRole("button", { name: theme.startLabel }));
      expect(await screen.findByText(/could not start/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: theme.startLabel }),
      ).toBeInTheDocument();
    });
  });

  describe("manipulatives", () => {
    it("shows exactly the server's quantity, all in the supply, labelled with the theme's noun", async () => {
      await start();
      expect(supply()).toHaveLength(13);
      expect(built()).toHaveLength(0);
      expect(counter(0)).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: v.supplyHeading }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: v.builtHeading }),
      ).toBeInTheDocument();
    });

    it("keeps every item in exactly one place while moving it to and from construction", async () => {
      const user = await start();
      await user.click(item(3, "supply"));
      expect(supply()).toHaveLength(12);
      expect(built()).toHaveLength(1);
      expect(counter(1)).toBeInTheDocument();
      await user.click(item(3, "built"));
      expect(supply()).toHaveLength(13);
      expect(built()).toHaveLength(0);
      await build(user);
      expect(supply().length + built().length).toBe(13);
    });

    it("works from the keyboard with Enter and Space", async () => {
      const user = await start();
      item(1, "supply").focus();
      await user.keyboard("{Enter}");
      await user.click(item(2, "supply"));
      item(4, "supply").focus();
      await user.keyboard(" ");
      expect(built()).toHaveLength(3);
      expect(supply()).toHaveLength(10);
    });

    it("never prints the remaining count or the answer", async () => {
      const user = await start();
      await build(user);
      expect(counter(5)).toBeInTheDocument();
      expect(screen.queryByText(/left: 8|8 left|remain/i)).toBeNull();
      expect(screen.queryByText(/That is right/)).toBeNull();
    });

    it("can put every item back at once", async () => {
      const user = await start();
      await user.click(item(1, "supply"));
      await user.click(
        screen.getByRole("button", { name: `Put all ${v.plural} back` }),
      );
      expect(built()).toHaveLength(0);
    });
  });

  describe("construction readiness", () => {
    it("locks the answer picker until exactly the story's quantity is built", async () => {
      const user = await start();
      const radio = () => screen.getByRole("radio", { name: "8" });
      expect(radio()).toBeDisabled();
      expect(
        screen.getByText(`Put 5 ${v.plural} more ${v.builtPlace} to continue.`),
      ).toBeInTheDocument();
      await build(user, 4);
      expect(radio()).toBeDisabled();
      expect(
        screen.getByText(
          `Put 1 ${v.singular} more ${v.builtPlace} to continue.`,
        ),
      ).toBeInTheDocument();
      await user.click(item(5, "supply"));
      expect(radio()).toBeEnabled();
      expect(screen.getByText(/Now count the ones left/)).toBeInTheDocument();
    });

    it("locks it again if too many are built, and nothing is sent", async () => {
      const user = await start();
      await build(user, 6);
      expect(screen.getByRole("radio", { name: "8" })).toBeDisabled();
      expect(
        screen.getByText(
          `That is more than 5. Put 1 ${v.singular} back ${v.supplyPlace}.`,
        ),
      ).toBeInTheDocument();
      await user.click(checkButton());
      expect(seen).toHaveLength(1); // only "start"
    });

    it("keeps stop and start-over available while locked", async () => {
      await start();
      expect(
        screen.getByRole("button", { name: "Stop for now" }),
      ).toBeEnabled();
      expect(screen.getByRole("button", { name: "Start over" })).toBeEnabled();
    });
  });

  describe("answer picker", () => {
    it("offers whole numbers 0 to the server's maximum, none selected", async () => {
      const user = await start();
      await build(user);
      const radios = screen.getAllByRole("radio");
      expect(radios.map((r) => (r as HTMLInputElement).value)).toEqual(
        Array.from({ length: 21 }, (_, i) => String(i)),
      );
      expect(radios.some((r) => (r as HTMLInputElement).checked)).toBe(false);
      expect(
        screen.getByText(`How many ${v.plural} are left ${v.supplyPlace}?`),
      ).toBeInTheDocument();
    });

    it("sends nothing until a number is chosen", async () => {
      const user = await start();
      await build(user);
      await user.click(checkButton());
      expect(seen).toHaveLength(1);
    });

    it("is operable with arrow keys and Enter", async () => {
      const user = await start();
      await build(user);
      screen.getByRole("radio", { name: "4" }).focus();
      await user.keyboard("{ArrowRight}");
      expect(screen.getByRole("radio", { name: "5" })).toBeChecked();
      await user.keyboard("{Enter}");
      await waitFor(() => expect(seen).toHaveLength(2));
      expect(seen[1]).toEqual({
        action: "attempt",
        sessionId: SESSION,
        seq: 0,
        answer: 5,
      });
    });
  });

  describe("feedback", () => {
    it("shows neutral feedback in the theme's words, clears the choice and keeps the items", async () => {
      const user = await start();
      await build(user);
      await submit(user, 9);
      const text = await screen.findByText(/Not quite yet/);
      expect(text).toHaveTextContent(
        `Look at the ${v.plural} ${v.supplyPlace}`,
      );
      expect(text.closest("[role=status]")).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "9" })).not.toBeChecked();
      expect(built()).toHaveLength(5);
      expect(screen.queryByText(/wrong|bad|fail/i)).toBeNull();
    });

    it("sends the next request with the seq the server returned", async () => {
      const user = await start();
      await build(user);
      await submit(user, 9);
      await screen.findByText(/Not quite yet/);
      await submit(user, 10);
      await waitFor(() => expect(seen).toHaveLength(3));
      expect(seen[2]).toMatchObject({ action: "attempt", seq: 1, answer: 10 });
    });

    it("shows a labelled draft hint with themed nouns and outlines the cue items", async () => {
      mockServer((r) =>
        r.action === "start"
          ? started
          : reply(1, {
              kind: "hint",
              hintId: "hint.make-ten.fill-to-ten",
              hintNumber: 1,
              steps: { takeToTen: 3, takeFromTen: 2 },
            }),
      );
      const user = await start();
      await build(user);
      await submit(user, 9);
      expect(await screen.findByText("Hint 1")).toBeInTheDocument();
      expect(
        screen.getByText(new RegExp(`take 3 ${v.plural} first`, "i")),
      ).toBeInTheDocument();
      expect(screen.getByText(/Draft demo hint/)).toBeInTheDocument();
      const outlined = supply().filter((b) => b.className.includes("item-cue"));
      expect(
        outlined.map(
          (b) => /^\w+ \d+/.exec(b.getAttribute("aria-label") ?? "")?.[0],
        ),
      ).toEqual([`${Name} 11`, `${Name} 12`, `${Name} 13`]);
    });

    it("offers skip when the server says so, and skipping reaches a calm outcome", async () => {
      mockServer((r) => {
        if (r.action === "start") return started;
        if (r.action === "skip") return reply(2, { kind: "skipped" }, true);
        return reply(1, { kind: "offer-skip" });
      });
      const user = await start();
      await build(user);
      await submit(user, 9);
      await user.click(
        await screen.findByRole("button", { name: "Skip this challenge" }),
      );
      expect(
        await screen.findByRole("heading", { name: /skipped/i }),
      ).toBeInTheDocument();
    });

    it("asks again, keeping the choice, for an unreadable answer", async () => {
      mockServer((r) =>
        r.action === "start" ? started : reply(1, { kind: "ask-again" }),
      );
      const user = await start();
      await build(user);
      await submit(user, 9);
      expect(await screen.findByText(/could not read/i)).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "9" })).toBeChecked();
    });

    it("treats a lost session as a safe restart", async () => {
      mockServer((r) =>
        r.action === "start"
          ? started
          : { ok: false, error: "session-not-found" },
      );
      const user = await start();
      await build(user);
      await submit(user, 9);
      expect(
        await screen.findByRole("button", { name: theme.startLabel }),
      ).toBeInTheDocument();
    });

    it("shows a connection message on network failure and keeps the work", async () => {
      const user = await start();
      await build(user);
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => Promise.reject(new Error("offline"))),
      );
      await submit(user, 9);
      expect(await screen.findByText(/could not reach/i)).toBeInTheDocument();
      expect(built()).toHaveLength(5);
    });
  });

  describe("double submission", () => {
    it("sends only one request while the first is in flight", async () => {
      let release: (r: PracticeResponse) => void = () => undefined;
      mockServer((r) =>
        r.action === "start"
          ? started
          : new Promise<PracticeResponse>((resolve) => (release = resolve)),
      );
      const user = await start();
      await build(user);
      await user.click(screen.getByRole("radio", { name: "9" }));
      await user.dblClick(checkButton());
      await user.click(checkButton());
      expect(seen.filter((r) => r.action === "attempt")).toHaveLength(1);
      release(reply(1, { kind: "neutral-feedback" }));
      expect(await screen.findByText(/Not quite yet/)).toBeInTheDocument();
    });
  });

  describe("outcomes and restart", () => {
    async function finishCorrectly() {
      mockServer((r) =>
        r.action === "start" ? started : reply(1, { kind: "correct" }, true),
      );
      const user = await start();
      await build(user);
      await submit(user, 8);
      return user;
    }

    it("completes with the theme's message, focus on the heading, and no score or mastery claim", async () => {
      await finishCorrectly();
      const heading = await screen.findByRole("heading", {
        name: theme.outcomeTitle,
      });
      await waitFor(() => expect(heading).toHaveFocus());
      expect(
        screen.getByText(new RegExp(`You said 8 ${v.plural} were left`)),
      ).toBeInTheDocument();
      expect(screen.getByText(/does not measure mastery/)).toBeInTheDocument();
      expect(
        screen.queryByText(/streak|points|score|level|stars|mastered/i),
      ).toBeNull();
    });

    it("restarts to a fresh introduction and a new session on the next start", async () => {
      const user = await finishCorrectly();
      await user.click(
        await screen.findByRole("button", { name: "Start over" }),
      );
      expect(
        screen.getByRole("heading", { name: theme.missionTitle }),
      ).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: theme.startLabel }));
      await screen.findByRole("heading", { name: theme.playHeading });
      expect(supply()).toHaveLength(13);
      expect(built()).toHaveLength(0);
      expect(seen.filter((r) => r.action === "start")).toHaveLength(2);
    });

    it.each([
      ["unproductive", /take a break/i],
      ["learner-stopped", /taking a break/i],
    ] as const)(
      "maps the %s stop reason to a supportive outcome",
      async (reason, heading) => {
        mockServer((r) =>
          r.action === "start"
            ? started
            : reply(1, { kind: "ended", reason }, true),
        );
        const user = await start();
        await user.click(screen.getByRole("button", { name: "Stop for now" }));
        expect(
          await screen.findByRole("heading", { name: heading }),
        ).toBeInTheDocument();
        expect(screen.queryByText(/fail|wrong|bad/i)).toBeNull();
      },
    );

    it("shows an honest easier-practice stop", async () => {
      mockServer((r) =>
        r.action === "start"
          ? started
          : reply(1, { kind: "easier-practice" }, true),
      );
      const user = await start();
      await build(user);
      await submit(user, 9);
      await screen.findByRole("heading", { name: /a little easier/i });
      expect(screen.getByText(/does not have that yet/)).toBeInTheDocument();
    });
  });
});

describe("cross-theme equivalence", () => {
  async function playScript(theme: ThemeConfig) {
    mockServer(neutralServer);
    const user = userEvent.setup();
    const { unmount } = render(<PracticeMission theme={theme} scene={null} />);
    await user.click(screen.getByRole("button", { name: theme.startLabel }));
    await screen.findByRole("heading", { name: theme.playHeading });
    const Name = capitalize(theme.vocabulary.singular);
    for (let i = 1; i <= 5; i++) {
      await user.click(
        screen.getByRole("button", {
          name: new RegExp(`^${Name} ${i}, ${theme.vocabulary.supplyPlace}`),
        }),
      );
    }
    await user.click(screen.getByRole("radio", { name: "9" }));
    await user.click(screen.getByRole("button", { name: "Check my answer" }));
    await screen.findByText(/Not quite yet/);
    await user.click(screen.getByRole("button", { name: "Stop for now" }));
    const requests = [...seen];
    unmount();
    return requests;
  }

  it("sends byte-identical requests to the server for the same learner actions", async () => {
    const a = await playScript(THEMES[0]);
    const b = await playScript(THEMES[1]);
    expect(a).toEqual(b);
    expect(a.map((r) => r.action)).toEqual(["start", "attempt", "stop"]);
  });
});

describe("hint presentations", () => {
  it("derive their numbers from the server's steps, not constants", () => {
    const h = presentHint(
      "hint.make-ten.take-rest-from-ten",
      { takeToTen: 4, takeFromTen: 3 },
      14,
      THEMES[0].vocabulary,
    );
    expect(h.text).toContain("took 4 blocks");
    expect(h.text).toContain("take 3 more");
    expect(h.highlightAbove).toBe(10);
  });

  it("falls back safely for unknown ids", () => {
    expect(
      presentHint("hint.unknown", null, 13, THEMES[1].vocabulary)
        .highlightAbove,
    ).toBeNull();
  });
});

describe("motion", () => {
  it("animates only when reduced motion is not requested", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("src/app/globals.css", "utf8");
    const [before, after] = css.split("prefers-reduced-motion: no-preference");
    expect(after).toContain("transition");
    expect(before).not.toContain("transition");
  });
});
