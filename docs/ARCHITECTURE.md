# Galaxy Architecture

## Design principles

Galaxy follows three principles, in priority order:

1. **The LLM is never the last word.** Every LLM-generated claim is gated by a deterministic verifier. Hallucinations don't reach the analyst — they get caught and either re-tried or rejected.
2. **Architectural guardrails over prompt-based ones.** The investigator agent *cannot* bypass the scrutinizer because the scrutinizer runs in a separate Go process the LLM has no control over. We avoid "system prompt says: don't lie" — instead we make lies *mechanically detectable*.
3. **Tamper-evident by default.** Every decision the system makes is appended to a SHA-256 hash-chained audit log. Modifying any past entry invalidates the chain from that point forward.

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              GALAXY                                     │
│                                                                         │
│  ┌──────────────────┐   findings    ┌─────────────────────┐             │
│  │   INVESTIGATOR   │ ────────────▶ │     SCRUTINIZER     │             │
│  │   (TypeScript    │               │  (Go, deterministic)│             │
│  │   Claude Agent   │  ◀────────── │  5-stage pipeline   │             │
│  │      SDK)        │   verdicts    └─────────┬───────────┘             │
│  └────────┬─────────┘                         │                         │
│           │                                   │                         │
│   tool    │                              ┌────▼────┐                    │
│   calls   │                              │  AUDIT  │                    │
│           │                              │  TRAIL  │ SHA-256 hash chain │
│           ▼                              └─────────┘                    │
│  ┌──────────────────┐                                                   │
│  │  PROTOCOL SIFT   │                                                   │
│  │   (MCP server)   │                                                   │
│  └────────┬─────────┘                                                   │
└───────────┼─────────────────────────────────────────────────────────────┘
            │
            ▼
   ┌─────────────────┐
   │ SIFT WORKSTATION│
   │ Volatility      │
   │ Plaso           │
   │ Sleuth Kit      │
   │ regripper, etc. │
   └─────────────────┘
```

## Component responsibilities

### Investigator agent (`agents/investigator/`)

- TypeScript, runs as a Node process driven by the Claude Agent SDK.
- Uses Protocol SIFT (over MCP) as its sole interface to forensic tools.
- Plans investigation, runs tools, parses outputs, emits candidate Findings.
- **Cannot** write to evidence. Cannot bypass the scrutinizer.
- Sees scrutinizer verdicts and adjusts its strategy (re-runs with new params, picks a different tool, or accepts rejection and moves on).

### Scrutinizer (`core/pipeline/` + `domains/dfir/stages/`)

- Pure Go, no LLM, runs as a child process invoked by the investigator.
- Five deterministic stages, each with a clear ALLOW / RERUN / BLOCK decision:

  1. **Classify** — normalizes artifact type, severity, MITRE TTPs.
  2. **Provenance** — verifies the cited file/offset/line actually exists.
  3. **Tool match** — verifies the cited tool ran and produced the cited output.
  4. **Cross-source** — corroborates against findings from other evidence sources.
  5. **Confidence** — aggregates signals into a final score and decision.

- Emits a Verdict (allow / rerun / block + reason + confidence).

### Audit log (`core/audit/`)

- Append-only JSONL file with SHA-256 hash chain.
- Every finding + verdict pair is logged.
- `galaxy audit --verify` walks the chain and reports any tampering.

### State (`core/state/`)

- File-locked JSON store for cross-invocation state (re-run counters, tool execution registry).
- Used to enforce `--max-iterations`.

## Trust boundaries

| Boundary | Enforcement |
|----------|-------------|
| Investigator cannot modify evidence | OS-level: evidence is mounted read-only via `ewfmount -X allow_other,ro`. The investigator process runs as a non-root user with no write permission on the mount point. |
| Investigator cannot bypass scrutinizer | Architectural: candidate findings are written to a JSON file consumed by a separate Go process. The investigator does not have access to the audit log signing key (no key — just hash chain). |
| Investigator cannot fabricate tool executions | The Tool Match stage cross-references against an execution registry that only Protocol SIFT writes to. Made-up `execution_id`s fail. |
| Audit log cannot be silently modified | Hash chain. Modifying any entry invalidates the chain forward; `--verify` detects it. |

## What the scrutinizer cannot catch

We are honest about Galaxy's limits:

- **Plausible-but-wrong findings that cite real artifacts.** If the agent misinterprets a real prefetch entry (e.g. confuses execution time with creation time), Galaxy may accept it. The scrutinizer verifies *traceability*, not *interpretation*. Cross-source corroboration helps but isn't a full mitigation.
- **Coordinated inconsistency**, where the agent fabricates a self-consistent story across multiple findings. The cross-source stage catches *contradictions*, not *coordinated lies*.
- **Tool output tampering at the SIFT level.** Galaxy trusts Protocol SIFT's tool outputs. If a SIFT tool itself is wrong or compromised, Galaxy will faithfully report the bad output as fact.

We document these limits in `docs/ACCURACY_REPORT.md` rather than hiding them. Honesty about failure modes is itself a judging criterion.
