import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Will I Gap It?",
  description: "Closed-course car matchup calculator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
