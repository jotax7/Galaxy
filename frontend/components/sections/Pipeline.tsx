"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Search,
  FileCheck,
  GitBranch,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

// Internal stage definitions — not shown by default.
const stages = [
  {
    id: "classify",
    number: "01",
    icon: Shield,
    title: "Classification",
    description: "Is this a financial tool call?",
    detail: "Matches tool name against 22 financial keywords. Non-financial tools pass instantly.",
    textColor: "text-neon-blue",
    borderColor: "border-neon-blue/30",
    bgColor: "bg-neon-blue/5",
  },
  {
    id: "credentials",
    number: "02",
    icon: Search,
    title: "Credential Scan",
    description: "Are API keys being leaked?",
    detail: "Scans all arguments for 13 credential patterns (Anthropic, OpenAI, AWS, GitHub…). Blocks immediately if found.",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/5",
  },
  {
    id: "policy",
    number: "03",
    icon: FileCheck,
    title: "Policy Check",
    description: "Does this break any rules?",
    detail: "Enforces per-call limits, daily caps, rate limits, and approval thresholds. Configurable per deployment.",
    textColor: "text-yellow-400",
    borderColor: "border-yellow-400/30",
    bgColor: "bg-yellow-400/5",
  },
  {
    id: "integrity",
    number: "04",
    icon: GitBranch,
    title: "Integrity Check",
    description: "Was the payment tampered with?",
    detail: "Compares recipient, amount, and currency against the original intent. Flags any drift as a potential attack.",
    textColor: "text-orange-400",
    borderColor: "border-orange-500/30",
    bgColor: "bg-orange-500/5",
  },
  {
    id: "audit",
    number: "05",
    icon: BookOpen,
    title: "Audit Log",
    description: "Every decision is recorded.",
    detail: "Tamper-evident JSONL with SHA-256 hash chain. Verify integrity anytime with `galaxy scrutinizer --verify`.",
    textColor: "text-neon-green",
    borderColor: "border-neon-green/30",
    bgColor: "bg-neon-green/5",
  },
];

type Phase = "idle" | "processing" | "result";

export default function Pipeline() {
  const [showDetails, setShowDetails] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");

  // Animate the demo on mount: idle → processing → result
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("processing"), 600);
    const t2 = setTimeout(() => setPhase("result"), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <section id="how-it-works" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-800/50 to-dark-900" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12 space-y-3">
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Every payment is checked{" "}
            <span className="gradient-text">before it moves</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Galaxy runs automatically on every AI finding. You see the result — allow, rerun, or block.
          </p>
        </div>

        {/* Demo card — default view */}
        <div className="max-w-sm mx-auto mb-6">
          <div className="glass-card p-6 space-y-4">

            {/* Payment being evaluated */}
            <div className="space-y-2">
              <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">Payment request</div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Amount</span>
                <span className="font-mono text-sm text-red-400">$5,000.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Recipient</span>
                <span className="font-mono text-sm text-red-400">eve@attacker.com</span>
              </div>
            </div>

            <div className="border-t border-white/5" />

            {/* Status — animates through phases */}
            <div className="min-h-[52px] flex items-center">
              {phase === "idle" && (
                <div className="text-sm text-gray-600 font-mono">Waiting...</div>
              )}

              {phase === "processing" && (
                <div className="flex items-center gap-3 w-full p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse flex-shrink-0" />
                  <span className="text-sm text-gray-300">Checking payment...</span>
                </div>
              )}

              {phase === "result" && (
                <div className="flex items-center gap-3 w-full p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <div className="text-red-400 font-bold font-mono text-sm">BLOCKED</div>
                    <div className="text-xs text-gray-400 mt-0.5">Amount exceeds limit — no money moved</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Details toggle */}
        <div className="text-center mb-10">
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showDetails ? "Hide details" : "View details"}
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${showDetails ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Expanded: 5-stage breakdown */}
        {showDetails && (
          <div className="space-y-10 animate-in fade-in duration-300">

            {/* Stage grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {stages.map((stage, idx) => {
                const Icon = stage.icon;
                return (
                  <div key={stage.id} className="relative">
                    {idx < stages.length - 1 && (
                      <div className="hidden lg:flex absolute -right-1.5 top-1/2 -translate-y-1/2 z-20">
                        <ChevronRight className="w-3 h-3 text-gray-700" />
                      </div>
                    )}
                    <div className={`p-4 rounded-xl border ${stage.bgColor} ${stage.borderColor} space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-mono ${stage.textColor} opacity-50`}>{stage.number}</span>
                        <Icon className={`w-4 h-4 ${stage.textColor}`} />
                      </div>
                      <div className="text-sm font-bold text-white">{stage.title}</div>
                      <div className="text-xs text-gray-500 leading-relaxed">{stage.description}</div>
                      <div className="text-xs text-gray-600 leading-relaxed border-t border-white/5 pt-2">{stage.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Possible outcomes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "ALLOW",
                  icon: CheckCircle,
                  color: "text-neon-green",
                  bg: "bg-neon-green/10",
                  border: "border-neon-green/30",
                  desc: "All checks passed. Payment proceeds.",
                },
                {
                  label: "ASK",
                  icon: AlertTriangle,
                  color: "text-yellow-400",
                  bg: "bg-yellow-400/10",
                  border: "border-yellow-400/30",
                  desc: "New recipient or large amount — human approves.",
                },
                {
                  label: "BLOCK",
                  icon: XCircle,
                  color: "text-red-400",
                  bg: "bg-red-400/10",
                  border: "border-red-400/30",
                  desc: "Threat detected. Payment stopped.",
                },
              ].map(({ label, icon: Icon, color, bg, border, desc }) => (
                <div key={label} className={`${bg} ${border} border rounded-xl p-4 flex items-start gap-3`}>
                  <Icon className={`w-5 h-5 ${color} flex-shrink-0 mt-0.5`} />
                  <div>
                    <div className={`font-mono font-bold ${color}`}>{label}</div>
                    <div className="text-xs text-gray-400 mt-1">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </section>
  );
}
