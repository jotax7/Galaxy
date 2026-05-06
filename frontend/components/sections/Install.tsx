"use client";

import { useState } from "react";
import { Copy, Check, Terminal, Package, GitBranch } from "lucide-react";

const methods = [
  {
    id: "plugin",
    label: "Claude Plugin",
    icon: Terminal,
    steps: [
      { cmd: "claude plugins marketplace add galaxy-dfir/galaxy", comment: "Add to marketplace" },
      { cmd: "claude plugins install galaxy@galaxy-dfir", comment: "Install plugin" },
      { cmd: "galaxy demo", comment: "Run demo to verify" },
    ],
    note: "Recommended. Auto-registers PreToolUse hook.",
  },
  {
    id: "npm",
    label: "npm",
    icon: Package,
    steps: [
      { cmd: "npm i -g galaxy-dfir", comment: "Install globally" },
      { cmd: "galaxy install", comment: "Register hook" },
      { cmd: "galaxy demo", comment: "Verify install" },
    ],
    note: "Builds Go binary on postinstall. Requires Node.js 16+.",
  },
  {
    id: "source",
    label: "From Source",
    icon: GitBranch,
    steps: [
      { cmd: "git clone github.com/jotax7/Galaxy && cd Galaxy", comment: "Clone repo" },
      { cmd: "go build -o galaxy-bin .", comment: "Build binary (requires Go 1.22+)" },
      { cmd: "./galaxy-bin install", comment: "Register with Claude Code" },
    ],
    note: "Requires Go 1.22+. Produces a 6.5MB static binary.",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md text-gray-500 hover:text-neon-green hover:bg-neon-green/10 transition-all"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-neon-green" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function Install() {
  const [activeMethod, setActiveMethod] = useState("plugin");
  const active = methods.find((m) => m.id === activeMethod)!;
  const Icon = active.icon;

  return (
    <section id="install" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-dark-900" />
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-green/20 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-mono">
            Get Started
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Install in{" "}
            <span className="gradient-text">under a minute</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Three installation methods. Zero config required. Runs automatically on every Claude Code tool call.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Method tabs */}
          <div className="flex gap-2 mb-6">
            {methods.map(({ id, label, icon: MIcon }) => (
              <button
                key={id}
                onClick={() => setActiveMethod(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeMethod === id
                    ? "bg-neon-green/15 text-neon-green border border-neon-green/30"
                    : "text-gray-400 hover:text-white border border-white/10 hover:border-white/20"
                }`}
              >
                <MIcon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Terminal */}
          <div className="animated-border">
            <div className="bg-dark-800 rounded-xl overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-dark-900/50">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-gray-500 font-mono flex items-center gap-1.5">
                  <Icon className="w-3 h-3" />
                  {active.label}
                </span>
              </div>

              {/* Commands */}
              <div className="p-4 space-y-2">
                {active.steps.map(({ cmd, comment }, idx) => (
                  <div key={idx} className="group">
                    <div className="text-xs text-gray-600 font-mono mb-1"># {comment}</div>
                    <div className="flex items-center gap-2 bg-dark-900/50 rounded-lg px-3 py-2 border border-white/5 group-hover:border-neon-green/20 transition-all">
                      <span className="text-neon-green font-mono text-sm flex-shrink-0">$</span>
                      <code className="text-gray-300 font-mono text-sm flex-1 break-all">{cmd}</code>
                      <CopyButton text={cmd} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 pb-4">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-neon-green/5 border border-neon-green/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-green mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-gray-400">{active.note}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Post-install commands */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { cmd: "galaxy demo", desc: "Run hallucination scenarios" },
              { cmd: "galaxy scrutinizer --audit", desc: "View finding audit trail" },
            ].map(({ cmd, desc }) => (
              <div key={cmd} className="glass-card p-4 border border-white/5 hover:border-neon-green/20 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <code className="text-neon-green font-mono text-xs">{cmd}</code>
                  <CopyButton text={cmd} />
                </div>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
