import Link from "next/link";
import { Shield } from "lucide-react";

const GitHubIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-dark-900 py-16">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

          {/* Brand */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-neon-green" />
              </div>
              <span className="font-mono font-bold text-xl text-white tracking-tight">
                Gal<span className="text-neon-green">axy</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
              Autonomous DFIR agent for Protocol SIFT with a self-skepticism loop.
              Every finding passes a 5-stage deterministic verifier before it reaches the analyst.
            </p>
            <div className="flex items-center gap-2">
              <span className="status-dot" />
              <span className="text-xs text-neon-green font-mono">v1.0.0 · MIT License</span>
            </div>
            <Link
              href="https://github.com/jotax7/Galaxy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-white/20 hover:bg-white/8 transition-all text-sm font-medium"
            >
              <GitHubIcon />
              jotax7/Galaxy
            </Link>
          </div>

          {/* Navigation */}
          <div className="space-y-5">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-wider">Navigation</div>
            <div className="space-y-2.5">
              {[
                { href: "/", label: "Landing" },
                { href: "/#scrutinizer", label: "How It Works" },
                { href: "/demo", label: "Live Investigation Demo" },
                { href: "/dashboard", label: "Audit Trail Viewer" },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block text-sm text-gray-400 hover:text-neon-green transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Scrutinizer stages */}
          <div className="space-y-5">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-wider">Scrutinizer Stages</div>
            <div className="space-y-2">
              {[
                { n: "01", name: "Classify", desc: "Artifact type · MITRE ATT&CK" },
                { n: "02", name: "Provenance", desc: "File / offset / line in evidence" },
                { n: "03", name: "Tool Match", desc: "SIFT tool ran and produced output" },
                { n: "04", name: "Cross-Source", desc: "Disk ↔ memory ↔ pcap" },
                { n: "05", name: "Confidence", desc: "ALLOW / RERUN / BLOCK verdict" },
              ].map(({ n, name, desc }) => (
                <div key={n} className="flex items-baseline gap-2.5">
                  <span className="text-[10px] font-mono text-gray-700 w-5 flex-shrink-0">{n}</span>
                  <span className="text-sm text-gray-400">
                    <span className="text-gray-300 font-medium">{name}</span>
                    <span className="text-gray-600 ml-1.5 text-xs">{desc}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-600 font-mono">
            © 2026 Galaxy · FIND EVIL! Hackathon · SANS Institute
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {["ALLOW", "RERUN", "BLOCK"].map((v, i) => (
                <span
                  key={v}
                  className={`text-[10px] font-mono font-bold ${
                    i === 0 ? "text-neon-green" : i === 1 ? "text-yellow-400" : "text-red-400"
                  }`}
                >
                  {v}
                </span>
              ))}
            </div>
            <span className="text-gray-700 text-xs font-mono">5-stage verifier · 0 LLMs</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
