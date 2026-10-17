/**
 * DRAFT make-ten lab: pure, presentation-neutral rules for an adult-operated,
 * educator-review-gated instructional hypothesis (docs/EDUCATOR-REVIEW-PACKET.md,
 * section 6C). No theme words live here: a world supplies nouns and art.
 *
 * This is NOT the tutoring policy and is not connected to scoring, sessions,
 * hints or evidence. It runs entirely in the browser and keeps nothing.
 *
 * It is not a second evaluator either. Every question is checked against the
 * objects currently on screen (how many are outside the rack, how many spots are
 * still empty, how many are still in the rack), never against a stored answer.
 * The lesson deliberately uses 13 − 5, the numbers of the public Cricket mission
 * (guided-practice item GP-07, whose numbers every world already shows); it does
 * not import or reuse any bank record. The unguided try (11 − 4) shares no
 * starting number with any baseline, practice, check or delayed item
 * (tests/unit/make-ten-lab.test.ts checks this).
 */

export const RACK = 10;

export interface MakeTenProblem {
  readonly total: number;
  readonly take: number;
}

/** The lesson the guided steps walk through. */
export const LESSON_PROBLEM: MakeTenProblem = { total: 13, take: 5 };
/** The separate, unguided try in the last step. */
export const APPLY_PROBLEM: MakeTenProblem = { total: 11, take: 4 };

/** A teen number minus an amount bigger than its extras: the take crosses ten. */
export function isCrossTenProblem(p: MakeTenProblem): boolean {
  return (
    Number.isInteger(p.total) &&
    Number.isInteger(p.take) &&
    p.total > RACK &&
    p.total < 2 * RACK &&
    p.take > p.total - RACK &&
    p.take <= RACK
  );
}

export type Place = "pile" | "rack" | "nets";
export type LabStep = 1 | 2 | 3 | 4 | 5;
export const LAST_STEP: LabStep = 5;
/** extras: how many are outside the full rack. more: how many more are needed. left: how many stay in the rack. apply: the unguided try. */
export type Question = "extras" | "more" | "left" | "apply";

interface Snapshot {
  readonly step: LabStep;
  readonly problem: MakeTenProblem;
  /** Where each object is; index 0 is object 1. */
  readonly places: readonly Place[];
  /** Objects moved from the rack in step 3, in order. */
  readonly fromRack: readonly number[];
  /** Objects the learner marked while counting (a counting aid; no number is ever shown for it). Any move clears the marks. */
  readonly marked: readonly number[];
  /** The learner's current number for each question. Moving an object clears the answer it was about. */
  readonly answers: Readonly<Partial<Record<Question, number>>>;
  /**
   * How many numbers the learner has tried for each question while the picture
   * stayed the same. Only used to offer more counting support after repeated
   * mix-ups; never a score, never saved. Moving an object starts the count again.
   */
  readonly tries: Readonly<Partial<Record<Question, number>>>;
}

export interface LabState extends Snapshot {
  /** The state at the end of each earlier step, so "Back" restores it exactly. */
  readonly history: readonly Snapshot[];
}

function fresh(step: LabStep, problem: MakeTenProblem): Snapshot {
  return {
    step,
    problem,
    places: Array.from({ length: problem.total }, () => "pile" as Place),
    fromRack: [],
    marked: [],
    answers: {},
    tries: {},
  };
}

export function initialLab(): LabState {
  return { ...fresh(1, LESSON_PROBLEM), history: [] };
}

export const countAt = (s: Snapshot, place: Place) =>
  s.places.filter((p) => p === place).length;

function move(s: LabState, i: number, to: Place, clear?: Question): LabState {
  const answers = { ...s.answers };
  const tries = { ...s.tries };
  if (clear) {
    delete answers[clear];
    delete tries[clear];
  }
  // The groups changed, so counting marks no longer describe them.
  return {
    ...s,
    places: s.places.map((p, j) => (j === i ? to : p)),
    marked: [],
    answers,
    tries,
  };
}

/**
 * The group the open question asks the learner to count, whose objects can be
 * marked while counting. "More" counts empty spots, which are not objects. The
 * unguided try ("apply") offers no counting aid, so it stays as it was.
 */
export function countedGroup(s: Snapshot): Place | null {
  switch (openQuestion(s)) {
    case "extras":
      return "pile";
    case "left":
      return "rack";
    default:
      return null;
  }
}

/** What pressing object `i` (0-based) moves, if anything, in the current step. */
function moveBall(s: LabState, i: number): LabState {
  const here = s.places[i];
  if (here === undefined) return s;
  const nets = countAt(s, "nets");
  switch (s.step) {
    case 1:
      if (here === "pile" && countAt(s, "rack") < RACK)
        return move(s, i, "rack", "extras");
      if (here === "rack") return move(s, i, "pile", "extras");
      return s;
    case 2:
      if (here === "pile") return move(s, i, "nets", "more");
      if (here === "nets") return move(s, i, "pile", "more");
      return s;
    case 3:
      if (here === "rack" && nets < s.problem.take)
        return { ...move(s, i, "nets"), fromRack: [...s.fromRack, i] };
      if (here === "nets" && s.fromRack.includes(i))
        return {
          ...move(s, i, "rack"),
          fromRack: s.fromRack.filter((b) => b !== i),
        };
      return s;
    case 4:
      return s;
    case 5:
      if (here === "pile" && nets < s.problem.take)
        return move(s, i, "nets", "apply");
      if (here === "nets") return move(s, i, "pile", "apply");
      return s;
  }
}

/** True when object `i` is in the group being counted, so pressing it marks it. */
export function isMarkable(s: Snapshot, i: number): boolean {
  const g = countedGroup(s);
  return g !== null && s.places[i] === g;
}

/**
 * What pressing object `i` (0-based) does in the current step: move it, or, when
 * it cannot move but belongs to the group being counted, mark or unmark it.
 * Anything else returns `s` unchanged.
 */
export function pressBall(s: LabState, i: number): LabState {
  const moved = moveBall(s, i);
  if (moved !== s) return moved;
  if (!isMarkable(s, i)) return s;
  return {
    ...s,
    marked: s.marked.includes(i)
      ? s.marked.filter((b) => b !== i)
      : [...s.marked, i],
  };
}

/** True when pressing object `i` would do something now (so the control can be enabled). */
export function canPress(s: LabState, i: number): boolean {
  return pressBall(s, i) !== s;
}

/** Which question, if any, the picture is ready for. */
export function openQuestion(s: Snapshot): Question | null {
  switch (s.step) {
    case 1:
      return countAt(s, "rack") === RACK ? "extras" : null;
    case 2:
      return countAt(s, "pile") === 0 ? "more" : null;
    case 3:
      return null;
    case 4:
      return "left";
    case 5:
      return countAt(s, "nets") === s.problem.take ? "apply" : null;
  }
}

/** The number the picture on screen shows for a question. Read from the objects, not stored. */
export function shownBy(s: Snapshot, q: Question): number {
  switch (q) {
    case "extras":
      return countAt(s, "pile");
    case "more":
      return s.problem.take - countAt(s, "nets");
    case "left":
      return countAt(s, "rack") + countAt(s, "pile");
    case "apply":
      return countAt(s, "pile");
  }
}

/** A local check only; nothing is scored, saved or sent anywhere. */
export function chooseAnswer(s: LabState, q: Question, n: number): LabState {
  if (openQuestion(s) !== q || !Number.isInteger(n) || n < 0) return s;
  const tries =
    n === shownBy(s, q) ? s.tries : { ...s.tries, [q]: (s.tries[q] ?? 0) + 1 };
  return { ...s, answers: { ...s.answers, [q]: n }, tries };
}

/** Wrong numbers tried for `q` since the picture last changed. */
export const triesFor = (s: Snapshot, q: Question) => s.tries[q] ?? 0;

export function isRight(s: Snapshot, q: Question): boolean {
  return openQuestion(s) === q && s.answers[q] === shownBy(s, q);
}

/** What still has to happen before "Next step" works, or null when it can. */
export type Needs =
  "fill-rack" | "move-extras" | "fill-nets" | "answer" | "last-step";

export function nextNeeds(s: LabState): Needs | null {
  switch (s.step) {
    case 1:
      if (countAt(s, "rack") < RACK) return "fill-rack";
      return isRight(s, "extras") ? null : "answer";
    case 2:
      if (countAt(s, "pile") > 0) return "move-extras";
      return isRight(s, "more") ? null : "answer";
    case 3:
      return countAt(s, "nets") < s.problem.take ? "fill-nets" : null;
    case 4:
      return isRight(s, "left") ? null : "answer";
    case 5:
      return "last-step";
  }
}

export const canAdvance = (s: LabState) => nextNeeds(s) === null;

export function advance(s: LabState): LabState {
  if (!canAdvance(s)) return s;
  const { history, ...now } = s;
  const step = (s.step + 1) as LabStep;
  const next: Snapshot =
    step === LAST_STEP
      ? fresh(step, APPLY_PROBLEM)
      : { ...now, step, marked: [] };
  return { ...next, history: [...history, now] };
}

/** Return to the end of the previous step, exactly as it was left. */
export function back(s: LabState): LabState {
  const prev = s.history[s.history.length - 1];
  if (prev === undefined) return s;
  return { ...prev, history: s.history.slice(0, -1) };
}

export interface Recap {
  readonly total: number;
  readonly extras: number;
  readonly fromRack: number;
  readonly take: number;
  readonly left: number;
}

/**
 * The lesson's numbers as the learner produced them, for the closing summary.
 * Only available once the learner has said, correctly, how many are left, so
 * the summary never states the result first and never describes an action
 * that the recorded state does not show.
 */
export function recap(s: Snapshot): Recap | null {
  if (s.step !== 4 || !isRight(s, "left")) return null;
  const nets = countAt(s, "nets");
  return {
    total: s.problem.total,
    extras: nets - s.fromRack.length,
    fromRack: s.fromRack.length,
    take: nets,
    left: shownBy(s, "left"),
  };
}
