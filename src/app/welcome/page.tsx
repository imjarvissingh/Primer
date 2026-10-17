import type { Metadata } from "next";
import { SiteHeader } from "@/components/brand/SiteHeader";
import { WelcomeFlow } from "@/components/welcome/WelcomeFlow";

export const metadata: Metadata = {
  title: "Welcome to Primer — choose what your child loves",
  description:
    "A draft, adult-guided preview: choose an interest and see the same subtraction story told five ways.",
  robots: { index: false, follow: false },
};

export default function WelcomePage() {
  return (
    <main
      id="main"
      className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8"
    >
      <SiteHeader showInterestLink={false} />
      <WelcomeFlow />
    </main>
  );
}
