import type { Metadata } from "next";
import "./globals.css";

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
      "Autonomous incident response agent that catches its own hallucinations before reporting.",
    type: "website",
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
        {children}
      </body>
    </html>
  );
}
