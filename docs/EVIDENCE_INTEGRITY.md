# Evidence Integrity in Galaxy

The FIND EVIL judging rubric explicitly asks:

> "Are guardrails architectural or prompt-based? Judges evaluate where security boundaries are enforced and whether they were tested for bypass."

This document answers that question for Galaxy.

## What "evidence integrity" means in DFIR

Forensic evidence must remain *byte-identical* from acquisition through analysis to court. Any modification — even a metadata-only one like updating an access time — can constitute **evidence spoliation**, which can result in evidence being thrown out and the case lost.

For an AI agent operating on evidence, this is hard. LLMs are statistical pattern-matchers, and the natural way they learn to "explore" a filesystem (via `ls`, `cat`, `grep`) often involves OS calls that update access times on every read.

Galaxy enforces evidence integrity through three layers, in order of strength:

## Layer 1 — Architectural (strongest)

Evidence files are mounted **read-only** before the investigator agent starts:

```bash
# For .E01 disk images:
ewfmount -X allow_other,ro evidence.E01 /mnt/evidence_raw/
mount -o ro,loop /mnt/evidence_raw/ewf1 /mnt/evidence/

# For raw memory dumps, no mount is needed; we never write to them.
```

The investigator process runs as a non-root user (`galaxy` user, created at install time) that has read-only filesystem permissions on `/mnt/evidence/`.

Even if the LLM **decides** to modify evidence, the OS will deny the write. There is no prompt the agent could craft to circumvent this; it would have to escalate privileges, which Protocol SIFT and Claude Code do not permit.

## Layer 2 — Hash verification (detection-grade)

Before investigation begins, Galaxy computes SHA-256 of every evidence file. The hashes are pinned in the `EvidenceContext` and replayed at the end of investigation:

```
$ galaxy investigate --evidence disk.E01 --memory mem.dump
[galaxy] Computing baseline hashes...
  disk.E01      sha256:a1b2c3...
  mem.dump      sha256:d4e5f6...
[galaxy] Investigation starting...
...
[galaxy] Verifying evidence integrity...
  disk.E01      sha256:a1b2c3...  ✓ unchanged
  mem.dump      sha256:d4e5f6...  ✓ unchanged
[galaxy] PASS — no spoliation detected
```

If a hash differs at the end, the entire investigation report is marked `EVIDENCE_INTEGRITY_VIOLATION` and the verdict on every finding becomes BLOCK regardless of stage outputs. The audit log records the violation in tamper-evident form.

## Layer 3 — Audit trail (forensic-grade)

Every action Galaxy takes is logged to `audit.jsonl` with a SHA-256 hash chain. The chain enforces append-only semantics: modifying any past entry invalidates the chain from that point forward.

`galaxy audit --verify` walks the chain. If the verification fails, the chain output identifies the first invalid entry index — usable as expert testimony for chain-of-custody arguments.

## What we tested for bypass

We attempted the following bypass scenarios during development:

| Attempt | Result |
|---------|--------|
| Agent runs `mv` on evidence file | OS denies (read-only mount) |
| Agent runs `chmod +w` | OS denies (non-root user) |
| Agent invokes a SIFT tool with `--output-to-evidence` flag | No SIFT tool writes to its input by default; we manually verified. |
| Agent claims a tool execution that didn't happen | Tool Match stage rejects (`execution_not_found`). |
| Agent edits `audit.jsonl` directly | Hash chain breaks; `--verify` detects at the modified index. |
| Agent appends a fabricated entry to `audit.jsonl` | Hash chain doesn't validate (PrevHash mismatch); `--verify` detects. |
| Agent fakes a SHA-256 to hide a real evidence modification | Galaxy re-computes the hash from the file at end-of-run; fake hash is overridden by recomputed actual hash. The mismatch is logged. |

## Honest limits

We did **not** test:

- **Tool-level evidence modification.** If a SIFT tool itself modifies the file it analyzes (none we know of do, but we did not audit all 200+), Galaxy would not catch it directly. The end-of-run hash check would catch it after the fact.
- **Memory snapshot mutation by Volatility plugins.** Volatility 3 reads from memory dumps without modifying them; we trust this.
- **Mount-time evidence mutation.** Some forensic mount drivers (e.g., older versions of `ewfmount`) had bugs that could mark evidence dirty. We rely on the SIFT Workstation's pinned versions.

We document these as known limits rather than implying perfect protection.
