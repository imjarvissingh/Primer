import type { Metadata } from "next";
import { MissionPage } from "@/components/practice/MissionPage";
import { BASKETBALL_THEME } from "@/themes";

export const metadata: Metadata = {
  title: "Court Practice — Primer Basketball demo",
  description:
    "A draft demonstration of one Basketball practice mission: subtraction within 20.",
};

export default function BasketballPage() {
  return <MissionPage theme={BASKETBALL_THEME} />;
}
