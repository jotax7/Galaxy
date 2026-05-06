"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, ArrowRight, Terminal, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

const terminalLines = [
  { delay: 0, text: "$ pnpm dev   # vercel agent + payguard mcp", type: "command" },
  { delay: 600, text: "PayGuard MCP — v1.0.0 (Vercel)", type: "header" },
  { delay: 1000, text: "════════════════════════════════════════", type: "divider" },
  { delay: 1400, text: "Scenario: MCP recipient tampered", type: "scenario" },
  { delay: 1800, text: "  classify:financial:critical ✓", type: "stage-pass" },
  { delay: 2100, text: "  credentials:clean ✓", type: "stage-pass" },
  { delay: 2400, text: "  policy:within_limits ✓", type: "stage-pass" },
  { delay: 2700, text: "  integrity:RECIPIENT_SWAP ✗", type: "stage-fail" },
  { delay: 3000, text: "  Decision: BLOCK", type: "decision-block" },
  { delay: 3500, text: "  Reason: Recipient changed alice→attacker", type: "reason" },
  { delay: 4000, text: "────────────────────────────────────────", type: "divider" },
  { delay: 4400, text: "Scenario: Normal payment to alice", type: "scenario" },
  { delay: 4800, text: "  classify:financial:critical ✓", type: "stage-pass" },
  { delay: 5100, text: "  credentials:clean ✓", type: "stage-pass" },
  { delay: 5400, text: "  policy:within_limits ✓", type: "stage-pass" },
  { delay: 5700, text: "  integrity:verified ✓", type: "stage-pass" },
  { delay: 6000, text: "  Decision: ALLOW", type: "decision-allow" },
];

function TerminalLine({ text, type }: { text: string; type: string }) {
  const colorMap: Record<string, string> = {
    command: "text-neon-green font-bold",
    header: "text-white font-semibold",
    divider: "text-gray-600",
    scenario: "text-neon-blue font-medium",
    "stage-pass": "text-green-400",
    "stage-fail": "text-red-400",
    "decision-block": "text-red-400 font-bold",
    "decision-allow": "text-neon-green font-bold",
    reason: "text-yellow-400",
  };
  return (
    <div className={`font-mono text-xs sm:text-sm leading-relaxed ${colorMap[type] || "text-gray-400"}`}>
      {text}
    </div>
  );
}

export default function Hero() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [stats] = useState({ blocked: 0, allowed: 0, audited: 0 });

  useEffect(() => {
    terminalLines.forEach((line, idx) => {
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, idx]);
      }, line.delay);
    });
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-100" />
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div className="space-y-8">
            {/* Headline */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/20">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                <span className="text-neon-green text-xs font-mono uppercase tracking-wider">Built for Vercel Zero to Agent</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none tracking-tight text-white">
                Stop AI <span className="gradient-text">Payment</span> Fraud.
              </h1>
              <p className="text-xl text-gray-400 max-w-xl leading-relaxed">
                The MCP server that secures payments for Vercel AI agents. Detects tampering before money moves — under 5ms, fully deterministic.
              </p>
            </div>

            {/* Attack scenario visual */}
            <div className="glass-card p-4 space-y-3 max-w-md">
              <div className="text-xs text-gray-500 font-mono uppercase tracking-wider">The Attack</div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-sm text-green-300 font-mono">Agent: Pay $50 → jay@company.com</span>
                </div>
                <div className="flex items-center justify-center text-gray-600">
                  <div className="w-px h-4 bg-gray-700" />
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-300 font-mono">MCP tampers: Pay $5,000 → eve@attacker.com</span>
                </div>
                <div className="flex items-center justify-center text-gray-600">
                  <div className="w-px h-4 bg-gray-700" />
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-neon-green/10 border border-neon-green/20">
                  <Shield className="w-4 h-4 text-neon-green flex-shrink-0" />
                  <span className="text-sm text-neon-green font-mono font-bold">PayGuard: BLOCK — payment manipulated</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/agent"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neon-green text-dark-900 font-bold rounded-xl hover:bg-neon-green/90 transition-all btn-primary shadow-lg shadow-neon-green/20"
              >
                Try Live Agent
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all"
              >
                View Attack Demo
              </Link>
            </div>

            {/* Install command */}
            <div className="space-y-2 max-w-md">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-800/80 border border-white/10 font-mono text-sm">
                <Terminal className="w-4 h-4 text-neon-green flex-shrink-0" />
                <span className="text-gray-500 select-none">$</span>
                <span className="text-neon-green flex-1 truncate">npm install @payguard/mcp</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-800/80 border border-white/10 font-mono text-sm">
                <Terminal className="w-4 h-4 text-neon-green flex-shrink-0" />
                <span className="text-neon-green flex-1 truncate">agent.use(payguardMCP)</span>
                <span className="text-gray-600 text-xs">// protect any AI SDK agent</span>
              </div>
            </div>

          </div>

          {/* Right: Terminal */}
          <div className="relative">
            <div className="animated-border">
              <div className="bg-dark-800 rounded-xl overflow-hidden">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-dark-900/50">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-xs text-gray-500 font-mono flex items-center gap-1.5">
                    <Terminal className="w-3 h-3" />
                    payguard — terminal
                  </span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="status-dot" />
                    <span className="text-xs text-neon-green font-mono">ACTIVE</span>
                  </div>
                </div>

                {/* Terminal content */}
                <div className="p-4 space-y-0.5 min-h-[320px]">
                  {terminalLines.map((line, idx) => (
                    <div
                      key={idx}
                      className={`transition-all duration-300 ${
                        visibleLines.includes(idx) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                      }`}
                    >
                      <TerminalLine text={line.text} type={line.type} />
                    </div>
                  ))}
                  {visibleLines.length >= terminalLines.length && (
                    <div className="font-mono text-sm text-neon-green cursor-blink" />
                  )}
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="absolute -top-4 -right-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono shadow-lg">
              <XCircle className="w-4 h-4" />
              BLOCK: Recipient Swap
            </div>
            <div className="absolute -bottom-4 -left-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-mono shadow-lg">
              <AlertTriangle className="w-4 h-4" />
              ASK: New Recipient
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
