"use client";

import { useState, useEffect, useRef } from "react";
import { XCircle, CheckCircle, AlertTriangle } from "lucide-react";

// Hallucinated finding — what Protocol SIFT (raw AI) would report
const hallucinatedLines = [
  { text: "$ volatility3 -f /evidence/memory.raw windows.malfind", type: "command" },
  { text: "Volatility 3 Framework 2.4.1", type: "info" },
  { text: "Progress: 100.00%", type: "info" },
  { text: "", type: "blank" },
  { text: "PID   Name        VPN          Size  Tag", type: "table-head" },
  { text: "2841  chrome.exe  0xfff80000   4096  VadS", type: "table-row-bad" },
  { text: "", type: "blank" },
  { text: "YARA: MALWARE_COBALTSTRIKE_BEACON_v4", type: "ioc" },
  { text: "", type: "blank" },
  { text: "Associated file found:", type: "label" },
  { text: "  AppData\\Local\\Temp\\chrome_update.exe", type: "ioc" },
  { text: "  Size: 408,192 bytes | Modified: 2024-01-14", type: "ioc" },
  { text: "", type: "blank" },
  { text: "Persistence via Run key:", type: "label" },
  { text: "  HKLM\\SOFTWARE\\Microsoft\\Windows\\", type: "ioc" },
  { text: "    CurrentVersion\\Run\\ChromeUpdater", type: "ioc" },
  { text: "", type: "blank" },
  { text: "Severity: CRITICAL", type: "severity" },
  { text: "Recommendation: Isolate host immediately.", type: "severity" },
];

// What Galaxy's scrutinizer outputs when it catches the hallucination
const scrutinizerLines = [
  { text: "[SCRUTINIZER] Evaluating AI finding...", type: "header" },
  { text: "", type: "blank" },
  { text: "Stage 01  Classify ......... PASS ✓", type: "pass" },
  { text: "  → T1055.012 (Process Hollowing)", type: "detail" },
  { text: "  → Severity: CRITICAL  |  auto-tagged", type: "detail" },
  { text: "", type: "blank" },
  { text: "Stage 02  Provenance ....... FAIL ✗", type: "fail" },
  { text: "  Claim: offset 0xfff80000 in memory.raw", type: "check" },
  { text: "  Image size: 0x1ffffffff  (8.0 GB)", type: "check" },
  { text: "  → 0xfff80000 is OUT OF IMAGE RANGE", type: "error" },
  { text: "", type: "blank" },
  { text: "  Claim: chrome_update.exe (408 KB)", type: "check" },
  { text: "  Scanning: disk.e01  AppData\\Local\\Temp\\", type: "check" },
  { text: "  → FILE NOT FOUND IN FILESYSTEM", type: "error" },
  { text: "", type: "blank" },
  { text: "  Claim: registry key ChromeUpdater", type: "check" },
  { text: "  Checking: HKLM\\...\\CurrentVersion\\Run", type: "check" },
  { text: "  → KEY DOES NOT EXIST", type: "error" },
  { text: "", type: "blank" },
  { text: "Stages 03–05  SKIPPED  (Stage 02 fatal)", type: "skip" },
  { text: "", type: "blank" },
  { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", type: "divider" },
  { text: "VERDICT: BLOCK", type: "block" },
  { text: "Confidence: 0.08", type: "score" },
  { text: "Reason: 3/3 provenance claims INVALID", type: "score" },
  { text: "Analyst notified: NO", type: "score" },
  { text: "Audit entry SHA-256 chained: YES", type: "pass" },
  { text: "Chain of custody: PRESERVED", type: "pass" },
];

const hallucinatedColor: Record<string, string> = {
  command:     "text-gray-400 font-bold",
  info:        "text-gray-600",
  blank:       "h-2",
  "table-head":   "text-gray-500 text-[11px]",
  "table-row-bad":"text-yellow-400",
  ioc:         "text-orange-400",
  label:       "text-gray-500",
  severity:    "text-red-400 font-bold",
};

const scrutinizerColor: Record<string, string> = {
  header:  "text-neon-green font-bold",
  blank:   "h-2",
  pass:    "text-green-400",
  fail:    "text-red-400 font-bold",
  detail:  "text-gray-400",
  check:   "text-gray-500",
  error:   "text-red-500 font-semibold",
  skip:    "text-gray-600",
  divider: "text-gray-700",
  block:   "text-red-400 font-black text-base",
  score:   "text-gray-400",
};

function TermLine({ text, type, colorMap }: { text: string; type: string; colorMap: Record<string, string> }) {
  if (type === "blank") return <div className="h-2" />;
  return (
    <div className={`font-mono text-xs leading-relaxed ${colorMap[type] ?? "text-gray-400"}`}>
      {text}
    </div>
  );
}

function useScrollInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function AnimatedTerminal({
  lines,
  colorMap,
  title,
  titleColor,
  borderClass,
  startDelay = 0,
  active,
}: {
  lines: { text: string; type: string }[];
  colorMap: Record<string, string>;
  title: string;
  titleColor: string;
  borderClass: string;
  startDelay?: number;
  active: boolean;
}) {
  const [visible, setVisible] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const startedRef = useRef(false);
  const timerIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!active || startedRef.current) return;
    startedRef.current = true;
    lines.forEach((_, idx) => {
      const id = setTimeout(() => {
        setVisible((p) => [...p, idx]);
        if (idx === lines.length - 1) setDone(true);
      }, startDelay + idx * 90);
      timerIdsRef.current.push(id);
    });
    return () => {
      timerIdsRef.current.forEach(clearTimeout);
      timerIdsRef.current = [];
    };
  }, [active, lines, startDelay]);

  return (
    <div className={`rounded-xl overflow-hidden border ${borderClass} bg-dark-800`}>
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-dark-900/60">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <span className={`ml-2 text-xs font-mono font-medium ${titleColor}`}>{title}</span>
      </div>
      {/* Content */}
      <div className="p-4 min-h-[480px] overflow-hidden">
        {lines.map((line, idx) => (
          <div
            key={idx}
            className={`transition-all duration-200 ${visible.includes(idx) ? "opacity-100" : "opacity-0"}`}
          >
            <TermLine text={line.text} type={line.type} colorMap={colorMap} />
          </div>
        ))}
        {done && (
          <div className="font-mono text-xs text-neon-green cursor-blink pt-1" />
        )}
      </div>
    </div>
  );
}

export default function ProblemSolution() {
  const { ref, inView } = useScrollInView(0.15);

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-900 to-dark-800/50" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16 space-y-4 max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            From hallucination to{" "}
            <span className="gradient-text">blocked</span>
            {" "}in five stages.
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            The left shows what a raw AI forensic agent would report.
            The right shows Galaxy&apos;s scrutinizer catching every fabricated claim
            before it becomes evidence.
          </p>
        </div>

        <div ref={ref} className="grid lg:grid-cols-2 gap-6 items-start">

          {/* Left — Hallucinated finding */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 text-xs font-mono font-bold uppercase tracking-wider">
                  Protocol SIFT (raw AI output)
                </span>
              </div>
            </div>

            <AnimatedTerminal
              lines={hallucinatedLines}
              colorMap={hallucinatedColor}
              title="sift — volatility3 windows.malfind"
              titleColor="text-gray-500"
              borderClass="border-red-500/15"
              startDelay={300}
              active={inView}
            />

            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/15">
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400 leading-relaxed">
                The AI fabricated a memory offset that doesn&apos;t exist in the image,
                a file that was never on disk, and a registry key that never existed.
                Without a verifier, this becomes a CRITICAL finding in the incident report.
              </p>
            </div>
          </div>

          {/* Right — Galaxy blocks it */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-green/10 border border-neon-green/20">
                <CheckCircle className="w-4 h-4 text-neon-green" />
                <span className="text-neon-green text-xs font-mono font-bold uppercase tracking-wider">
                  Galaxy — Scrutinizer catches it
                </span>
              </div>
            </div>

            <AnimatedTerminal
              lines={scrutinizerLines}
              colorMap={scrutinizerColor}
              title="galaxy — scrutinizer · stage 02 provenance"
              titleColor="text-neon-green/70"
              borderClass="border-neon-green/15"
              startDelay={800}
              active={inView}
            />

            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-neon-green/8 border border-neon-green/15">
              <CheckCircle className="w-4 h-4 text-neon-green flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400 leading-relaxed">
                Stage 02 (Provenance) caught all three fabricated claims against the live
                evidence image. The finding is permanently blocked, the analyst is not notified,
                and a SHA-256 audit entry preserves chain of custody.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom callout */}
        <div className="mt-16 max-w-2xl mx-auto text-center space-y-3">
          <p className="text-gray-500 text-sm leading-relaxed">
            Galaxy is not trying to make AI forensic agents more accurate — it is trying to make
            them <span className="text-white font-semibold">safe to use</span> by verifying every
            claim against ground truth before it can contaminate an investigation.
          </p>
        </div>
      </div>
    </section>
  );
}
