"use client";

import Link from "next/link";
import {
  Users,
  Shield,
  BarChart3,
  Lock,
  Bell,
  Building2,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const b2bFeatures = [
  {
    icon: Users,
    title: "Multi-seat management",
    description: "Add developers to your org in one click. Centrally manage who has what payment permissions.",
  },
  {
    icon: Shield,
    title: "Org-level policy enforcement",
    description: "Push spending limits, rate limits, and approval thresholds to all seats from a single policy.yaml.",
  },
  {
    icon: BarChart3,
    title: "Shared security dashboard",
    description: "Aggregated audit trail across your entire team. Filter by developer, session, or transaction.",
  },
  {
    icon: Lock,
    title: "SSO / SAML",
    description: "Integrate with Okta, Azure AD, or any SAML 2.0 provider. Available on Team and Enterprise plans.",
  },
  {
    icon: Bell,
    title: "Slack & PagerDuty alerts",
    description: "Get notified the instant a BLOCK or ASK event fires in any developer's environment.",
  },
  {
    icon: Building2,
    title: "On-prem deployment",
    description: "Run PayGuard server on your own infrastructure. Zero data leaves your environment. Enterprise only.",
  },
];

export default function ForTeams() {
  return (
    <section id="for-teams" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-dark-900" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue/20 to-transparent" />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-blue/3 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-xs font-mono">
            <Users className="w-3 h-3" />
            For Teams &amp; Enterprises
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Security at{" "}
            <span className="text-neon-blue">org scale</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            PayGuard Team and Enterprise give your security and engineering leads full visibility
            and control over every AI payment across the organization.
          </p>
        </div>

        {/* Split layout */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Left: feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {b2bFeatures.map(({ icon: Icon, title, description }) => (
              <div key={title} className="glass-card border border-neon-blue/10 p-5 hover:border-neon-blue/30 transition-all">
                <div className="w-9 h-9 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-neon-blue" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1.5">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{description}</p>
              </div>
            ))}
          </div>

          {/* Right: dashboard mockup */}
          <div className="glass-card border border-neon-blue/20 overflow-hidden">
            {/* Fake tab bar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-dark-900/60 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-neon-green/50" />
              </div>
              <span className="text-xs font-mono text-gray-600">payguard.io/dashboard/org/acme</span>
            </div>

            <div className="p-5 space-y-4">
              {/* Org stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Active seats", value: "24", color: "text-neon-blue" },
                  { label: "Blocked (24h)", value: "3", color: "text-red-400" },
                  { label: "Protected ($)", value: "$12,440", color: "text-neon-green" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="glass-card border border-white/5 p-3 text-center">
                    <div className={`text-lg font-black font-mono ${color}`}>{value}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Seat table */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-gray-600 uppercase tracking-wider px-1">Team members</div>
                {[
                  { name: "alice@acme.com", role: "Admin", status: "Active", decisions: 42 },
                  { name: "bob@acme.com", role: "Developer", status: "Active", decisions: 18 },
                  { name: "carol@acme.com", role: "Developer", status: "Active", decisions: 31 },
                ].map((member) => (
                  <div key={member.name} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-dark-800/50 border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-neon-blue/20 border border-neon-blue/30 flex items-center justify-center">
                        <span className="text-xs font-bold text-neon-blue">{member.name[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="text-xs text-white font-mono">{member.name}</div>
                        <div className="text-xs text-gray-600">{member.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-gray-500">{member.decisions} tx</span>
                      <span className="text-xs font-mono text-neon-green flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                        {member.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Policy bar */}
              <div className="px-3 py-2.5 rounded-lg border border-neon-blue/20 bg-neon-blue/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-neon-blue" />
                    <span className="text-xs font-mono text-neon-blue">Org Policy: acme-strict.yaml</span>
                  </div>
                  <span className="text-xs font-mono text-gray-600">Pushed to 24 seats</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* B2B CTA */}
        <div className="glass-card border border-neon-blue/20 p-8 text-center space-y-5">
          <div className="flex items-center justify-center gap-2 text-neon-blue text-sm font-mono">
            <Building2 className="w-4 h-4" />
            Enterprise-ready
          </div>
          <h3 className="text-3xl font-black text-white max-w-2xl mx-auto">
            Protect your whole team for less than one fraudulent payment
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-500">
            {["SSO/SAML", "On-prem", "SLA 99.99%", "SOC 2", "Dedicated CSM", "Custom contracts"].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-neon-blue" />
                {item}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-neon-blue text-dark-900 font-bold rounded-xl hover:bg-neon-blue/90 transition-all shadow-lg shadow-neon-blue/20"
            >
              Run Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/#how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all"
            >
              View Attack Simulation
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
