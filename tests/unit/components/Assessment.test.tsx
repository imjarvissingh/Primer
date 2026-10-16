import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssessmentCheck } from "@/components/assessment/AssessmentCheck";
import { ProgressSummary } from "@/components/assessment/ProgressSummary";
import type {
  AssessmentQuestion,
  AssessmentReply,
  AssessmentRequest,
  AssessmentSummary,
} from "@/lib/assessment-protocol";

const SESSION = "123e4567-e89b-42d3-a456-426614174000";
const q = (position: number, start = 16, takeAway = 5): AssessmentQuestion => ({
  position,
  total: 4,
  start,
  takeAway,
  maxAnswer: 20,
});
let seen: AssessmentRequest[];

function mockServer(
  script: (r: AssessmentRequest) => AssessmentReply | Promise<AssessmentReply>,
) {
  seen = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_u: string, init: RequestInit) => {
      const req = JSON.parse(init.body as string) as AssessmentRequest;
      seen.push(req);
      const body = await script(req);
      return { json: async () => body } as Response;
    }),
  );
}
const started: AssessmentReply = {
  ok: true,
  sessionId: SESSION,
  seq: 0,
  question: q(1),
};
const step = (
  seq: number,
  ack: "recorded" | "ask-again" | "skipped" | "stopped",
  question: AssessmentQuestion | null,
  status: "in-progress" | "complete" | "stopped" = "in-progress",
): AssessmentReply => ({ ok: true, seq, ack, status, question });

afterEach(() => vi.unstubAllGlobals());

async function start() {
  const user = userEvent.setup();
  render(<AssessmentCheck />);
  await user.click(screen.getByRole("button", { name: "Start" }));
  await screen.findByRole("heading", { name: "Question 1 of 4" });
  return user;
}
const pickAndSave = async (
  user: ReturnType<typeof userEvent.setup>,
  n: number,
) => {
  await user.click(screen.getByRole("radio", { name: String(n) }));
  await user.click(screen.getByRole("button", { name: "Save my answer" }));
};

describe("AssessmentCheck", () => {
  it("introduces the check honestly: no hints, no timer, no feedback, skippable", () => {
    mockServer(() => started);
    render(<AssessmentCheck />);
    expect(
      screen.getByRole("heading", { name: "Try some on your own" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no hints, no timer/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it("starts, then shows exactly one question with the server's numbers", async () => {
    mockServer(() => started);
    await start();
    expect(seen).toEqual([{ action: "start" }]);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(
      screen.getByText("Start with 16. Take away 5. How many are left?"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(21);
    expect(screen.queryByText(/hint/i)).toBeNull();
  });

  it("sends nothing until a number is picked", async () => {
    mockServer(() => started);
    const user = await start();
    await user.click(screen.getByRole("button", { name: "Save my answer" }));
    expect(seen).toHaveLength(1);
  });

  it("moves to the next question with a neutral acknowledgement and no correctness", async () => {
    mockServer((r) =>
      r.action === "start" ? started : step(1, "recorded", q(2, 19, 7)),
    );
    const user = await start();
    await pickAndSave(user, 11);
    const next = await screen.findByRole("heading", {
      name: "Question 2 of 4",
    });
    await waitFor(() => expect(next).toHaveFocus());
    expect(screen.getByText("Your answer is saved.")).toBeInTheDocument();
    expect(seen[1]).toEqual({
      action: "answer",
      sessionId: SESSION,
      seq: 0,
      answer: 11,
    });
    expect(
      screen.queryByText(/correct|right|wrong|great|well done|not quite/i),
    ).toBeNull();
    expect(screen.getByRole("radio", { name: "11" })).not.toBeChecked();
  });

  it("looks identical after a right and a wrong answer", async () => {
    const snapshots: string[] = [];
    for (const n of [11, 3]) {
      mockServer((r) =>
        r.action === "start" ? started : step(1, "recorded", q(2, 19, 7)),
      );
      const user = await start();
      await pickAndSave(user, n);
      await screen.findByRole("heading", { name: "Question 2 of 4" });
      snapshots.push(document.body.innerHTML.replace(/id="[^"]*"/g, ""));
      document.body.innerHTML = "";
    }
    expect(snapshots[0]).toBe(snapshots[1]);
  });

  it("asks again, keeping the pick, when the server cannot read the answer", async () => {
    mockServer((r) =>
      r.action === "start" ? started : step(1, "ask-again", q(1)),
    );
    const user = await start();
    await pickAndSave(user, 9);
    expect(
      await screen.findByText(/could not read that answer/),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "9" })).toBeChecked();
    expect(
      screen.getByRole("heading", { name: "Question 1 of 4" }),
    ).toBeInTheDocument();
  });

  it("can skip", async () => {
    mockServer((r) =>
      r.action === "start" ? started : step(1, "skipped", q(2, 19, 7)),
    );
    const user = await start();
    await user.click(
      screen.getByRole("button", { name: "Skip this question" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Question 2 of 4" }),
    ).toBeInTheDocument();
    expect(seen[1]).toEqual({ action: "skip", sessionId: SESSION, seq: 0 });
  });

  it("finishes with a calm screen and a link to the adult summary for this session", async () => {
    mockServer((r) =>
      r.action === "start" ? started : step(4, "recorded", null, "complete"),
    );
    const user = await start();
    await pickAndSave(user, 8);
    const done = await screen.findByRole("heading", { name: "All done" });
    await waitFor(() => expect(done).toHaveFocus());
    expect(
      screen.getByRole("link", { name: /Summary for a grown-up/ }),
    ).toHaveAttribute("href", `/demo-progress?session=${SESSION}`);
    expect(
      screen.queryByText(/score|points|streak|mastered|correct/i),
    ).toBeNull();
  });

  it("can stop for now, and restart from the beginning", async () => {
    mockServer((r) =>
      r.action === "start" ? started : step(1, "stopped", null, "stopped"),
    );
    const user = await start();
    await user.click(screen.getByRole("button", { name: "Stop for now" }));
    expect(
      await screen.findByRole("heading", { name: "Stopped for now" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start over" }));
    expect(
      screen.getByRole("heading", { name: "Try some on your own" }),
    ).toBeInTheDocument();
  });

  it("sends one request for a double-click", async () => {
    let release: (r: AssessmentReply) => void = () => undefined;
    mockServer((r) =>
      r.action === "start"
        ? started
        : new Promise<AssessmentReply>((res) => (release = res)),
    );
    const user = await start();
    await user.click(screen.getByRole("radio", { name: "11" }));
    const save = screen.getByRole("button", { name: "Save my answer" });
    await user.dblClick(save);
    await user.click(save);
    expect(seen.filter((r) => r.action === "answer")).toHaveLength(1);
    release(step(1, "recorded", q(2, 19, 7)));
    expect(
      await screen.findByRole("heading", { name: "Question 2 of 4" }),
    ).toBeInTheDocument();
  });

  it("restarts safely if the session is lost, and tells the truth if offline", async () => {
    mockServer((r) =>
      r.action === "start"
        ? started
        : { ok: false, error: "session-not-found" },
    );
    const user = await start();
    await pickAndSave(user, 11);
    expect(
      await screen.findByRole("heading", { name: "Try some on your own" }),
    ).toBeInTheDocument();

    mockServer(() => started);
    await user.click(screen.getByRole("button", { name: "Start" }));
    await screen.findByRole("heading", { name: "Question 1 of 4" });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("offline"))),
    );
    await pickAndSave(user, 11);
    expect(await screen.findByText(/could not reach/)).toBeInTheDocument();
  });
});

const summary: AssessmentSummary = {
  ok: true,
  synthetic: true,
  status: "complete",
  counts: { total: 4, answered: 3, correct: 2, skipped: 1, notReached: 0 },
  items: [
    {
      position: 1,
      expression: "16 − 5",
      skill: "Model subtraction as taking away",
      outcome: "correct",
    },
    {
      position: 2,
      expression: "19 − 7",
      skill: "Model subtraction as taking away",
      outcome: "skipped",
    },
    {
      position: 3,
      expression: "14 − 6",
      skill: "Use make-ten strategies when crossing ten",
      outcome: "correct",
    },
    {
      position: 4,
      expression: "17 − 9",
      skill: "Use make-ten strategies when crossing ten",
      outcome: "incorrect",
    },
  ],
  skills: [
    {
      id: "S03",
      title: "Model subtraction as taking away",
      answered: 1,
      correct: 1,
      observation: "Needs more evidence",
    },
    {
      id: "S04",
      title: "Use make-ten strategies when crossing ten",
      answered: 2,
      correct: 1,
      observation: "Needs more evidence",
    },
  ],
  mastery: { awarded: false, state: "emerging", policy: "draft-unapproved" },
  provenance: {
    phase: "independent",
    hintsUsed: 0,
    contentReview: "draft",
    curriculumVersion: "curriculum-x",
    contentVersion: "content-y",
  },
};

describe("ProgressSummary", () => {
  const visit = (search: string) =>
    window.history.pushState({}, "", `/demo-progress${search}`);
  afterEach(() => window.history.pushState({}, "", "/"));

  it("fetches the summary from the server using only the session id", async () => {
    visit(`?session=${SESSION}`);
    mockServer(() => summary);
    render(<ProgressSummary />);
    await screen.findByText("Questions in the check");
    expect(seen).toEqual([{ action: "summary", sessionId: SESSION }]);
  });

  it("labels the data as synthetic and shows the server's counts and items", async () => {
    visit(`?session=${SESSION}`);
    mockServer(() => summary);
    render(<ProgressSummary />);
    expect(await screen.findByRole("note")).toHaveTextContent(
      /Synthetic demonstration data/,
    );
    const counts = screen.getByText(
      "Correct in this short check",
    ).nextElementSibling;
    expect(counts).toHaveTextContent("2");
    const table = screen.getByRole("table", { name: /Each question/ });
    expect(within(table).getAllByRole("row")).toHaveLength(5);
    expect(
      within(table).getByText("Not correct this time"),
    ).toBeInTheDocument();
    expect(within(table).getByText("Skipped")).toBeInTheDocument();
    expect(screen.getByText(/S03: Model subtraction/)).toBeInTheDocument();
  });

  it("says mastery is not awarded and separates practice from the check", async () => {
    visit(`?session=${SESSION}`);
    mockServer(() => summary);
    render(<ProgressSummary />);
    expect(
      await screen.findByRole("heading", { name: "Mastery: not awarded" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/never awards it, whatever the score/),
    ).toBeInTheDocument();
    expect(screen.getByText(/0 were used/)).toBeInTheDocument();
    expect(
      screen.getByText(/Draft questions, not reviewed by an educator/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Practice is not the same as this check/,
      }),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(
      /mastered|has mastered|proficient|improv|diagnos(is|ed) (of|with)/i,
    );
  });

  it("shows nothing but guidance, and no sample data, without a session", async () => {
    visit("");
    mockServer(() => summary);
    render(<ProgressSummary />);
    expect(
      await screen.findByRole("heading", {
        name: "No completed check to show",
      }),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByRole("table")).toBeNull();
    expect(
      screen.getByRole("link", { name: /independent check/i }),
    ).toHaveAttribute("href", "/assessment");
  });

  it("explains unfinished and unknown sessions without inventing results", async () => {
    visit(`?session=${SESSION}`);
    mockServer(() => ({ ok: false, error: "not-finished" }));
    const { unmount } = render(<ProgressSummary />);
    expect(await screen.findByText(/not finished yet/)).toBeInTheDocument();
    unmount();
    mockServer(() => ({ ok: false, error: "session-not-found" }));
    render(<ProgressSummary />);
    expect(await screen.findByText(/may have expired/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("offers a fresh check, and never rebuilds results, when the session is gone", async () => {
    visit(`?session=${SESSION}`);
    mockServer(() => ({ ok: false, error: "session-not-found" }));
    render(<ProgressSummary />);
    expect(await screen.findByText(/never rebuilt/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start a new independent check" }),
    ).toHaveAttribute("href", "/assessment");
  });

  it("does not call a network failure a missing check", async () => {
    visit(`?session=${SESSION}`);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("offline"))),
    );
    render(<ProgressSummary />);
    expect(await screen.findByText(/could not reach the demo/)).toBeVisible();
    expect(screen.queryByText(/may have expired/)).toBeNull();
  });
});

describe("AssessmentCheck recovery", () => {
  it("explains why it went back to the start when the session is gone", async () => {
    mockServer((r) =>
      r.action === "start"
        ? started
        : { ok: false, error: "session-not-found" },
    );
    const user = await start();
    await pickAndSave(user, 11);
    expect(await screen.findByText(/no longer available/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Start" })).toBeVisible();
  });

  it("tells the truth when starts are rate limited", async () => {
    mockServer(() => ({ ok: false, error: "rate-limited" }));
    const user = userEvent.setup();
    render(<AssessmentCheck />);
    await user.click(screen.getByRole("button", { name: "Start" }));
    expect(await screen.findByText(/wait a minute/)).toBeVisible();
  });

  it("can start over from the middle, creating a new session", async () => {
    mockServer(() => started);
    const user = await start();
    await user.click(screen.getByRole("button", { name: "Start over" }));
    expect(
      screen.getByRole("heading", { name: "Try some on your own" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Start" }));
    await screen.findByRole("heading", { name: "Question 1 of 4" });
    expect(seen.filter((r) => r.action === "start")).toHaveLength(2);
  });
});
