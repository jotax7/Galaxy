"use client";

import { Shield, Zap, Lock, Eye, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Real-Time Payment Guard",
    description: "Intercepts every payment tool call from your Vercel AI SDK agent before execution. Under 5ms latency. Runs deterministically on every transaction.",
    color: "neon-green",
    stats: "<5ms",
    statsLabel: "latency",
  },
  {
    icon: Eye,
    title: "Payment Drift Detection",
    description: "Tracks payment intents per recipient. Blocks recipient swaps, amount inflation, and currency changes — the primary MCP attack vector.",
    color: "neon-blue",
    stats: "1%",
    statsLabel: "drift tolerance",
  },
  {
    icon: Lock,
    title: "Tamper-Evident Audit",
    description: "Every decision logged with SHA-256 hash chain. Tamper-evident JSONL format. Audit log streamed to your Vercel observability of choice.",
    color: "yellow-400",
    stats: "SHA-256",
    statsLabel: "hash chain",
  },
  {
    icon: Zap,
    title: "Zero LLM Risk",
    description: "Fully deterministic — regex patterns and hashes only. No prompt injection possible. No AI model calls. No external dependencies during runtime.",
    color: "orange-400",
    stats: "0",
    statsLabel: "LLM calls",
  },
  {
    icon: BarChart3,
    title: "Configurable Policy",
    description: "Spending limits, rate limits, approval thresholds, drift tolerance — all tunable via policy.yaml. Sensible defaults. Zero config to get started. Edit and redeploy on Vercel — instant policy updates.",
    color: "neon-green",
    stats: "YAML",
    statsLabel: "config",
  },
];

const colorMap: Record<string, { text: string; bg: string; border: string; glow: string }> = {
  "neon-green": {
    text: "text-neon-green",
    bg: "bg-neon-green/10",
    border: "border-neon-green/20",
    glow: "hover:shadow-[0_0_30px_rgba(0,255,136,0.15)]",
  },
  "neon-blue": {
    text: "text-neon-blue",
    bg: "bg-neon-blue/10",
    border: "border-neon-blue/20",
    glow: "hover:shadow-[0_0_30px_rgba(0,212,255,0.15)]",
  },
  "purple-400": {
    text: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-400/20",
    glow: "hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]",
  },
  "yellow-400": {
    text: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
    glow: "hover:shadow-[0_0_30px_rgba(250,204,21,0.15)]",
  },
  "orange-400": {
    text: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
    glow: "hover:shadow-[0_0_30px_rgba(251,146,60,0.15)]",
  },
};

export default function Features() {
  return (
    <section id="features" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-dark-900" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-green/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-mono">
            Core Features
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Built for the{" "}
            <span className="gradient-text-danger">agentic era</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            No existing DFIR AI framework verifies its own findings before reporting. Galaxy fills that gap.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, description, color, stats, statsLabel }) => {
            const c = colorMap[color] || colorMap["neon-green"];
            return (
              <div
                key={title}
                className={`glass-card p-6 border ${c.border} transition-all duration-300 hover:scale-[1.02] ${c.glow} group`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${c.text}`} />
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-black font-mono ${c.text}`}>{stats}</div>
                      <div className="text-xs text-gray-500">{statsLabel}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 glass-card border border-neon-green/20 p-8 text-center space-y-4">
          <div className="text-sm font-mono text-neon-green uppercase tracking-wider">Why this matters</div>
          <h3 className="text-3xl font-black text-white max-w-3xl mx-auto leading-tight">
            Agents execute financial transactions autonomously.{" "}
            <span className="text-red-400">Nobody verifies the payment matches what was agreed.</span>
          </h3>
          <p className="text-gray-400 max-w-2xl mx-auto">
            An AI forensic agent can hallucinate memory offsets, fabricate file paths, and invent registry keys — then submit them as evidence.
            Galaxy sits between the AI and the analyst and verifies every finding before it reaches the report.
          </p>
        </div>
      </div>
    </section>
  );
}
