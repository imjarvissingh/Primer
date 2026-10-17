import type { Metadata } from "next";
import { MissionPage } from "@/components/practice/MissionPage";
import { SOCCER_THEME } from "@/themes";

export const metadata: Metadata = {
  title: "Training Day — Primer Soccer demo",
  description:
    "A draft demonstration of one Soccer practice mission: subtraction within 20.",
};

export default function SoccerPage() {
  return <MissionPage theme={SOCCER_THEME} />;
}
