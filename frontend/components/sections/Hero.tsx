"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Shield, XCircle, AlertTriangle } from "lucide-react";

const terminalLines = [
  { delay: 0,    text: "$ galaxy investigate /evidence/case-2026-047/", type: "command" },
  { delay: 400,  text: "Galaxy DFIR Agent v1.0  ·  Protocol SIFT", type: "header" },
  { delay: 700,  text: "Mounting memory.raw  (8.2 GB) ...", type: "info" },
  { delay: 1050, text: "Mounting disk.e01    (128 GB) ...", type: "info" },
  { delay: 1400, text: "Running: volatility3 windows.malfind", type: "info" },
  { delay: 1900, text: "──── AI Finding Proposed ───────────────", type: "divider" },
  { delay: 2100, text: "  PID 2841 (chrome.exe)  |  T1055.012", type: "finding" },
  { delay: 2350, text: "  Offset: 0xfff80000  |  COBALT_STRIKE_v4", type: "finding" },
  { delay: 2600, text: "  File:   AppData/Local/Temp/chrome_update.exe", type: "finding" },
  { delay: 2850, text: "  Action: ISOLATE HOST — Severity: CRITICAL", type: "finding-crit" },
  { delay: 3200, text: "──── Scrutinizer Active ────────────────", type: "divider" },
  { delay: 3400, text: "  [01] Classify ................ PASS ✓", type: "pass" },
  { delay: 3700, text: "  [02] Provenance .............. FAIL ✗", type: "fail" },
  { delay: 4000, text: "       offset 0xfff80000 → OUT OF RANGE", type: "error" },
  { delay: 4200, text: "       chrome_update.exe  → NOT IN DISK", type: "error" },
  { delay: 4500, text: "──── VERDICT: BLOCK ────────────────────", type: "block" },
  { delay: 4800, text: "  Finding suppressed. Analyst not notified.", type: "suppressed" },
  { delay: 5000, text: "  Audit entry SHA-256 chained. CoC intact.", type: "suppressed" },
];

const colorMap: Record<string, string> = {
  command:      "text-neon-green font-bold",
  header:       "text-white font-semibold",
  info:         "text-gray-500",
  divider:      "text-gray-700",
  finding:      "text-yellow-400",
  "finding-crit": "text-orange-400 font-semibold",
  pass:         "text-green-400",
  fail:         "text-red-400 font-bold",
  error:        "text-red-500",
  block:        "text-red-400 font-bold",
  suppressed:   "text-neon-green",
};

function TerminalLine({ text, type }: { text: string; type: string }) {
  return (
    <div className={`font-mono text-xs sm:text-sm leading-relaxed ${colorMap[type] ?? "text-gray-400"}`}>
      {text}
    </div>
  );
}

export default function Hero() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    terminalLines.forEach((line, idx) => {
      const t = setTimeout(() => {
        setVisibleLines((prev) => [...prev, idx]);
        if (idx === terminalLines.length - 1) setDone(true);
      }, line.delay);
      return () => clearTimeout(t);
    });
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid" />
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-neon-green/4 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-neon-blue/4 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-neon-purple/4 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: Copy ── */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              <span className="text-neon-green text-xs font-mono uppercase tracking-wider">
                FIND EVIL! Hackathon · SANS Institute 2026
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight">
                <span className="text-white">AI forensic agents </span>
                <span className="gradient-text-danger">hallucinate.</span>
                <br />
                <span className="gradient-text">Galaxy</span>
                <span className="text-white"> catches it.</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-xl leading-relaxed">
                Every finding Protocol SIFT proposes passes through a 5‑stage deterministic verifier —
                provenance, tool output, cross‑source correlation — before it reaches the analyst.
                Hallucinations are suppressed. The audit chain is unbroken.
              </p>
            </div>

            {/* Consequence callout */}
            <div className="glass-card p-5 space-y-3 max-w-lg border-l-2 border-l-red-500/40">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">Why it matters</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                A hallucinated memory offset or fabricated file path doesn&apos;t just waste analyst time —
                it can contaminate a criminal investigation, trigger wrongful host isolation,
                or invalidate evidence under chain‑of‑custody requirements.
                Once a hallucinated finding reaches a report, it&apos;s evidence spoliation.
              </p>
              <p className="text-sm font-mono text-neon-green">
                Galaxy suppresses hallucinations before they leave the pipeline.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-neon-green text-dark-900 font-bold rounded-xl hover:bg-neon-green/90 transition-all btn-primary shadow-lg shadow-neon-green/20 text-base"
              >
                See it catch one
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/5 text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all text-base"
              >
                View Audit Trail
              </Link>
            </div>
          </div>

          {/* ── Right: Terminal ── */}
          <div className="relative">
            <div className="animated-border shadow-2xl shadow-neon-green/10">
              <div className="bg-dark-800 rounded-xl overflow-hidden">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-dark-900/60">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-xs text-gray-500 font-mono">
                    galaxy — scrutinizer
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="status-dot" />
                    <span className="text-xs text-neon-green font-mono">ACTIVE</span>
                  </div>
                </div>

                {/* Lines */}
                <div className="p-5 space-y-[3px] min-h-[400px]">
                  {terminalLines.map((line, idx) => (
                    <div
                      key={idx}
                      className={`transition-all duration-300 ${
                        visibleLines.includes(idx)
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-1"
                      }`}
                    >
                      <TerminalLine text={line.text} type={line.type} />
                    </div>
                  ))}
                  {done && (
                    <div className="font-mono text-sm text-neon-green cursor-blink pt-1" />
                  )}
                </div>
              </div>
            </div>

            {/* Floating verdict badges */}
            {done && (
              <>
                <div className="absolute -top-4 -right-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono shadow-lg shadow-red-500/10">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  BLOCK · Provenance FAIL
                </div>
                <div className="absolute -bottom-4 -left-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-mono shadow-lg shadow-neon-green/10">
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  Chain of Custody: Preserved
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
