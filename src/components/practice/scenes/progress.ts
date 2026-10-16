/**
 * Read-only view of construction progress, handed to the decorative scenes.
 * It is derived from the one selection set in PracticeMission; scenes never
 * change it and never score anything. Completing the picture is NOT the same
 * as answering correctly: only the server decides that.
 */
export interface ConstructionProgress {
  /** Items currently in the construction area (the selection size). */
  readonly placed: number;
  /** Items the story asks to place (the challenge's takeAway). Null before a mission starts. */
  readonly required: number | null;
}

/** Before a mission starts (and on the home page): nothing placed, no slots. */
export const NOT_STARTED: ConstructionProgress = Object.freeze({
  placed: 0,
  required: null,
});

/**
 * One boolean per construction slot: true = built. Slots fill from the first
 * to the last as items are placed, so returning an item empties the last built
 * slot. Never more built slots than required, even if too many are placed.
 */
export function slotStates({ placed, required }: ConstructionProgress) {
  if (required === null) return [];
  const built = Math.max(0, Math.min(placed, required));
  return Array.from({ length: required }, (_, i) => i < built);
}

/** Splits [x, x + width] into `count` equal slots separated by `gap`. */
export function slotLayout(
  count: number,
  x: number,
  width: number,
  gap: number,
) {
  const w = (width - gap * (count - 1)) / count;
  return Array.from({ length: count }, (_, i) => ({
    x: x + i * (w + gap),
    w,
  }));
}
