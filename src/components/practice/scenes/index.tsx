import type { ThemeId } from "@/themes";
import { BridgeScene } from "./BridgeScene";
import { SpaceScene } from "./SpaceScene";
import type { ConstructionProgress } from "./progress";

/** Picks the decorative artwork for a theme. Presentation only. */
export function Scene({
  themeId,
  progress,
}: {
  themeId: ThemeId;
  progress: ConstructionProgress;
}) {
  return themeId === "space-construction" ? (
    <SpaceScene progress={progress} />
  ) : (
    <BridgeScene progress={progress} />
  );
}
