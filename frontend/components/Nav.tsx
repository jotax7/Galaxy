"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Menu, X, Zap } from "lucide-react";

const navLinks = [
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/#features", label: "Features" },
  { href: "/demo", label: "Live Demo" },
  { href: "/agent", label: "Agent" },
  { href: "/integration", label: "Integration" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-dark-900/95 backdrop-blur-md border-b border-neon-green/10 shadow-lg shadow-black/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center group-hover:border-neon-green/60 transition-all">
                <Shield className="w-4 h-4 text-neon-green" />
              </div>
              <div className="absolute inset-0 rounded-lg bg-neon-green/5 blur-sm group-hover:bg-neon-green/15 transition-all" />
            </div>
            <span className="font-mono font-bold text-lg text-white">
              Pay<span className="text-neon-green">Guard</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono bg-neon-green/10 text-neon-green border border-neon-green/20">
              <Zap className="w-2.5 h-2.5" />
              v0.4
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  (pathname === link.href || (link.href === "/demo" && pathname === "/demo"))
                    ? "text-neon-green bg-neon-green/10 border border-neon-green/20"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/demo"
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold bg-neon-green text-dark-900 hover:bg-neon-green/90 transition-all btn-primary"
            >
              Try Demo
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-dark-900/98 backdrop-blur-md border-b border-neon-green/10">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "text-neon-green bg-neon-green/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Link
                href="/demo"
                onClick={() => setMobileOpen(false)}
                className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm font-semibold bg-neon-green text-dark-900"
              >
                Try Demo
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
