import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Planner",
  description: "Next.js + Prisma + SQLite eksempel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body>{children}</body>
    </html>
  );
}
