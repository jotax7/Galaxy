"use client";

import { useState, useEffect, useRef } from "react";
import Nav from "@/components/Nav";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Tag,
  Search,
  Terminal,
  GitBranch,
  BarChart3,
  Play,
  Shield,
  Database,
  AlertTriangle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type StageStatus = "idle" | "running" | "pass" | "fail";

interface AgentLine {
  text: string;
  type:
    | "command"
    | "info"
    | "propose"
    | "success"
    | "warn"
    | "error"
    | "divider"
    | "blank"
    | "replan"
    | "metric";
}

interface Scrutinizer {
  title: string;
  mitre: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  stages: StageStatus[];
  failReason?: string;
  verdict?: "allow" | "block";
  confidence?: number;
  isReplanning?: boolean;
}

interface AcceptedFinding {
  id: string;
  title: string;
  mitre: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  confidence: number;
  tool: string;
  isRevised?: boolean;
}

// ── Static metadata ────────────────────────────────────────────────────────

const STAGES = [
  { num: "01", name: "Classify",     Icon: Tag      },
  { num: "02", name: "Provenance",   Icon: Search   },
  { num: "03", name: "Tool Match",   Icon: Terminal },
  { num: "04", name: "Cross-Source", Icon: GitBranch },
  { num: "05", name: "Confidence",   Icon: BarChart3 },
] as const;

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: "text-red-400 bg-red-400/10 border-red-400/30",
  HIGH:     "text-orange-400 bg-orange-400/10 border-orange-400/30",
  MEDIUM:   "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  LOW:      "text-blue-400 bg-blue-400/10 border-blue-400/30",
};

const LINE_STYLE: Record<AgentLine["type"], string> = {
  command: "text-neon-green font-bold",
  info:    "text-gray-500",
  propose: "text-neon-blue",
  success: "text-neon-green font-semibold",
  warn:    "text-yellow-400",
  error:   "text-red-400",
  divider: "text-gray-700",
  blank:   "",
  replan:  "text-orange-400 font-semibold",
  metric:  "text-gray-400",
};

const IDLE_STAGES: StageStatus[] = ["idle", "idle", "idle", "idle", "idle"];

// ── Component ──────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [phase,           setPhase]           = useState<"idle" | "running" | "done">("idle");
  const [agentLines,      setAgentLines]      = useState<AgentLine[]>([]);
  const [scrutinizer,     setScrutinizer]     = useState<Scrutinizer | null>(null);
  const [accepted,        setAccepted]        = useState<AcceptedFinding[]>([]);
  const [summary,         setSummary]         = useState<{
    accepted: number; blocked: number; corrections: number;
  } | null>(null);

  const timerIds   = useRef<ReturnType<typeof setTimeout>[]>([]);
  const terminalEl = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal as new lines appear
  useEffect(() => {
    const el = terminalEl.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [agentLines.length]);

  // Cancel timers on unmount
  useEffect(() => {
    return () => timerIds.current.forEach(clearTimeout);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function at(ms: number, fn: () => void) {
    timerIds.current.push(setTimeout(fn, ms));
  }

  function line(l: AgentLine) {
    setAgentLines((p) => [...p, l]);
  }

  // Update multiple stage indices in one atomic setState to avoid batching issues
  function patchStages(updates: Array<[number, StageStatus]>, extra?: Partial<Scrutinizer>) {
    setScrutinizer((prev) => {
      if (!prev) return prev;
      const stages = [...prev.stages] as StageStatus[];
      for (const [i, s] of updates) stages[i] = s;
      return { ...prev, stages, ...extra };
    });
  }

  function patchScrutinizer(patch: Partial<Scrutinizer>) {
    setScrutinizer((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  // ── Investigation sequence ───────────────────────────────────────────────

  function startInvestigation() {
    timerIds.current.forEach(clearTimeout);
    timerIds.current = [];
    setPhase("running");
    setAgentLines([]);
    setScrutinizer(null);
    setAccepted([]);
    setSummary(null);

    let t = 0;

    // Init
    at(t += 200,  () => line({ text: "$ galaxy investigate /evidence/case-2026-047/", type: "command" }));
    at(t += 350,  () => line({ text: "Galaxy DFIR Agent v1.0  ·  Protocol SIFT", type: "info" }));
    at(t += 250,  () => line({ text: "Mounting disk.E01          (128.0 GB) ...", type: "info" }));
    at(t += 200,  () => line({ text: "Mounting memory.dump       (  8.2 GB) ...", type: "info" }));
    at(t += 250,  () => line({ text: "Evidence integrity:  sha256 verified  ✓", type: "success" }));
    at(t += 200,  () => line({ text: "", type: "blank" }));
    at(t += 200,  () => line({ text: "Spawning analysis tools:", type: "info" }));
    at(t += 250,  () => line({ text: "  volatility3 windows.cmdline", type: "info" }));
    at(t += 200,  () => line({ text: "  volatility3 windows.registry.hivelist", type: "info" }));
    at(t += 200,  () => line({ text: "  regripper SOFTWARE hive", type: "info" }));
    at(t += 300,  () => line({ text: "", type: "blank" }));
    at(t += 150,  () => line({ text: "──── Investigator findings ────────────────────────────", type: "divider" }));

    // ── Finding 1 / powershell SYSTEM — all 5 stages PASS ──────
    const f1 = t + 400;

    at(f1,        () => line({ text: "Finding 1/3  ·  PID 4521 powershell.exe", type: "propose" }));
    at(f1 + 150,  () => line({ text: "  Cmd: -Enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjA...", type: "propose" }));
    at(f1 + 280,  () => line({ text: "  RunAs: NT AUTHORITY\\SYSTEM", type: "propose" }));
    at(f1 + 400,  () => line({ text: "  MITRE: T1059.001  |  Severity: HIGH", type: "propose" }));

    at(f1 + 550, () =>
      setScrutinizer({
        title: "powershell.exe (PID 4521) running as SYSTEM — base64 encoded command",
        mitre: "T1059.001",
        severity: "HIGH",
        stages: ["running", "idle", "idle", "idle", "idle"],
      })
    );

    // Stages fire every 400ms
    at(f1 + 950,  () => patchStages([[0, "pass"], [1, "running"]]));
    at(f1 + 1350, () => patchStages([[1, "pass"], [2, "running"]]));
    at(f1 + 1750, () => patchStages([[2, "pass"], [3, "running"]]));
    at(f1 + 2150, () => patchStages([[3, "pass"], [4, "running"]]));
    at(f1 + 2550, () =>
      setScrutinizer((p) =>
        p ? { ...p, stages: ["pass","pass","pass","pass","pass"], verdict: "allow", confidence: 0.87 } : p
      )
    );
    at(f1 + 2850, () => line({ text: "  → [ALLOW] F1 accepted  ·  confidence 0.87", type: "success" }));
    at(f1 + 3050, () =>
      setAccepted((p) => [
        ...p,
        {
          id: "f1",
          title: "powershell.exe (PID 4521) running as SYSTEM — base64 encoded command",
          mitre: "T1059.001",
          severity: "HIGH",
          confidence: 0.87,
          tool: "volatility3 windows.cmdline",
        },
      ])
    );
    at(f1 + 3250, () => line({ text: "", type: "blank" }));

    // ── Finding 2 / bad cite (line 8420 but file has 412 lines) — BLOCK at stage 2 ──
    const f2 = f1 + 3800;

    at(f2,        () => line({ text: "Finding 2/3  ·  Registry hive SOFTWARE", type: "propose" }));
    at(f2 + 150,  () => line({ text: "  Source: /evidence/Windows/System32/config/SOFTWARE", type: "propose" }));
    at(f2 + 280,  () => line({ text: "  Cites:  line 8420 — Run key 'WindowsUpdater'", type: "propose" }));
    at(f2 + 400,  () => line({ text: "  MITRE: T1547.001  |  Severity: HIGH", type: "propose" }));

    at(f2 + 550, () =>
      setScrutinizer({
        title: "Persistence via Run key in registry hive SOFTWARE",
        mitre: "T1547.001",
        severity: "HIGH",
        stages: ["running", "idle", "idle", "idle", "idle"],
      })
    );

    at(f2 + 950, () => patchStages([[0, "pass"], [1, "running"]]));
    // Stage 2 FAILS — provenance failure (800ms pause built into next events)
    at(f2 + 1350, () =>
      patchScrutinizer({
        stages: ["pass", "fail", "idle", "idle", "idle"] as StageStatus[],
        failReason: "cites line 8420 — file has only 412 lines",
        verdict: "block",
      })
    );

    // ── 800ms pause showing the BLOCK ────────────────────────────
    at(f2 + 2150, () => line({ text: "  → [BLOCK] Stage 02 — provenance failure", type: "error" }));
    at(f2 + 2350, () => line({ text: "  line 8420 cited;  /evidence/.../SOFTWARE has 412 lines", type: "error" }));
    at(f2 + 2800, () => line({ text: "  → REJECTED — entering strict re-plan mode...", type: "replan" }));

    // Show RE-PLANNING badge in scrutinizer panel
    at(f2 + 3300, () => patchScrutinizer({ isReplanning: true }));
    at(f2 + 3600, () => line({ text: "", type: "blank" }));
    at(f2 + 3800, () => line({ text: "  [strict-mode] Re-examining SOFTWARE hive...", type: "replan" }));
    at(f2 + 4100, () => line({ text: "  regripper output cross-referenced...", type: "info" }));
    at(f2 + 4450, () => line({ text: "  Verified line: 247  (HKLM\\...\\Run\\WindowsUpdater)", type: "replan" }));
    at(f2 + 4650, () => line({ text: "", type: "blank" }));

    // ── Finding 2 revised / correct cite — all 5 PASS ───────────
    const f2r = f2 + 5150;

    at(f2r,        () => line({ text: "Finding 2/3 (revised)  ·  Registry hive SOFTWARE", type: "propose" }));
    at(f2r + 150,  () => line({ text: "  Source: /evidence/Windows/System32/config/SOFTWARE", type: "propose" }));
    at(f2r + 280,  () => line({ text: "  Cites:  line 247 — Run key 'WindowsUpdater'", type: "propose" }));
    at(f2r + 400,  () => line({ text: "  Value:  C:\\Windows\\System32\\svchost32.exe", type: "propose" }));

    at(f2r + 550, () =>
      setScrutinizer({
        title: "Persistence via Run key 'WindowsUpdater' — self-corrected",
        mitre: "T1547.001",
        severity: "HIGH",
        stages: ["running", "idle", "idle", "idle", "idle"],
      })
    );

    at(f2r + 950,  () => patchStages([[0, "pass"], [1, "running"]]));
    at(f2r + 1350, () => patchStages([[1, "pass"], [2, "running"]]));
    at(f2r + 1750, () => patchStages([[2, "pass"], [3, "running"]]));
    at(f2r + 2150, () => patchStages([[3, "pass"], [4, "running"]]));
    at(f2r + 2550, () =>
      setScrutinizer((p) =>
        p ? { ...p, stages: ["pass","pass","pass","pass","pass"], verdict: "allow", confidence: 0.91 } : p
      )
    );
    at(f2r + 2850, () => line({ text: "  → [ALLOW] F2 (revised) accepted  ·  confidence 0.91", type: "success" }));
    at(f2r + 3050, () =>
      setAccepted((p) => [
        ...p,
        {
          id: "f2",
          title: "Persistence via Run key 'WindowsUpdater'",
          mitre: "T1547.001",
          severity: "HIGH",
          confidence: 0.91,
          tool: "regripper SOFTWARE hive",
          isRevised: true,
        },
      ])
    );
    at(f2r + 3250, () => line({ text: "", type: "blank" }));

    // ── Finding 3 / invented tool — BLOCK at stage 3 ────────────
    const f3 = f2r + 3800;

    at(f3,        () => line({ text: "Finding 3/3  ·  chrome.exe memory region", type: "propose" }));
    at(f3 + 150,  () => line({ text: "  Tool: vol3.py windows.evilfind", type: "propose" }));
    at(f3 + 280,  () => line({ text: "  PID 2841  |  VPN 0x7ff800000  |  4096b  |  Xrw", type: "propose" }));
    at(f3 + 400,  () => line({ text: "  MITRE: T1055  |  Severity: MEDIUM", type: "propose" }));

    at(f3 + 550, () =>
      setScrutinizer({
        title: "Suspicious executable memory region in chrome.exe (PID 2841)",
        mitre: "T1055",
        severity: "MEDIUM",
        stages: ["running", "idle", "idle", "idle", "idle"],
      })
    );

    at(f3 + 950,  () => patchStages([[0, "pass"], [1, "running"]]));
    at(f3 + 1350, () => patchStages([[1, "pass"], [2, "running"]]));
    // Stage 3 FAILS — tool not in SIFT registry
    at(f3 + 1750, () =>
      patchScrutinizer({
        stages: ["pass", "pass", "fail", "idle", "idle"] as StageStatus[],
        failReason: "tool 'vol3.py windows.evilfind' not in SIFT tool registry",
        verdict: "block",
      })
    );

    at(f3 + 2550, () => line({ text: "  → [BLOCK] Stage 03 — tool not recognised", type: "error" }));
    at(f3 + 2750, () => line({ text: "  'vol3.py windows.evilfind' not in SIFT tool registry", type: "error" }));
    at(f3 + 2950, () => line({ text: "  → PERMANENTLY REJECTED", type: "error" }));
    at(f3 + 3150, () => line({ text: "", type: "blank" }));

    // ── Summary ────────────────────────────────────────────────────
    const fin = f3 + 3750;

    at(fin,        () => line({ text: "──── Investigation complete ────────────────────────────", type: "divider" }));
    at(fin + 200,  () => line({ text: "  Proposed:         3  findings", type: "metric" }));
    at(fin + 380,  () => line({ text: "  Accepted (ALLOW): 2  findings", type: "metric" }));
    at(fin + 560,  () => line({ text: "  Blocked  (perm):  1  finding", type: "metric" }));
    at(fin + 740,  () => line({ text: "  Self-corrections: 1 / 1 rejections", type: "metric" }));
    at(fin + 920,  () => line({ text: "  Audit chain: SHA-256 intact — CoC preserved  ✓", type: "success" }));
    at(fin + 1200, () => {
      setSummary({ accepted: 2, blocked: 1, corrections: 1 });
      setPhase("done");
    });
  }

  // ── Derived styles ─────────────────────────────────────────────────────

  const panelBorderClass =
    scrutinizer?.verdict === "block"
      ? "border-red-500/30 shadow-red-500/5"
      : scrutinizer?.verdict === "allow"
      ? "border-neon-green/30 shadow-neon-green/5"
      : "border-white/8";

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-dark-900">
      <Nav />

      {/* ── Evidence context bar ──────────────────────────────────── */}
      <div className="border-b border-white/5 bg-dark-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-neon-blue flex-shrink-0" />
              <span className="text-gray-400">disk.E01</span>
              <span className="text-gray-700 hidden sm:inline">sha256:7a3f9c2e8b1d4f6a…</span>
            </div>
            <span className="text-gray-700">+</span>
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-neon-purple flex-shrink-0" />
              <span className="text-gray-400">memory.dump</span>
              <span className="text-gray-700 hidden sm:inline">sha256:8b4e1a7f3c9d2e5b…</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Shield className="w-3.5 h-3.5 text-neon-green" />
              <span className="text-neon-green font-semibold">INTEGRITY VERIFIED ✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="flex items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Live Investigation Demo
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Galaxy investigates case-2026-047 across 3 AI-proposed findings.
              Watch the scrutinizer catch a hallucination and self-correct in real time.
            </p>
          </div>

          <button
            onClick={startInvestigation}
            disabled={phase === "running"}
            className={`flex-shrink-0 inline-flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
              phase === "running"
                ? "bg-white/5 text-gray-600 cursor-not-allowed border border-white/10"
                : "bg-neon-green text-dark-900 hover:bg-neon-green/90 btn-primary shadow-lg shadow-neon-green/20"
            }`}
          >
            {phase === "running" ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Investigating…</>
            ) : (
              <><Play className="w-4 h-4" /> {phase === "done" ? "Run Again" : "Run Investigation"}</>
            )}
          </button>
        </div>

        {/* ── Two-panel layout ──────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-5 mb-6">

          {/* LEFT: Investigator Agent terminal */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              {phase === "running"
                ? <span className="status-dot" />
                : <div className={`w-2 h-2 rounded-full ${phase === "done" ? "bg-neon-green" : "bg-gray-800"}`} />
              }
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                Investigator Agent
              </span>
            </div>

            <div className="animated-border">
              <div className="bg-dark-800 rounded-xl overflow-hidden">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-dark-900/60">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  <span className="ml-2 text-xs text-gray-600 font-mono">
                    galaxy — investigator agent
                  </span>
                  <span className="ml-auto text-[10px] font-mono">
                    {phase === "running" && <span className="text-neon-green">● LIVE</span>}
                    {phase === "done"    && <span className="text-gray-600">COMPLETE</span>}
                  </span>
                </div>

                {/* Terminal body */}
                <div
                  ref={terminalEl}
                  className="p-4 h-[460px] overflow-y-auto space-y-[3px]"
                  style={{ scrollbarWidth: "thin", scrollbarColor: "#00ff8820 transparent" }}
                >
                  {phase === "idle" && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
                      <div className="w-12 h-12 rounded-xl bg-neon-green/8 border border-neon-green/15 flex items-center justify-center">
                        <Play className="w-6 h-6 text-neon-green/50" />
                      </div>
                      <p className="text-xs text-gray-700 font-mono">
                        Press &quot;Run Investigation&quot; to begin
                      </p>
                    </div>
                  )}

                  {agentLines.map((l, idx) =>
                    l.type === "blank" ? (
                      <div key={idx} className="h-2" />
                    ) : (
                      <div
                        key={idx}
                        className={`font-mono text-xs sm:text-sm leading-relaxed ${LINE_STYLE[l.type]}`}
                      >
                        {l.text}
                      </div>
                    )
                  )}

                  {phase === "running" && agentLines.length > 0 && (
                    <div className="font-mono text-sm text-neon-green cursor-blink" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Scrutinizer Pipeline */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  scrutinizer?.verdict === "block"
                    ? "bg-red-400 animate-pulse"
                    : scrutinizer?.verdict === "allow"
                    ? "bg-neon-green"
                    : scrutinizer
                    ? "bg-yellow-400 animate-pulse"
                    : "bg-gray-800"
                }`}
              />
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                Scrutinizer Pipeline
              </span>
              {scrutinizer?.isReplanning && (
                <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-0.5 rounded-full">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  RE-PLANNING
                </span>
              )}
            </div>

            <div
              className={`glass-card border transition-all duration-500 shadow-lg ${panelBorderClass}`}
            >
              {/* Idle placeholder */}
              {!scrutinizer && (
                <div className="flex flex-col items-center justify-center h-[460px] gap-4">
                  <div className="flex items-center gap-2 opacity-20">
                    {STAGES.map(({ num, Icon }) => (
                      <div
                        key={num}
                        className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center"
                      >
                        <Icon className="w-4 h-4 text-gray-700" />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-700 font-mono">Awaiting findings…</p>
                </div>
              )}

              {/* Active scrutiny */}
              {scrutinizer && (
                <div className="p-5 flex flex-col gap-4 h-[460px]">
                  {/* Finding header */}
                  <div className="pb-4 border-b border-white/5 space-y-2 flex-shrink-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${SEVERITY_STYLE[scrutinizer.severity]}`}
                      >
                        {scrutinizer.severity}
                      </span>
                      <span className="text-[10px] font-mono text-neon-blue bg-neon-blue/10 border border-neon-blue/20 px-2 py-0.5 rounded">
                        {scrutinizer.mitre}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 font-medium leading-snug">
                      {scrutinizer.title}
                    </p>
                  </div>

                  {/* Stage rows */}
                  <div className="space-y-2 flex-1">
                    {STAGES.map(({ num, name, Icon }, i) => {
                      const status = scrutinizer.stages[i] ?? "idle";
                      const isFail = status === "fail";
                      const isPass = status === "pass";
                      const isRun  = status === "running";

                      return (
                        <div
                          key={num}
                          className={`flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                            isPass ? "bg-green-500/7 border border-green-500/15"
                            : isFail ? "bg-red-500/10 border border-red-500/20"
                            : isRun  ? "bg-white/3 border border-white/8"
                            : "border border-transparent"
                          }`}
                        >
                          {/* Status indicator */}
                          <div className="flex-shrink-0 mt-0.5 w-4">
                            {status === "idle"    && <div className="w-3.5 h-3.5 rounded-full border border-gray-800" />}
                            {isRun               && <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 animate-pulse" />}
                            {isPass              && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                            {isFail              && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                          </div>

                          {/* Stage info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-gray-700">{num}</span>
                              <Icon
                                className={`w-3 h-3 flex-shrink-0 ${
                                  isPass ? "text-green-400"
                                  : isFail ? "text-red-400"
                                  : isRun  ? "text-yellow-400"
                                  : "text-gray-700"
                                }`}
                              />
                              <span
                                className={`text-xs font-medium ${
                                  isPass ? "text-green-300"
                                  : isFail ? "text-red-300"
                                  : isRun  ? "text-white"
                                  : "text-gray-600"
                                }`}
                              >
                                {name}
                              </span>
                              <span
                                className={`ml-auto text-[10px] font-mono flex-shrink-0 ${
                                  isPass ? "text-green-600"
                                  : isFail ? "text-red-500 font-bold"
                                  : isRun  ? "text-yellow-600"
                                  : ""
                                }`}
                              >
                                {isPass && "PASS ✓"}
                                {isFail && "FAIL ✗"}
                                {isRun  && <span className="animate-pulse">running…</span>}
                              </span>
                            </div>

                            {/* Fail reason */}
                            {isFail && scrutinizer.failReason && (
                              <p className="text-[11px] font-mono text-red-500/80 mt-1 leading-relaxed pl-5">
                                {scrutinizer.failReason}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Verdict */}
                  {scrutinizer.verdict && (
                    <div
                      className={`flex-shrink-0 flex items-center gap-4 p-4 rounded-xl border transition-all duration-500 ${
                        scrutinizer.verdict === "allow"
                          ? "bg-neon-green/10 border-neon-green/30"
                          : "bg-red-500/10 border-red-500/30"
                      }`}
                    >
                      {scrutinizer.verdict === "allow" ? (
                        <CheckCircle className="w-8 h-8 text-neon-green flex-shrink-0" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
                      )}
                      <div>
                        <div
                          className={`font-mono font-black text-2xl leading-none ${
                            scrutinizer.verdict === "allow" ? "text-neon-green" : "text-red-400"
                          }`}
                        >
                          {scrutinizer.verdict === "allow" ? "ALLOW" : "BLOCK"}
                        </div>
                        {scrutinizer.confidence != null && (
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            confidence {scrutinizer.confidence.toFixed(2)}
                          </div>
                        )}
                        {scrutinizer.verdict === "block" && (
                          <div className="text-[10px] text-red-700 font-mono mt-0.5">
                            analyst not notified · audit entry SHA-256 chained
                          </div>
                        )}
                        {scrutinizer.verdict === "allow" && (
                          <div className="text-[10px] text-green-700 font-mono mt-0.5">
                            reported to analyst · provenance links attached
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Accepted Findings ──────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
              Accepted Findings
            </span>
            {accepted.length > 0 && (
              <span className="text-xs font-mono text-neon-green bg-neon-green/10 border border-neon-green/20 px-2 py-0.5 rounded">
                {accepted.length}
              </span>
            )}
            {phase === "done" && (
              <span className="ml-auto text-[10px] font-mono text-gray-600">
                1 permanently blocked · not shown
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {accepted.length === 0 ? (
              <div className="col-span-full flex items-center justify-center h-24 rounded-xl border border-dashed border-white/8">
                <span className="text-xs text-gray-700 font-mono">
                  No findings accepted yet…
                </span>
              </div>
            ) : (
              accepted.map((f) => (
                <div
                  key={f.id}
                  className="glass-card p-4 border border-neon-green/12 hover:border-neon-green/25 transition-all duration-300 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${SEVERITY_STYLE[f.severity]}`}
                      >
                        {f.severity}
                      </span>
                      <span className="text-[10px] font-mono text-neon-blue bg-neon-blue/10 border border-neon-blue/20 px-2 py-0.5 rounded">
                        {f.mitre}
                      </span>
                      {f.isRevised && (
                        <span className="text-[10px] font-mono text-orange-400 bg-orange-400/10 border border-orange-400/20 px-2 py-0.5 rounded">
                          SELF-CORRECTED
                        </span>
                      )}
                    </div>
                    <CheckCircle className="w-4 h-4 text-neon-green flex-shrink-0" />
                  </div>

                  <p className="text-xs text-gray-300 font-medium leading-snug">{f.title}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[10px] text-gray-600 font-mono truncate mr-2">{f.tool}</span>
                    <span className="text-[10px] font-mono text-neon-green flex-shrink-0">
                      {(f.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Final summary ─────────────────────────────────────── */}
        {summary && (
          <div className="p-6 rounded-2xl border border-neon-green/20 bg-neon-green/3 space-y-5">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-neon-green" />
              <span className="text-sm font-mono font-bold text-neon-green uppercase tracking-wider">
                Investigation Complete — Chain of Custody Preserved
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Proposed",          value: "3",                          color: "text-white" },
                { label: "Accepted (ALLOW)",  value: String(summary.accepted),     color: "text-neon-green" },
                { label: "Blocked (perm.)",   value: String(summary.blocked),      color: "text-red-400" },
                { label: "Self-corrections",  value: `${summary.corrections}/1`,   color: "text-orange-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <div className={`text-3xl font-black font-mono ${color}`}>{value}</div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
              {[
                {
                  icon: CheckCircle,
                  color: "text-neon-green",
                  bg: "bg-neon-green/8 border-neon-green/15",
                  title: "F1: powershell.exe SYSTEM",
                  desc: "All 5 stages PASS on first submission. Reported with T1059.001 mapping and volatility3 output link.",
                },
                {
                  icon: RefreshCw,
                  color: "text-orange-400",
                  bg: "bg-orange-400/8 border-orange-400/15",
                  title: "F2: WindowsUpdater persistence",
                  desc: "Stage 2 blocked bad cite (line 8420). Agent re-planned with strict mode. Revised cite (line 247) passed all 5 stages independently.",
                },
                {
                  icon: XCircle,
                  color: "text-red-400",
                  bg: "bg-red-500/8 border-red-500/15",
                  title: "F3: chrome.exe memory region",
                  desc: "Stage 3 blocked invented tool 'vol3.py windows.evilfind'. Not in SIFT tool registry. Permanently suppressed — analyst never saw it.",
                },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className={`rounded-xl border p-4 space-y-2 ${bg}`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                    <span className={`text-xs font-mono font-semibold ${color}`}>{title}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              All three verdicts are SHA-256 chained in the audit log at{" "}
              <span className="font-mono text-gray-500">/var/galaxy/audit/case-2026-047.jsonl</span>.
              The self-corrected finding passed all 5 stages independently — no memory of the
              prior rejection was used in the second submission&apos;s scoring.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
