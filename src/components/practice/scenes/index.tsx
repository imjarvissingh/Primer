import type { ThemeId } from "@/themes";
import { BridgeScene } from "./BridgeScene";
import { SpaceScene } from "./SpaceScene";
import { BasketballScene, CricketScene, SoccerScene } from "./SportsScenes";
import type { ConstructionProgress } from "./progress";

const SCENES: Record<
  ThemeId,
  (props: { progress: ConstructionProgress }) => React.ReactNode
> = {
  "block-builder": BridgeScene,
  "space-construction": SpaceScene,
  "cricket-academy": CricketScene,
  "basketball-challenge": BasketballScene,
  "soccer-quest": SoccerScene,
};

/** Picks the decorative artwork for a theme. Presentation only. */
export function Scene({
  themeId,
  progress,
}: {
  themeId: ThemeId;
  progress: ConstructionProgress;
}) {
  const Art = SCENES[themeId];
  return <Art progress={progress} />;
}
