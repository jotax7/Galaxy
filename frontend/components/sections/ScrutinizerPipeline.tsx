"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Tag, Search, Terminal, GitBranch, BarChart3, ChevronRight } from "lucide-react";

const stages = [
  {
    number: "01",
    name: "Classify",
    icon: Tag,
    checks: "Artifact type · Severity · MITRE ATT&CK",
    detail:
      "Every proposed finding is typed against a taxonomy of DFIR artifact categories: file artifact, memory injection, network IOC, registry persistence, lateral movement, or credential access. Severity is assigned (CRITICAL / HIGH / MEDIUM / LOW) and the finding is mapped to a specific MITRE ATT&CK technique ID. Unclassifiable findings are returned to the investigator agent with a structured clarification prompt before proceeding.",
    verdict: "TYPE + MAP",
    verdictBg: "bg-neon-blue/10",
    verdictBorder: "border-neon-blue/30",
    verdictText: "text-neon-blue",
    textColor: "text-neon-blue",
    borderColor: "border-neon-blue/20",
    bgColor: "bg-neon-blue/5",
    hoverBorder: "hover:border-neon-blue/40",
    numColor: "text-neon-blue/40",
  },
  {
    number: "02",
    name: "Provenance",
    icon: Search,
    checks: "File path · Memory offset · Line number in evidence",
    detail:
      "The most critical stage. Every memory offset, file path, registry key, and byte range cited in the finding is verified against the actual evidence image on disk. A hallucinated offset, fabricated file path, or non-existent registry key results in an immediate BLOCK. This stage directly protects chain-of-custody — a finding with no provenance in the evidence is not a finding; it is evidence spoliation.",
    verdict: "VERIFY",
    verdictBg: "bg-neon-purple/10",
    verdictBorder: "border-neon-purple/30",
    verdictText: "text-neon-purple",
    textColor: "text-neon-purple",
    borderColor: "border-neon-purple/20",
    bgColor: "bg-neon-purple/5",
    hoverBorder: "hover:border-neon-purple/40",
    numColor: "text-neon-purple/40",
  },
  {
    number: "03",
    name: "Tool Match",
    icon: Terminal,
    checks: "SIFT tool ran · Actual output matches cited output",
    detail:
      "Galaxy maintains a signed execution log of every SIFT tool invocation: volatility3, plaso, log2timeline, rekall, bulk_extractor, tshark, and others. A finding that cites tool output is cross-referenced against that log. If the tool never ran, if its actual stdout differs from what the AI attributes to it, or if the claimed tool version doesn't match the executed version — the finding is blocked.",
    verdict: "CROSSCHECK",
    verdictBg: "bg-yellow-400/10",
    verdictBorder: "border-yellow-400/30",
    verdictText: "text-yellow-400",
    textColor: "text-yellow-400",
    borderColor: "border-yellow-400/20",
    bgColor: "bg-yellow-400/5",
    hoverBorder: "hover:border-yellow-400/40",
    numColor: "text-yellow-400/40",
  },
  {
    number: "04",
    name: "Cross-Source",
    icon: GitBranch,
    checks: "Disk ↔ Memory · Memory ↔ PCAP · MFT ↔ Registry",
    detail:
      "Evidence sources must corroborate each other. A process found in a memory dump should have a corresponding executable on disk. A file modification timestamp should match both the MFT and the registry. Network connections observed in memory should appear in PCAP capture. Contradictions between sources don't automatically block the finding, but they penalize the confidence score and require mandatory analyst annotation before the finding can be reported.",
    verdict: "CORRELATE",
    verdictBg: "bg-neon-green/10",
    verdictBorder: "border-neon-green/30",
    verdictText: "text-neon-green",
    textColor: "text-neon-green",
    borderColor: "border-neon-green/20",
    bgColor: "bg-neon-green/5",
    hoverBorder: "hover:border-neon-green/40",
    numColor: "text-neon-green/40",
  },
  {
    number: "05",
    name: "Confidence",
    icon: BarChart3,
    checks: "Score 0.00–1.00 → ALLOW · RERUN · BLOCK",
    detail:
      "The four prior stage results are weighted and aggregated into a composite confidence score (0.00–1.00). ≥ 0.85: ALLOW — the finding is reported to the analyst with full provenance links, tool output excerpts, and MITRE mapping. 0.50–0.84: RERUN — the AI is retried with a focused prompt and tighter constraints. < 0.50: BLOCK — the finding is permanently suppressed, the failure reasons are logged, and a new SHA-256 entry is appended to the audit chain.",
    verdict: "ALLOW / RERUN / BLOCK",
    verdictBg: "bg-neon-green/10",
    verdictBorder: "border-neon-green/30",
    verdictText: "text-neon-green",
    textColor: "text-neon-green",
    borderColor: "border-neon-green/20",
    bgColor: "bg-neon-green/5",
    hoverBorder: "hover:border-neon-green/40",
    numColor: "text-neon-green/40",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 48 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function ScrutinizerPipeline() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section id="scrutinizer" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-800/40 to-dark-900" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16 space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              5‑Stage Scrutinizer
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Every finding runs a{" "}
            <span className="gradient-text">deterministic gauntlet</span>
            {" "}before it reaches the analyst.
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed">
            No LLMs in the verifier. No probabilistic shortcuts. Each of the five stages produces
            a binary pass/fail against hard evidence — a fabricated finding cannot survive all five.
          </p>
        </div>

        {/* Pipeline flow indicator */}
        <div className="hidden lg:flex items-center justify-center mb-12 px-8">
          {stages.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <div key={stage.number} className="flex items-center flex-1 min-w-0">
                <div className={`flex flex-col items-center gap-2 group cursor-default`}>
                  <div
                    className={`w-11 h-11 rounded-xl border ${stage.borderColor} ${stage.bgColor} flex items-center justify-center transition-all group-hover:scale-110 group-hover:shadow-lg`}
                  >
                    <Icon className={`w-5 h-5 ${stage.textColor}`} />
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${stage.textColor}`}>{stage.number}</span>
                  <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap">{stage.name}</span>
                </div>
                {i < stages.length - 1 && (
                  <div className="flex-1 flex items-center mx-1 mb-6">
                    <div className="pipeline-line flex-1" />
                    <ChevronRight className="w-3 h-3 text-gray-700 flex-shrink-0" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Stage cards — stagger in on scroll */}
        <motion.div
          ref={sectionRef}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
        >
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <motion.div
                key={stage.number}
                variants={cardVariants}
                className={`glass-card p-5 border ${stage.borderColor} ${stage.hoverBorder} ${stage.bgColor} flex flex-col gap-4 transition-all duration-300 hover:shadow-lg group`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl border ${stage.borderColor} ${stage.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-5 h-5 ${stage.textColor}`} />
                  </div>
                  <span className={`text-2xl font-black font-mono ${stage.numColor} leading-none`}>
                    {stage.number}
                  </span>
                </div>

                {/* Stage name */}
                <div>
                  <h3 className="text-white font-bold text-base leading-tight">{stage.name}</h3>
                  <p className={`text-xs font-mono ${stage.textColor} mt-1 opacity-80 leading-snug`}>
                    {stage.checks}
                  </p>
                </div>

                {/* Detail text */}
                <p className="text-xs text-gray-500 leading-relaxed flex-1">{stage.detail}</p>

                {/* Verdict badge */}
                <div className={`inline-flex items-center px-2.5 py-1 rounded-lg border ${stage.verdictBorder} ${stage.verdictBg} self-start`}>
                  <span className={`text-[10px] font-mono font-bold ${stage.verdictText} uppercase tracking-wider`}>
                    {stage.verdict}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Verdict legend */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
          {[
            { label: "ALLOW", color: "text-neon-green", bg: "bg-neon-green/10", border: "border-neon-green/30", desc: "≥ 0.85 confidence — reported to analyst" },
            { label: "RERUN", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", desc: "0.50–0.84 — AI retried with constraints" },
            { label: "BLOCK", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30", desc: "< 0.50 — suppressed, audit entry logged" },
          ].map(({ label, color, bg, border, desc }) => (
            <div key={label} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${border} ${bg}`}>
              <span className={`font-mono font-bold text-sm ${color}`}>{label}</span>
              <span className="text-xs text-gray-500">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
