import type { Metadata } from "next";
import "./globals.css";
import { RouteFocus } from "@/components/brand/RouteFocus";

export const metadata: Metadata = {
  title: "Primer — interest-personalized math for ages 6–9",
  description:
    "Primer is an early draft of an interest-personalized mathematics adventure for children ages 6–9, starting with subtraction within 20.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <RouteFocus />
        {children}
      </body>
    </html>
  );
}
