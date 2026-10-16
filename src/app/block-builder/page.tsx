import type { Metadata } from "next";
import { MissionPage } from "@/components/practice/MissionPage";
import { BridgeScene } from "@/components/practice/scenes/BridgeScene";
import { BLOCK_BUILDER_THEME } from "@/themes";

export const metadata: Metadata = {
  title: "The Broken Bridge — Primer Block Builder demo",
  description:
    "A draft demonstration of one Block Builder practice mission: subtraction within 20.",
};

export default function BlockBuilderPage() {
  return <MissionPage theme={BLOCK_BUILDER_THEME} scene={<BridgeScene />} />;
}
