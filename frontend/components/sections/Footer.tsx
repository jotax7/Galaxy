import Link from "next/link";
import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-dark-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-neon-green" />
              </div>
              <span className="font-mono font-bold text-lg text-white">
                Pay<span className="text-neon-green">Guard</span>
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Security plugin for Claude Code that protects agent-to-agent payments and transactions.
            </p>
            <div className="flex items-center gap-2">
              <span className="status-dot w-2 h-2" />
              <span className="text-xs text-neon-green font-mono">v0.4.0 — MIT License</span>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <div className="text-xs font-mono text-gray-500 uppercase tracking-wider">Navigation</div>
            <div className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/#how-it-works", label: "How it Works" },
                { href: "/#features", label: "Features" },
                { href: "/demo", label: "Live Demo" },
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

          <div className="space-y-4">
            <div className="text-xs text-gray-600">
              107 tests passing · 2,800 lines Go · MIT License
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-600 font-mono">
            © 2026 PayGuard
          </div>
          <div className="text-xs text-gray-600">
            Protecting AI agent financial transactions.
          </div>
        </div>
      </div>
    </footer>
  );
}
