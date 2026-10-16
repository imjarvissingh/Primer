/**
 * Presentation-only theme definitions. A theme changes words, nouns, colors
 * and artwork. It has NO mathematical authority: no answers, no problem
 * parameters, no scoring, no tutoring or assessment settings. The numbers in a
 * story come from the server's challenge via the {start} and {takeAway}
 * placeholders. Statically authored; plain strings only.
 */
export const THEME_IDS = ["block-builder", "space-construction"] as const;
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
  outcomeTitle: "The station is ready!",
  outcomeThanks: "Thank you for helping the space engineer.",
});

export const THEMES: readonly ThemeConfig[] = Object.freeze([
  BLOCK_BUILDER_THEME,
  SPACE_CONSTRUCTION_THEME,
]);

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
