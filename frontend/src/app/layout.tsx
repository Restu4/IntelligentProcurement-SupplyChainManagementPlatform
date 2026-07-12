import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartProcure AI - Intelligent Procurement Platform",
  description:
    "Enterprise-grade intelligent procurement and supply chain management platform powered by AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
