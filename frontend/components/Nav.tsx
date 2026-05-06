"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

// 5 dots in a Cassiopeia/W pattern — one per Scrutinizer stage
function GalaxyConstellation() {
  const dots = [
    { cx: 3,  cy: 22, r: 2,   delay: "0ms"   }, // Stage 1: Classify
    { cx: 9,  cy: 6,  r: 2.5, delay: "400ms" }, // Stage 2: Provenance
    { cx: 18, cy: 16, r: 1.8, delay: "800ms" }, // Stage 3: Cross-source
    { cx: 27, cy: 6,  r: 2,   delay: "1200ms" }, // Stage 4: Tool Output
    { cx: 33, cy: 22, r: 2.5, delay: "1600ms" }, // Stage 5: Verdict
  ];

  const lines = [
    [3, 22, 9, 6],
    [9, 6, 18, 16],
    [18, 16, 27, 6],
    [27, 6, 33, 22],
  ];

  return (
    <svg
      width="36"
      height="28"
      viewBox="0 0 36 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {lines.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#00d4ff"
          strokeWidth="0.75"
          strokeOpacity="0.45"
          strokeLinecap="round"
        />
      ))}
      {dots.map((dot, i) => (
        <g key={i}>
          <circle
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r * 2}
            fill="#00d4ff"
            opacity="0.18"
            className="constellation-halo"
            style={{ animationDelay: dot.delay }}
          />
          <circle
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r}
            fill="#00d4ff"
            className="constellation-dot"
            style={{ animationDelay: dot.delay }}
          />
        </g>
      ))}
    </svg>
  );
}

const navLinks = [
  { href: "/demo",      label: "Live Demo"   },
  { href: "/dashboard", label: "Audit Trail" },
];

export default function Nav() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`transition-all duration-300 ${
        scrolled
          ? "bg-dark-900/80 backdrop-blur-xl border-b border-neon-blue/15 shadow-lg shadow-black/40"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <GalaxyConstellation />
            <span className="font-mono font-bold text-lg text-white tracking-tight group-hover:text-neon-blue transition-colors duration-200">
              Galaxy
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === link.href
                    ? "text-neon-blue bg-neon-blue/10 border border-neon-blue/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* GitHub + right side */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="https://github.com/jotax7/Galaxy"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Galaxy on GitHub"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-neon-blue border border-white/10 hover:border-neon-blue/40 transition-all duration-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-dark-900/98 backdrop-blur-xl border-b border-neon-blue/10">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "text-neon-blue bg-neon-blue/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="https://github.com/jotax7/Galaxy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
