import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "fortedigital.com MVP",
  description: "Initial Sprint 1 foundation for website + admin.",
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
