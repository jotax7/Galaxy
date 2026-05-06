# Galaxy Frontend

Next.js 15 + React 19 + Tailwind dashboard for Galaxy investigations.

> ⚠️ **HEADS UP**: this directory contains components inherited from
> PayGuard (the payments-security project Galaxy was forked from). Most
> components still reference payments, MCP attacks on transactions, etc.
> They are **scaffolding to be rewritten** for DFIR — the visual design
> (glass cards, scan line, dark theme, dramatic stage reveal) is what we
> reuse, not the copy.

## Components to rewrite (PayGuard → Galaxy)

| File | Current state | What it needs |
|------|---------------|---------------|
| `app/page.tsx` | PayGuard landing | Galaxy landing: "Self-skeptical AI for SIFT forensics" |
| `app/demo/page.tsx` | Payment attack simulation | Investigation simulation: agent proposes finding → scrutinizer rejects → agent re-runs → scrutinizer allows |
| `app/dashboard/page.tsx` | Payment monitoring dashboard | Investigation dashboard: live findings list with scrutinizer verdicts |
| `app/investigation/page.tsx` | (new) | Per-case investigation view with stage timeline |
| `components/Nav.tsx` | "PayGuard" branding | "Galaxy" branding |
| `components/sections/Hero.tsx` | Payments hero | Forensics hero |
| `components/sections/Pipeline.tsx` | 5 financial stages | 5 DFIR stages (Classify, Provenance, Tool Match, Cross-Source, Confidence) |
| `components/sections/MCPProtection.tsx` | MCP payment tampering | MCP forensic tool tampering |
| `components/sections/Features.tsx` | Generic features | DFIR-specific features |
| `components/sections/Metrics.tsx` | Payment metrics | Hallucination catch metrics |
| `lib/pipeline.ts` | Payment pipeline simulation | DFIR pipeline simulation |

## Scope for hackathon

The frontend is **not** the primary deliverable for FIND EVIL — the brief
explicitly says judges want a screencast of terminal execution, not a polished
web UI. Don't sink days into pixel-perfect frontend.

Minimum viable frontend (1-2 days):

1. Landing page: hero + 3 feature blocks + install instructions.
2. Demo page: live scrutinizer playthrough with the three fixture findings.
3. Audit log viewer: paste an `audit.jsonl` and verify the chain.

Skip everything else until after submission.

## Dev

```bash
cd frontend
npm install
npm run dev   # localhost:3000
```
