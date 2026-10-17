import type { Metadata } from "next";
import { MissionPage } from "@/components/practice/MissionPage";
import { CRICKET_THEME } from "@/themes";

export const metadata: Metadata = {
  title: "Practice at the Nets — Primer Cricket demo",
  description:
    "A draft demonstration of one Cricket practice mission: subtraction within 20.",
};

export default function CricketPage() {
  return <MissionPage theme={CRICKET_THEME} />;
}
