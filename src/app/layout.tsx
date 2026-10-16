import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Primer — interest-personalized math for ages 6–9",
  description:
    "Primer is a planned interest-personalized mathematics adventure for children ages 6–9, starting with subtraction within 20.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
