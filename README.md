# Galaxy — Self-Skeptical AI Agent for SIFT Forensics

> **AI forensic agents hallucinate. In DFIR that means evidence spoliation and invalid cases.**
> Galaxy is an autonomous incident response agent built on Protocol SIFT that scrutinizes
> its own findings before reporting. Self-correction, traceable, audit-grade.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built for FIND EVIL](https://img.shields.io/badge/FIND%20EVIL-2026-red)](https://findevil.devpost.com)
[![SIFT Workstation](https://img.shields.io/badge/SANS-SIFT%20Workstation-blue)](https://www.sans.org/tools/sift-workstation)

## The Problem

Protocol SIFT works. It also **hallucinates more than we'd like** — that's the
exact phrase from the FIND EVIL hackathon brief, and it is the central problem
this project addresses.

In DFIR a hallucinated finding is not just a UX defect. It is **evidence
spoliation**: a fabricated artifact reference, an invented offset, or a
misattributed timeline event can invalidate a case in court. As AI-driven
attackers move at 8-minute breakout speeds, defenders need agents that can
match that velocity — but only if those agents can be **trusted**.

Today they cannot.

## The Solution

Galaxy is an autonomous IR agent that wraps Protocol SIFT with a deterministic
**self-skepticism loop**. Every finding the agent proposes is run through a
five-stage scrutinizer that cross-checks it against raw evidence, tool execution
logs, and other findings. Only findings that survive the scrutiny reach the
analyst.

```
┌─────────────────────────────────────────────────────────────┐
│                      GALAXY AGENT LOOP                      │
│                                                             │
│  INVESTIGATE ──▶ PROPOSE FINDING ──▶ SCRUTINIZE ──▶ VERDICT │
│       ▲                                    │                │
│       │                                    │                │
│       └────────── re-run with ─────────────┘                │
│                  adjusted params                            │
│                                                             │
│                  ▼                                          │
│         ┌─────────────────┐                                 │
│         │  AUDIT TRAIL    │  ◀── SHA-256 hash chain         │
│         │  (tamper-proof) │      Trace any finding to       │
│         └─────────────────┘      the tool execution that    │
│                                   produced it.              │
└─────────────────────────────────────────────────────────────┘
```

### The Five Stages of Scrutiny

| # | Stage | What it checks |
|---|-------|----------------|
| 1 | **Classify** | What artifact type and severity does this finding claim? Map to MITRE ATT&CK. |
| 2 | **Provenance** | Does the cited file/offset/registry-key actually exist in the evidence? |
| 3 | **Tool-execution match** | Did the tool the agent claims to have run, actually run? Does its output support the claim? |
| 4 | **Cross-source consistency** | If the agent saw evidence on disk, does memory/network/logs corroborate or contradict? |
| 5 | **Confidence verdict** | `ALLOW` (report it), `RE-RUN` (gather more evidence), or `BLOCK` (reject, hallucination detected). |

All stages are **deterministic** — no LLM in the verifier. This is intentional:
the criterion the FIND EVIL judges score on is *constraint implementation —
architectural vs prompt-based*. Galaxy enforces guardrails architecturally.

## Why this wins on the FIND EVIL judging criteria

Galaxy is mapped 1:1 against the six equally weighted judging criteria:

1. **Autonomous Execution Quality** — the self-skepticism loop *is* literal self-correction.
2. **IR Accuracy** — the scrutinizer's job is catching hallucinations.
3. **Breadth & Depth** — depth via cross-source consistency on disk + memory + logs.
4. **Constraint Implementation** — pipeline is deterministic Go, not prompt-based.
5. **Audit Trail Quality** — SHA-256 hash chain traceable to tool execution.
6. **Usability & Documentation** — single-binary CLI, drop-in to SIFT Workstation.

## Quick Start (on SIFT Workstation)

```bash
# 1. From inside SIFT Workstation, install Protocol SIFT first
curl -fsSL https://raw.githubusercontent.com/teamdfir/protocol-sift/main/install.sh | bash

# 2. Install Galaxy
curl -fsSL https://raw.githubusercontent.com/<YOUR-USER>/galaxy/main/install.sh | bash

# 3. Run an investigation
galaxy investigate /path/to/evidence/disk.E01

# 4. View the audit trail with chain verification
galaxy audit --verify
```

## Architecture

Galaxy uses a **skeleton + skin** architecture so the verification core can be
re-targeted to other agentic security domains (which is how the verifier was
ported from a previous payments-security project, PayGuard).

```
galaxy/
├── core/                    ← THE SKELETON (domain-agnostic)
│   ├── pipeline/            ← stage orchestrator
│   ├── audit/               ← SHA-256 hash-chained JSONL log
│   ├── state/               ← persisted between agent invocations
│   └── classify/            ← generic classifier framework
│
├── domains/dfir/            ← THE SKIN (DFIR-specific)
│   ├── stages/              ← provenance, tool-match, cross-source
│   ├── prompts/             ← investigator agent prompts
│   └── fixtures/            ← captured Protocol SIFT outputs for tests
│
├── agents/
│   ├── investigator/        ← Claude agent that runs SIFT tools
│   └── scrutinizer/         ← optional second-opinion agent for tie-breaking
│
├── frontend/                ← Next.js investigation dashboard
└── hooks/                   ← Claude Code PreToolUse hook for live use
```

## What Galaxy does (and doesn't) claim

✅ **Galaxy does:**
- Catch hallucinated findings before they reach the analyst report.
- Provide a tamper-evident audit trail of every agent decision.
- Run autonomously on disk images, memory captures, and live SIFT-mounted evidence.
- Self-correct: when the scrutinizer rejects a finding, the investigator re-runs.

❌ **Galaxy does not:**
- Replace a human analyst on novel or high-stakes cases.
- Guarantee zero hallucinations — it dramatically reduces them and makes the
  remaining ones traceable.
- Modify original evidence files. Ever. (See `docs/EVIDENCE_INTEGRITY.md`.)

## Building from source

Requirements: Go 1.21+, Node 20+, Python 3.10+ (for fixture generation).

```bash
git clone https://github.com/<YOUR-USER>/galaxy.git
cd galaxy
make build       # builds the galaxy CLI binary
make test        # runs Go unit tests
make frontend    # builds the Next.js dashboard
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — full system design
- [`docs/EVIDENCE_INTEGRITY.md`](docs/EVIDENCE_INTEGRITY.md) — read-only enforcement
- [`docs/ACCURACY_REPORT.md`](docs/ACCURACY_REPORT.md) — Galaxy vs Protocol SIFT baseline
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) — what to show in the 5-min video

## License

MIT. See [`LICENSE`](LICENSE).

## Acknowledgments

Galaxy stands on the shoulders of:
- **SANS SIFT Workstation** — 18 years of DFIR community tooling.
- **Protocol SIFT** — the proof-of-concept that demonstrated AI + SIFT.
- **Anthropic** — the GTG-1002 report defined the threat that makes Galaxy necessary.
- **PayGuard** — the verifier-pipeline pattern was first developed for AI agent
  payment security; Galaxy is its DFIR-domain port.

Built for the **FIND EVIL!** hackathon, April 15 – June 15 2026.
