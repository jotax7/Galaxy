import type { Metadata } from "next";
import "./globals.css";
import AnnouncementBar from "@/components/AnnouncementBar";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Galaxy — Self-Skeptical AI Agent for SIFT Forensics",
  description:
    "Autonomous incident response agent built on Protocol SIFT that scrutinizes its own findings before reporting. Self-correction, traceable, audit-grade.",
  keywords: [
    "DFIR",
    "incident response",
    "SIFT Workstation",
    "Protocol SIFT",
    "AI forensics",
    "hallucination detection",
    "MITRE ATT&CK",
    "Galaxy",
  ],
  openGraph: {
    title: "Galaxy — Self-Skeptical AI Agent for SIFT Forensics",
    description:
      "AI forensic agents hallucinate. Galaxy catches it. Built for FIND EVIL! 2026.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Galaxy — Self-Skeptical AI Agent for SIFT Forensics",
    description:
      "AI forensic agents hallucinate. Galaxy catches it. Built for FIND EVIL! 2026.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <div className="scan-line" />

        {/* Fixed global header: announcement bar + nav */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <AnnouncementBar />
          <Nav />
        </div>

        {children}
      </body>
    </html>
  );
}
