import { describe, expect, it } from "vitest";
import {
  ALL_BANKS,
  BASELINE_BANK,
  DELAYED_BANK,
  GUIDED_PRACTICE_BANK,
  INDEPENDENT_BANK,
  checkBanks,
  equivalentItemKey,
  exactItemKey,
  toLearnerView,
  type QuestionBank,
} from "@/domain/assessment";
import { evaluateResponse } from "@/domain/math";

const asBank = (
  bank: QuestionBank,
  patch: Partial<QuestionBank>,
): QuestionBank => ({
  ...bank,
  ...patch,
});

describe("shipped banks", () => {
  it("have the documented sizes and are all marked draft", () => {
    expect(BASELINE_BANK.items).toHaveLength(8);
    expect(GUIDED_PRACTICE_BANK.items).toHaveLength(8);
    expect(INDEPENDENT_BANK.items).toHaveLength(4);
    expect(DELAYED_BANK.items).toHaveLength(4);
    for (const bank of ALL_BANKS) {
      expect(bank.reviewStatus).toBe("draft");
      for (const item of bank.items) expect(item.reviewStatus).toBe("draft");
    }
  });

  it("pass bank validation with no errors", () => {
    expect(checkBanks(ALL_BANKS).issues).toEqual([]);
  });

  it("share no exact item across any two banks", () => {
    const keys = ALL_BANKS.flatMap((b) =>
      b.items.map((i) => exactItemKey(i.spec)),
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("share no underlying number fact between the independent/delayed banks and earlier banks", () => {
    expect(checkBanks(ALL_BANKS).equivalenceWarnings).toEqual([]);
  });

  it("use unique item ids and mark each item for its own bank", () => {
    const ids = ALL_BANKS.flatMap((b) => b.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const bank of ALL_BANKS) {
      for (const item of bank.items) expect(item.eligibleBank).toBe(bank.phase);
    }
  });

  it("every item is solvable: its own answer evaluates as correct", () => {
    for (const bank of ALL_BANKS) {
      for (const item of bank.items) {
        expect(evaluateResponse(item, item.answer).status).toBe("correct");
      }
    }
  });

  it("independent and delayed banks only test subtraction (S03/S04)", () => {
    for (const bank of [INDEPENDENT_BANK, DELAYED_BANK]) {
      for (const item of bank.items)
        expect(["S03", "S04"]).toContain(item.skillId);
    }
  });

  it("are frozen", () => {
    expect(Object.isFrozen(BASELINE_BANK)).toBe(true);
    expect(Object.isFrozen(BASELINE_BANK.items)).toBe(true);
  });
});

describe("bank validation catches integrity problems", () => {
  const codes = (banks: QuestionBank[]) =>
    checkBanks(banks).issues.map((i) => i.code);

  it("detects an exact item reused across banks", () => {
    const reused = asBank(INDEPENDENT_BANK, {
      items: [
        {
          ...GUIDED_PRACTICE_BANK.items[6],
          eligibleBank: "independent",
          id: "IN-X",
        },
        ...INDEPENDENT_BANK.items,
      ],
    });
    expect(
      codes([BASELINE_BANK, GUIDED_PRACTICE_BANK, reused, DELAYED_BANK]),
    ).toContain("duplicate-item");
  });

  it("detects duplicate ids", () => {
    const dup = asBank(DELAYED_BANK, {
      items: [
        { ...DELAYED_BANK.items[0], id: "BL-01" },
        ...DELAYED_BANK.items.slice(1),
      ],
    });
    expect(
      codes([BASELINE_BANK, GUIDED_PRACTICE_BANK, INDEPENDENT_BANK, dup]),
    ).toContain("duplicate-id");
  });

  it("detects an item placed in the wrong bank", () => {
    const wrong = asBank(DELAYED_BANK, { items: INDEPENDENT_BANK.items });
    expect(
      codes([BASELINE_BANK, GUIDED_PRACTICE_BANK, INDEPENDENT_BANK, wrong]),
    ).toContain("wrong-bank");
  });

  it("detects missing, duplicated and empty banks and version drift", () => {
    expect(
      codes([BASELINE_BANK, GUIDED_PRACTICE_BANK, INDEPENDENT_BANK]),
    ).toContain("missing-bank");
    expect(codes([...ALL_BANKS, BASELINE_BANK])).toContain("duplicate-bank");
    expect(
      codes([asBank(BASELINE_BANK, { items: [] }), ...ALL_BANKS.slice(1)]),
    ).toContain("empty-bank");
    expect(
      codes([
        asBank(BASELINE_BANK, { contentVersion: "old" }),
        ...ALL_BANKS.slice(1),
      ]),
    ).toContain("version-mismatch");
  });

  it("warns about equivalent-but-different items without rejecting them", () => {
    // BL-07 is 12 − 7. 12 − 5 uses the same three numbers.
    const similar = asBank(INDEPENDENT_BANK, {
      items: [
        {
          ...INDEPENDENT_BANK.items[2],
          id: "IN-SIM",
          spec: { type: "subtract-cross-ten", start: 12, takeAway: 5 },
          answer: 7,
        },
      ],
    });
    const report = checkBanks([
      BASELINE_BANK,
      GUIDED_PRACTICE_BANK,
      similar,
      DELAYED_BANK,
    ]);
    expect(report.issues).toEqual([]);
    expect(report.equivalenceWarnings).toEqual([
      { itemIds: ["BL-07", "IN-SIM"], phases: ["baseline", "independent"] },
    ]);
  });
});

describe("exact versus equivalent item keys", () => {
  it("treats numerically different questions as different", () => {
    expect(
      exactItemKey({ type: "subtract-take-away", start: 9, takeAway: 4 }),
    ).not.toBe(
      exactItemKey({ type: "subtract-take-away", start: 9, takeAway: 5 }),
    );
  });

  it("recognises the same number fact in different forms", () => {
    expect(equivalentItemKey({ type: "compose", partA: 4, partB: 3 })).toBe(
      equivalentItemKey({ type: "compose", partA: 3, partB: 4 }),
    );
    expect(equivalentItemKey({ type: "compose", partA: 4, partB: 3 })).toBe(
      equivalentItemKey({ type: "decompose", total: 7, knownPart: 3 }),
    );
    expect(
      equivalentItemKey({ type: "subtract-take-away", start: 9, takeAway: 4 }),
    ).toBe(
      equivalentItemKey({ type: "subtract-take-away", start: 9, takeAway: 5 }),
    );
  });

  it("does not confuse different structures", () => {
    expect(
      equivalentItemKey({ type: "subtract-take-away", start: 9, takeAway: 4 }),
    ).not.toBe(
      equivalentItemKey({ type: "subtract-take-away", start: 10, takeAway: 5 }),
    );
  });
});

describe("learner-facing projection", () => {
  const FORBIDDEN = [
    "answer",
    "expected",
    "hint",
    "solution",
    "skill",
    "bank",
    "review",
    "key",
  ];

  function allKeys(value: unknown, out: string[] = []): string[] {
    if (typeof value === "object" && value !== null) {
      for (const [k, v] of Object.entries(value)) {
        out.push(k);
        allKeys(v, out);
      }
    }
    return out;
  }

  it("exposes no answer, hint, skill, or bank field for any item in any bank", () => {
    for (const bank of ALL_BANKS) {
      for (const item of bank.items) {
        const keys = allKeys(toLearnerView(item)).map((k) => k.toLowerCase());
        for (const banned of FORBIDDEN) {
          expect(keys.some((k) => k.includes(banned))).toBe(false);
        }
      }
    }
  });

  it("does not include the answer value for items where it is not itself the stimulus", () => {
    for (const item of INDEPENDENT_BANK.items) {
      const view = toLearnerView(item);
      expect(Object.values(view.stimulus)).not.toContain(item.answer);
    }
  });

  it("shows the displayed numbers and is a frozen copy", () => {
    const item = BASELINE_BANK.items.find((i) => i.id === "BL-07")!;
    const view = toLearnerView(item);
    expect(view).toEqual({
      itemId: "BL-07",
      contentVersion: item.contentVersion,
      representation: "numeric",
      stimulus: { kind: "take-away", start: 12, takeAway: 7 },
    });
    expect(Object.isFrozen(view)).toBe(true);
  });

  it("projects every problem type", () => {
    const kinds = new Set(
      ALL_BANKS.flatMap((b) => b.items).map(
        (i) => toLearnerView(i).stimulus.kind,
      ),
    );
    expect([...kinds].sort()).toEqual([
      "combine",
      "count-objects",
      "find-missing-part",
      "take-away",
    ]);
  });
});

describe("question banks carry no hints", () => {
  it("has no hint-like property on any bank or item", () => {
    const text = JSON.stringify(ALL_BANKS).toLowerCase();
    expect(text).not.toContain("hint");
  });
});
