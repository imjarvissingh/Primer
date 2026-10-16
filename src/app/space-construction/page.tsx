import type { Metadata } from "next";
import { MissionPage } from "@/components/practice/MissionPage";
import { SpaceScene } from "@/components/practice/scenes/SpaceScene";
import { SPACE_CONSTRUCTION_THEME } from "@/themes";

export const metadata: Metadata = {
  title: "The Space Station Mission — Primer Space Construction demo",
  description:
    "A draft demonstration of one Space Construction practice mission: subtraction within 20.",
};

export default function SpaceConstructionPage() {
  return (
    <MissionPage theme={SPACE_CONSTRUCTION_THEME} scene={<SpaceScene />} />
  );
}
