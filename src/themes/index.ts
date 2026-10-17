/**
 * Presentation-only theme definitions. A theme changes words, nouns, colors
 * and artwork. It has NO mathematical authority: no answers, no problem
 * parameters, no scoring, no tutoring or assessment settings. The numbers in a
 * story come from the server's challenge via the {start} and {takeAway}
 * placeholders. Statically authored; plain strings only.
 */
export const THEME_IDS = [
  "block-builder",
  "space-construction",
  "cricket-academy",
  "basketball-challenge",
  "soccer-quest",
] as const;
export type ThemeId = (typeof THEME_IDS)[number];

/** The only placeholders a story template may contain. */
export const STORY_PLACEHOLDERS = ["{start}", "{takeAway}"] as const;

export interface ThemeVocabulary {
  /** "block", "module" */
  readonly singular: string;
  readonly plural: string;
  /** Heading of the area where items wait: "Block pile". */
  readonly supplyHeading: string;
  /** Short noun for that area, used in sentences: "pile" -> "the pile". */
  readonly supplyNoun: string;
  /** Where waiting items are: "in the pile". */
  readonly supplyPlace: string;
  /** Heading of the construction area: "On the bridge". */
  readonly builtHeading: string;
  /** Where used items are: "on the bridge". */
  readonly builtPlace: string;
}

/** Which drawn object a theme's resources use. Presentation only. */
export const ITEM_ARTS = [
  "block",
  "module",
  "cricket-ball",
  "basketball",
  "soccer-ball",
] as const;
export type ItemArtId = (typeof ITEM_ARTS)[number];

/** Which drawn guide a theme uses. Presentation only. */
export const GUIDE_LOOKS = [
  "tinker",
  "orbi",
  "coach-cap",
  "coach-headband",
  "coach-beanie",
] as const;
export type GuideLook = (typeof GUIDE_LOOKS)[number];

/**
 * A themed guide: a name, a drawing, and one fixed line for each of four game
 * moments. The lines are authored text, never generated, carry no numbers, and
 * never praise or judge the learner: "again" is neutral, and "done" thanks the
 * learner for helping rather than saying how they did.
 */
export interface ThemeGuide {
  readonly name: string;
  readonly look: GuideLook;
  /** Nothing placed yet. */
  readonly welcome: string;
  /** Resources are being moved. */
  readonly working: string;
  /** After an answer that was not yet right, or help was shown. */
  readonly again: string;
  /** After the mission is finished with the right answer. */
  readonly done: string;
}

export interface ThemeConfig {
  readonly id: ThemeId;
  readonly displayName: string;
  readonly missionTitle: string;
  readonly href: string;
  /** CSS class on the mission wrapper that sets this theme's colors. */
  readonly className: string;
  /** Home page card. */
  readonly cardDescription: string;
  readonly cardLinkLabel: string;
  readonly intro: string;
  /** One friendly sentence naming what the learner is building toward. */
  readonly goal: string;
  readonly startLabel: string;
  readonly playHeading: string;
  /** Contains {start} and {takeAway}. */
  readonly story: string;
  readonly vocabulary: ThemeVocabulary;
  readonly itemArt: ItemArtId;
  readonly guide: ThemeGuide;
  readonly outcomeTitle: string;
  readonly outcomeThanks: string;
}

export const BLOCK_BUILDER_THEME: ThemeConfig = Object.freeze({
  id: "block-builder",
  displayName: "Block Builder",
  missionTitle: "The Broken Bridge",
  href: "/block-builder",
  className: "theme-bridge",
  cardDescription: "Build bridges and structures while practicing subtraction.",
  cardLinkLabel: "Try The Broken Bridge",
  intro:
    "Oh no! The bridge has a gap in it. Help the builder fix it with blocks.",
  goal: "Your goal: fill the gap in the bridge so everyone can cross the river.",
  startLabel: "Start building",
  playHeading: "Fix the bridge",
  story:
    "The builder has {start} blocks. The team uses {takeAway} of them on the bridge.",
  vocabulary: Object.freeze({
    singular: "block",
    plural: "blocks",
    supplyHeading: "Block pile",
    supplyNoun: "pile",
    supplyPlace: "in the pile",
    builtHeading: "On the bridge",
    builtPlace: "on the bridge",
  }),
  itemArt: "block",
  guide: Object.freeze({
    name: "Tinker",
    look: "tinker",
    welcome: "Hi, I am Tinker! Let us fix the bridge together.",
    working: "Nice and steady. Keep building.",
    again: "Let us take another look together.",
    done: "The bridge is fixed. Thank you for helping!",
  }),
  outcomeTitle: "The bridge is fixed!",
  outcomeThanks: "Thank you for helping the builder.",
});

export const SPACE_CONSTRUCTION_THEME: ThemeConfig = Object.freeze({
  id: "space-construction",
  displayName: "Space Construction",
  missionTitle: "The Space Station Mission",
  href: "/space-construction",
  className: "theme-space",
  cardDescription: "Assemble a space station while practicing subtraction.",
  cardLinkLabel: "Try The Space Station Mission",
  intro:
    "The space station is only half built! Help the space engineer finish it with modules.",
  goal: "Your goal: add the missing modules so the space station is complete.",
  startLabel: "Start the mission",
  playHeading: "Build the station",
  story:
    "The space engineer has {start} modules. The crew uses {takeAway} of them to build part of the station.",
  vocabulary: Object.freeze({
    singular: "module",
    plural: "modules",
    supplyHeading: "Module supply",
    supplyNoun: "supply",
    supplyPlace: "in the supply",
    builtHeading: "On the station",
    builtPlace: "on the station",
  }),
  itemArt: "module",
  guide: Object.freeze({
    name: "Orbi",
    look: "orbi",
    welcome: "Hello, I am Orbi! The station needs your help.",
    working: "Modules are going in. Keep going.",
    again: "Let us look at this together.",
    done: "The station is ready. Thank you for helping!",
  }),
  outcomeTitle: "The station is ready!",
  outcomeThanks: "Thank you for helping the space engineer.",
});

export const CRICKET_THEME: ThemeConfig = Object.freeze({
  id: "cricket-academy",
  displayName: "Cricket Academy",
  missionTitle: "Practice at the Nets",
  href: "/cricket",
  className: "theme-cricket",
  cardDescription:
    "Bring practice balls to the nets while practicing subtraction.",
  cardLinkLabel: "Try Practice at the Nets",
  intro:
    "The practice nets are empty! Help the coach bring balls from the basket.",
  goal: "Your goal: put the practice balls at the nets so the team can start.",
  startLabel: "Start practice",
  playHeading: "Fill the practice nets",
  story:
    "The coach has {start} practice balls in a basket. {takeAway} of them are taken to the practice nets.",
  vocabulary: Object.freeze({
    singular: "ball",
    plural: "balls",
    supplyHeading: "Ball basket",
    supplyNoun: "basket",
    supplyPlace: "in the basket",
    builtHeading: "At the nets",
    builtPlace: "at the nets",
  }),
  itemArt: "cricket-ball",
  guide: Object.freeze({
    name: "Coach Bails",
    look: "coach-cap",
    welcome: "Hello, I am Coach Bails! Let us set up the nets.",
    working: "Good teamwork. Keep going.",
    again: "Let us take another look together.",
    done: "The nets are ready. Thank you for helping!",
  }),
  outcomeTitle: "Practice can begin!",
  outcomeThanks: "Thank you for helping the coach.",
});

export const BASKETBALL_THEME: ThemeConfig = Object.freeze({
  id: "basketball-challenge",
  displayName: "Basketball Challenge",
  missionTitle: "Court Practice",
  href: "/basketball",
  className: "theme-basketball",
  cardDescription:
    "Bring basketballs onto the court while practicing subtraction.",
  cardLinkLabel: "Try Court Practice",
  intro:
    "The court is ready for practice! Help the coach bring basketballs from the rack.",
  goal: "Your goal: put the basketballs on the court so practice can begin.",
  startLabel: "Start court practice",
  playHeading: "Fill the court",
  story:
    "The coach has {start} basketballs in the equipment rack. {takeAway} of them are taken onto the court.",
  vocabulary: Object.freeze({
    singular: "basketball",
    plural: "basketballs",
    supplyHeading: "Equipment rack",
    supplyNoun: "rack",
    supplyPlace: "in the rack",
    builtHeading: "On the court",
    builtPlace: "on the court",
  }),
  itemArt: "basketball",
  guide: Object.freeze({
    name: "Coach Dribbles",
    look: "coach-headband",
    welcome: "Hi, I am Coach Dribbles! Let us get the court ready.",
    working: "Good teamwork. Keep going.",
    again: "Let us take another look together.",
    done: "The court is ready. Thank you for helping!",
  }),
  outcomeTitle: "The court is ready!",
  outcomeThanks: "Thank you for helping the coach.",
});

export const SOCCER_THEME: ThemeConfig = Object.freeze({
  id: "soccer-quest",
  displayName: "Soccer Quest",
  missionTitle: "Training Day",
  href: "/soccer",
  className: "theme-soccer",
  cardDescription:
    "Bring soccer balls to the training field while practicing subtraction.",
  cardLinkLabel: "Try Training Day",
  intro:
    "The training field is empty! Help the coach bring soccer balls from the storage bag.",
  goal: "Your goal: put the soccer balls on the field so training can start.",
  startLabel: "Start training",
  playHeading: "Set up the field",
  story:
    "The coach has {start} soccer balls in a storage bag. {takeAway} of them are taken to the training field.",
  vocabulary: Object.freeze({
    singular: "soccer ball",
    plural: "soccer balls",
    supplyHeading: "Storage bag",
    supplyNoun: "bag",
    supplyPlace: "in the bag",
    builtHeading: "On the field",
    builtPlace: "on the field",
  }),
  itemArt: "soccer-ball",
  guide: Object.freeze({
    name: "Coach Kicks",
    look: "coach-beanie",
    welcome: "Hey, I am Coach Kicks! Let us set up the field.",
    working: "Good teamwork. Keep going.",
    again: "Let us take another look together.",
    done: "The field is ready. Thank you for helping!",
  }),
  outcomeTitle: "Training can start!",
  outcomeThanks: "Thank you for helping the coach.",
});

export const THEMES: readonly ThemeConfig[] = Object.freeze([
  BLOCK_BUILDER_THEME,
  SPACE_CONSTRUCTION_THEME,
  CRICKET_THEME,
  BASKETBALL_THEME,
  SOCCER_THEME,
]);

export function getTheme(id: ThemeId): ThemeConfig {
  const found = THEMES.find((t) => t.id === id);
  if (found === undefined) throw new Error(`Unknown theme: ${id}`);
  return found;
}

/** Fills the two allowed placeholders with numbers from the server's challenge. */
export function fillStory(
  template: string,
  numbers: { start: number; takeAway: number },
): string {
  return template
    .replaceAll("{start}", String(numbers.start))
    .replaceAll("{takeAway}", String(numbers.takeAway));
}

/** "1 block", "3 blocks". */
export function countOf(n: number, vocab: ThemeVocabulary): string {
  return `${n} ${n === 1 ? vocab.singular : vocab.plural}`;
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
