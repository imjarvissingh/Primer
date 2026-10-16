import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BridgeMission } from "@/components/block-builder/BridgeMission";
import { presentHint } from "@/components/block-builder/hints";
import type {
  PracticeFeedback,
  PracticeRequest,
  PracticeResponse,
} from "@/lib/practice-protocol";

const SESSION = "123e4567-e89b-42d3-a456-426614174000";
const challenge = {
  missionId: "broken-bridge",
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

async function start() {
  const user = userEvent.setup();
  render(<BridgeMission />);
  await user.click(screen.getByRole("button", { name: "Start building" }));
  await screen.findByRole("heading", { name: "Fix the bridge" });
  return user;
}
const pile = () =>
  screen.queryAllByRole("button", { name: /^Block \d+, in the pile/ });
const bridge = () =>
  screen.queryAllByRole("button", { name: /^Block \d+, on the bridge/ });

beforeEach(() =>
  mockServer((r) =>
    r.action === "start" ? started : reply(1, { kind: "neutral-feedback" }),
  ),
);
afterEach(() => vi.unstubAllGlobals());

describe("introduction", () => {
  it("explains the mission and shows no numbers or answer before starting", () => {
    render(<BridgeMission />);
    expect(
      screen.getByRole("heading", { name: "The Broken Bridge" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Start building" }),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("starts a server session and shows the challenge", async () => {
    await start();
    expect(seen).toEqual([{ action: "start", missionId: "broken-bridge" }]);
    expect(screen.getByText(/13 blocks/)).toBeInTheDocument();
  });

  it("stays on the intro with a calm message if the server is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("offline"))),
    );
    const user = userEvent.setup();
    render(<BridgeMission />);
    await user.click(screen.getByRole("button", { name: "Start building" }));
    expect(await screen.findByText(/could not start/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start building" }),
    ).toBeInTheDocument();
  });
});

describe("blocks", () => {
  it("shows exactly as many blocks as the server's challenge says, all in the pile", async () => {
    await start();
    expect(pile()).toHaveLength(13);
    expect(bridge()).toHaveLength(0);
    expect(screen.getByText("Blocks on the bridge: 0")).toBeInTheDocument();
  });

  it("moves a block to the bridge and back, keeping 13 in total", async () => {
    const user = await start();
    await user.click(
      screen.getByRole("button", { name: /^Block 3, in the pile/ }),
    );
    expect(pile()).toHaveLength(12);
    expect(bridge()).toHaveLength(1);
    expect(screen.getByText("Blocks on the bridge: 1")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /^Block 3, on the bridge/ }),
    );
    expect(pile()).toHaveLength(13);
    expect(bridge()).toHaveLength(0);
  });

  it("works from the keyboard with Enter and Space", async () => {
    const user = await start();
    screen.getByRole("button", { name: /^Block 1, in the pile/ }).focus();
    await user.keyboard("{Enter}");
    await user.click(
      screen.getByRole("button", { name: /^Block 2, in the pile/ }),
    );
    screen.getByRole("button", { name: /^Block 4, in the pile/ }).focus();
    await user.keyboard(" ");
    expect(bridge()).toHaveLength(3);
    expect(pile()).toHaveLength(10);
  });

  it("never reveals the remaining count as a number or the answer", async () => {
    const user = await start();
    for (let i = 1; i <= 5; i++) {
      await user.click(
        screen.getByRole("button", {
          name: new RegExp(`^Block ${i}, in the pile`),
        }),
      );
    }
    expect(screen.getByText("Blocks on the bridge: 5")).toBeInTheDocument();
    expect(screen.queryByText(/left: 8|8 left|remain/i)).toBeNull();
    expect(screen.queryByText(/That is right/)).toBeNull();
  });

  it("can put every block back at once", async () => {
    const user = await start();
    await user.click(
      screen.getByRole("button", { name: /^Block 1, in the pile/ }),
    );
    await user.click(
      screen.getByRole("button", { name: "Put all blocks back" }),
    );
    expect(bridge()).toHaveLength(0);
  });
});

describe("answer picker", () => {
  it("offers whole numbers 0 to the server's maximum, none selected", async () => {
    await start();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(21);
    expect(radios.map((r) => (r as HTMLInputElement).value)).toEqual(
      Array.from({ length: 21 }, (_, i) => String(i)),
    );
    expect(radios.some((r) => (r as HTMLInputElement).checked)).toBe(false);
  });

  it("does not send anything until a number is chosen", async () => {
    const user = await start();
    await user.click(screen.getByRole("button", { name: "Check my answer" }));
    expect(seen).toHaveLength(1); // only "start"
  });

  it("is operable with arrow keys and Enter", async () => {
    const user = await start();
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
  it("shows neutral feedback, clears the choice, and keeps the blocks", async () => {
    const user = await start();
    await user.click(
      screen.getByRole("button", { name: /^Block 1, in the pile/ }),
    );
    await user.click(screen.getByRole("radio", { name: "9" }));
    await user.click(screen.getByRole("button", { name: "Check my answer" }));
    const status = (await screen.findByText(/Not quite yet/)).closest(
      "[role=status]",
    );
    expect(status).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "9" })).not.toBeChecked();
    expect(bridge()).toHaveLength(1);
    expect(screen.queryByText(/wrong|bad|fail/i)).toBeNull();
  });

  it("sends the next request with the seq the server returned", async () => {
    const user = await start();
    await user.click(screen.getByRole("radio", { name: "9" }));
    await user.click(screen.getByRole("button", { name: "Check my answer" }));
    await screen.findByText(/Not quite yet/);
    await user.click(screen.getByRole("radio", { name: "10" }));
    await user.click(screen.getByRole("button", { name: "Check my answer" }));
    await waitFor(() => expect(seen).toHaveLength(3));
    expect(seen[2]).toMatchObject({ action: "attempt", seq: 1, answer: 10 });
  });

  it("shows a labelled draft hint with the server's steps and outlines the cue blocks", async () => {
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
    await user.click(screen.getByRole("radio", { name: "9" }));
    await user.click(screen.getByRole("button", { name: "Check my answer" }));
    expect(await screen.findByText("Hint 1")).toBeInTheDocument();
    expect(screen.getByText(/take 3 blocks first/i)).toBeInTheDocument();
    expect(screen.getByText(/Draft demo hint/)).toBeInTheDocument();
    const outlined = pile().filter((b) =>
      b.className.includes("outline-dashed"),
    );
    expect(
      outlined.map((b) => b.getAttribute("aria-label")?.slice(0, 8)),
    ).toEqual(["Block 11", "Block 12", "Block 13"]);
  });

  it("offers skip when the server says so, and skipping reaches a calm outcome", async () => {
    mockServer((r) => {
      if (r.action === "start") return started;
      if (r.action === "skip") return reply(2, { kind: "skipped" }, true);
      return reply(1, { kind: "offer-skip" });
    });
    const user = await start();
    await user.click(screen.getByRole("radio", { name: "9" }));
    await user.click(screen.getByRole("button", { name: "Check my answer" }));
    await user.click(
      await screen.findByRole("button", { name: "Skip this bridge" }),
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
    await user.click(screen.getByRole("radio", { name: "9" }));
    await user.click(screen.getByRole("button", { name: "Check my answer" }));
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
    await user.click(screen.getByRole("radio", { name: "9" }));
    await user.click(screen.getByRole("button", { name: "Check my answer" }));
    expect(
      await screen.findByRole("button", { name: "Start building" }),
    ).toBeInTheDocument();
  });

  it("shows a connection message on network failure and keeps the work", async () => {
    mockServer((r) =>
      r.action === "start" ? started : reply(1, { kind: "neutral-feedback" }),
    );
    const user = await start();
    await user.click(
      screen.getByRole("button", { name: /^Block 1, in the pile/ }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("offline"))),
    );
    await user.click(screen.getByRole("radio", { name: "9" }));
    await user.click(screen.getByRole("button", { name: "Check my answer" }));
    expect(await screen.findByText(/could not reach/i)).toBeInTheDocument();
    expect(bridge()).toHaveLength(1);
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
    await user.click(screen.getByRole("radio", { name: "9" }));
    const submit = screen.getByRole("button", { name: "Check my answer" });
    await user.dblClick(submit);
    await user.click(submit);
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
    await user.click(screen.getByRole("radio", { name: "8" }));
    await user.click(screen.getByRole("button", { name: "Check my answer" }));
    return user;
  }

  it("completes with a calm message, focus on the heading, and no score or mastery claim", async () => {
    await finishCorrectly();
    const heading = await screen.findByRole("heading", {
      name: "The bridge is fixed!",
    });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText(/You said 8 blocks were left/)).toBeInTheDocument();
    expect(screen.getByText(/does not measure mastery/)).toBeInTheDocument();
    expect(
      screen.queryByText(/streak|points|score|level|stars|mastered/i),
    ).toBeNull();
  });

  it("restarts to a fresh introduction with a new session on the next start", async () => {
    const user = await finishCorrectly();
    await user.click(await screen.findByRole("button", { name: "Start over" }));
    expect(
      screen.getByRole("heading", { name: "The Broken Bridge" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start building" }));
    await screen.findByRole("heading", { name: "Fix the bridge" });
    expect(pile()).toHaveLength(13);
    expect(bridge()).toHaveLength(0);
    expect(seen.filter((r) => r.action === "start")).toHaveLength(2);
  });

  it("maps server stop reasons to supportive, non-blaming outcomes", async () => {
    for (const [kind, text] of [
      ["unproductive", /take a break/i],
      ["learner-stopped", /taking a break/i],
    ] as const) {
      mockServer((r) =>
        r.action === "start"
          ? started
          : reply(1, { kind: "ended", reason: kind }, true),
      );
      const user = await start();
      await user.click(screen.getByRole("button", { name: "Stop for now" }));
      expect(
        await screen.findByRole("heading", { name: text }),
      ).toBeInTheDocument();
      expect(screen.queryByText(/fail|wrong|bad/i)).toBeNull();
      document.body.innerHTML = "";
    }
  });

  it("shows an honest easier-practice stop", async () => {
    mockServer((r) =>
      r.action === "start"
        ? started
        : reply(1, { kind: "easier-practice" }, true),
    );
    const user = await start();
    await user.click(screen.getByRole("radio", { name: "9" }));
    await user.click(screen.getByRole("button", { name: "Check my answer" }));
    const outcome = await screen.findByRole("heading", {
      name: /a little easier/i,
    });
    expect(
      within(outcome.closest("section")!).getByText(/does not have that yet/),
    ).toBeInTheDocument();
  });
});

describe("hint presentations", () => {
  it("derive numbers from the server's steps, not constants", () => {
    const h = presentHint(
      "hint.make-ten.take-rest-from-ten",
      { takeToTen: 4, takeFromTen: 3 },
      14,
    );
    expect(h.text).toContain("took 4");
    expect(h.text).toContain("take 3 more");
    expect(h.highlightAbove).toBe(10);
  });
  it("falls back safely for unknown ids", () => {
    expect(presentHint("hint.unknown", null, 13).highlightAbove).toBeNull();
  });
});

describe("motion", () => {
  it("animates only when reduced motion is not requested", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("src/app/globals.css", "utf8");
    const afterGuard =
      css.split("prefers-reduced-motion: no-preference")[1] ?? "";
    expect(afterGuard).toContain("transition");
    expect(css.split("prefers-reduced-motion: no-preference")[0]).not.toContain(
      "transition",
    );
  });
});
