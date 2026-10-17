import type { ThemeId } from "@/themes";

/**
 * Presentation-only registry for the welcome / interest-selection flow.
 *
 * This is NOT the mission theme contract (src/themes). It only describes how an
 * interest looks and sounds on the welcome screens. It has no authority over
 * mathematics: the numbers come from the single DEMO_NUMBERS constant below, no
 * answer is stored, and nothing here reaches scoring, tutoring or evidence.
 * Statically authored; plain strings only.
 */
export const INTEREST_IDS = [
  "cricket",
  "building",
  "space",
  "basketball",
  "soccer",
] as const;
export type InterestId = (typeof INTEREST_IDS)[number];

/** Choosing "Surprise me" is a choice of the picker, not a sixth interest. */
export const SURPRISE_ID = "surprise" as const;
export type Choice = InterestId | typeof SURPRISE_ID;

/** The one worked example every preview tells. Shown as a question, never an answer. */
export const DEMO_NUMBERS = Object.freeze({ start: 13, takeAway: 5 });

export interface InterestConfig {
  readonly id: InterestId;
  readonly title: string;
  /** One short line on the choice card. */
  readonly cardLine: string;
  readonly worldName: string;
  /** CSS class that sets this interest's palette. */
  readonly className: string;
  /** Contains {start} and {takeAway}. */
  readonly story: string;
  readonly question: string;
  readonly resourceNoun: string;
  readonly environment: string;
  readonly guideName: string;
  readonly guideDescription: string;
  readonly artStyle: string;
  /**
   * The existing draft mission that is already playable for this interest, or
   * null when no playable version exists yet. The link is offered separately
   * and is clearly not tailored by the preview.
   */
  readonly existingMission: {
    readonly themeId: ThemeId;
    readonly href: string;
  } | null;
}

export const INTERESTS: readonly InterestConfig[] = Object.freeze([
  {
    id: "cricket",
    title: "Cricket",
    cardLine: "Bats, balls and a busy practice field.",
    worldName: "Cricket Academy",
    className: "interest-cricket",
    story:
      "A cricket coach has {start} practice balls. {takeAway} are taken to the practice nets.",
    question: "How many balls remain in the basket?",
    resourceNoun: "practice balls",
    environment: "A sunny cricket field with practice nets and a ball basket.",
    guideName: "Coach Bails",
    guideDescription: "A friendly coach in a sun cap, holding a clipboard.",
    artStyle: "cricket-field",
    existingMission: null,
  },
  {
    id: "building",
    title: "Building",
    cardLine: "Blocks, bridges and big repairs.",
    worldName: "Block Builder",
    className: "interest-building",
    story:
      "There are {start} blocks in a crate. {takeAway} are used to repair a bridge.",
    question: "How many blocks remain in the crate?",
    resourceNoun: "wooden blocks",
    environment: "A river canyon with a broken bridge and a block crate.",
    guideName: "Bolt",
    guideDescription: "A cheerful builder in a yellow hard hat.",
    artStyle: "bridge-canyon",
    existingMission: { themeId: "block-builder", href: "/block-builder" },
  },
  {
    id: "space",
    title: "Space",
    cardLine: "Stations, planets and a helpful robot.",
    worldName: "Space Explorer",
    className: "interest-space",
    story:
      "A space station has {start} repair modules. {takeAway} are installed.",
    question: "How many modules remain in storage?",
    resourceNoun: "repair modules",
    environment: "A space station orbiting two planets, with a storage bay.",
    guideName: "Orbi",
    guideDescription: "A small round robot with a glowing visor.",
    artStyle: "space-station",
    existingMission: {
      themeId: "space-construction",
      href: "/space-construction",
    },
  },
  {
    id: "basketball",
    title: "Basketball",
    cardLine: "Hoops, courts and a rack of balls.",
    worldName: "Basketball Challenge",
    className: "interest-basketball",
    story:
      "There are {start} basketballs in the equipment rack. {takeAway} are taken onto the court.",
    question: "How many basketballs remain in the rack?",
    resourceNoun: "basketballs",
    environment: "An indoor court with a hoop and an equipment rack.",
    guideName: "Coach Dribbles",
    guideDescription: "An upbeat coach in a headband holding a whistle.",
    artStyle: "indoor-court",
    existingMission: null,
  },
  {
    id: "soccer",
    title: "Soccer",
    cardLine: "Goals, fields and a training day.",
    worldName: "Soccer Quest",
    className: "interest-soccer",
    story:
      "There are {start} soccer balls in storage. {takeAway} go to the training field.",
    question: "How many soccer balls remain in storage?",
    resourceNoun: "soccer balls",
    environment: "A grass training field with a goal and a ball storage bag.",
    guideName: "Coach Kicks",
    guideDescription: "A friendly coach in a green jersey with a cone.",
    artStyle: "training-field",
    existingMission: null,
  },
] satisfies InterestConfig[]);

export function getInterest(id: InterestId): InterestConfig {
  const found = INTERESTS.find((i) => i.id === id);
  if (found === undefined) throw new Error(`Unknown interest: ${id}`);
  return found;
}

export const SURPRISE = Object.freeze({
  id: SURPRISE_ID,
  title: "Surprise me",
  cardLine: "No preference? Primer will pick one.",
  className: "interest-surprise",
});

/** Picks one interest. `random` is injectable so tests are deterministic. */
export function pickSurprise(random: () => number = Math.random): InterestId {
  const i = Math.min(
    INTEREST_IDS.length - 1,
    Math.floor(random() * INTEREST_IDS.length),
  );
  return INTEREST_IDS[i];
}
