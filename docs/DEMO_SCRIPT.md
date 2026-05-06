# Galaxy — Demo Video Script (5 minutes)

The FIND EVIL submission requirements say the video must be:

> A screencast of live terminal execution with audio narration. Not slides. Not marketing videos. Show the agent working against real evidence, including at least one self-correction sequence.

This is the script. Stick close to it. The demo's whole purpose is to make the judges believe Galaxy is real and useful, in five minutes flat.

## The story arc

1. **The pain (0:00 – 0:30)** — Show Protocol SIFT hallucinating against real evidence. This is the pain Galaxy fixes; the judges feel it instantly because the brief itself describes it.
2. **The setup (0:30 – 1:00)** — Show the case data, run `galaxy investigate`, watch the investigator start.
3. **A finding gets accepted (1:00 – 2:00)** — Show one finding pass through all five scrutinizer stages cleanly.
4. **A hallucination gets caught (2:00 – 3:30)** — The big moment. The agent proposes a finding with a fabricated path. Provenance stage rejects. Agent re-runs. Re-emitted finding cites a real path. Stage allows.
5. **Audit trail integrity (3:30 – 4:30)** — Show `galaxy audit --verify` on the live log. Then show a tampering attempt being caught.
6. **The wrap (4:30 – 5:00)** — Brief verbal summary against the six judging criteria.

## Detailed shots

### 0:00 – 0:30 — The pain

```
$ # FIND EVIL brief: "Protocol SIFT works. It also hallucinates more than we'd like."
$ # Let's verify that. Here's a real disk image, and Protocol SIFT analyzing it.
$ protocol-sift investigate --evidence /cases/case01/disk.E01
...
[protocol-sift] Found persistence in HKLM\Software\Microsoft\Windows\CurrentVersion\Run\evilkey
$ # That registry path doesn't exist on this hive. We just got hallucinated to.
```

**Narration:** *"This is the FIND EVIL hackathon's stated problem. Protocol SIFT hallucinates findings. In DFIR, a hallucinated finding is evidence spoliation — it can invalidate a case. Galaxy fixes that."*

### 0:30 – 1:00 — Setup

```
$ ls /cases/case01/
disk.E01    memory.dump

$ galaxy investigate \
    --evidence /cases/case01/disk.E01 \
    --memory /cases/case01/memory.dump \
    --max-iterations 5

[galaxy] Computing baseline hashes...
  disk.E01    sha256:7a3f...
  memory.dump sha256:8b4e...
[galaxy] Mounting disk.E01 read-only at /mnt/evidence/
[galaxy] Investigator starting (max 5 iterations)
[investigator] iteration 1/5
```

**Narration:** *"Galaxy is built on Protocol SIFT — same SIFT Workstation, same MCP integration. The difference is that every finding the LLM proposes runs through a five-stage deterministic verifier before reaching me."*

### 1:00 – 2:00 — A finding gets accepted

```
[investigator] iteration 1/5
[investigator] running: vol3.py windows.pslist
[investigator] tool execution recorded: exec-1 (sha256:c4d5..., 8412 bytes)
[investigator] proposing: f-1 "powershell.exe (PID 4521) running as SYSTEM"

[scrutinizer] f-1: classify     → allow (memory_process / medium / T1059.001)
[scrutinizer] f-1: provenance   → allow (path /mnt/evidence/memory.dump verified, offset 0xF34A in range)
[scrutinizer] f-1: tool_match   → allow (vol3.py windows.pslist verified, digest matches)
[scrutinizer] f-1: cross_source → allow (corroborated by f-0 from disk prefetch)
[scrutinizer] f-1: confidence   → allow (score=0.85)
[investigator] ✓ accepted: f-1
```

**Narration:** *"Here's a clean finding. PowerShell running as SYSTEM, cited offset, real tool, corroborated by a disk-side prefetch artifact. All five stages pass. Confidence 0.85. Accepted."*

### 2:00 – 3:30 — A hallucination gets caught — THE MONEY SHOT

```
[investigator] iteration 2/5
[investigator] running: regripper -p run /mnt/evidence/Windows/System32/config/SOFTWARE
[investigator] tool execution recorded: exec-2 (sha256:e5f6..., 234 bytes)
[investigator] proposing: f-2 "Persistence via HKLM\...\Run\malicious_key"
                              cites: /mnt/evidence/Windows/System32/config/SOFTWARE
                              line: 8420

[scrutinizer] f-2: classify     → allow (registry_key / high / T1547.001)
[scrutinizer] f-2: provenance   → BLOCK
              reason: finding cites line 8420 but the file has only 412 lines
              cited_line: 8420
              file_lines: 412

[investigator] ✗ rejected: f-2 (provenance: line out of range)
[investigator] re-planning: regripper output had 17 entries, none referenced "malicious_key".
               The proposed finding extrapolated from that. Re-running with strict mode.
[investigator] iteration 3/5
[investigator] running: rip.pl -r SOFTWARE -p winnt_cv_run
[investigator] tool execution recorded: exec-3 (sha256:f7a8..., 891 bytes)
[investigator] proposing: f-3 "Persistence: Run key 'WindowsUpdater' -> C:\Users\Public\update.exe"
                              cites: SOFTWARE\Microsoft\Windows\CurrentVersion\Run
                              evidence_path: /mnt/evidence/Windows/System32/config/SOFTWARE
                              line: 247

[scrutinizer] f-3: classify     → allow
[scrutinizer] f-3: provenance   → allow (line 247 of 412 verified, "WindowsUpdater" present)
[scrutinizer] f-3: tool_match   → allow
[scrutinizer] f-3: cross_source → allow (corroborated by f-1 process running C:\Users\Public\update.exe)
[scrutinizer] f-3: confidence   → allow (score=0.91)
[investigator] ✓ accepted: f-3
```

**Narration:** *"This is the moment. The agent proposes a registry persistence finding citing line 8420 of a file that's only 412 lines long. That's a hallucination. The provenance stage rejects it before it can reach me. The agent sees the rejection, re-plans — note that it's reading the actual rejection reason — runs a different tool with stricter parameters, and emits a new finding citing a real line. That one passes. Self-correction in action, architecturally enforced."*

### 3:30 – 4:30 — Audit trail integrity

```
$ galaxy audit --verify --path audit.jsonl

{
  "timestamp": "2026-04-15T14:23:01.123Z",
  "kind": "dfir.finding",
  "decision": "block",
  "reason": "finding cites line 8420 but the file has only 412 lines",
  "stages": ["classify:allow", "provenance:block"],
  "prev_hash": "sha256:0000...",
  "hash": "sha256:c2d3..."
}
... (more entries)

Chain valid: 7 entries

$ # Now let's tamper with the log. Change "block" to "allow" in entry 3.
$ sed -i 's/"decision":"block"/"decision":"allow"/' audit.jsonl

$ galaxy audit --verify --path audit.jsonl
Chain BROKEN at entry 3
$ echo $?
1
```

**Narration:** *"Every finding and verdict goes into a SHA-256 hash-chained log. Modify any entry — try to make a hallucinated finding look accepted — and the chain breaks. Verifiable in one command. Court-admissible chain of custody."*

### 4:30 – 5:00 — Wrap against the rubric

**Narration:** *"To the six judging criteria. Autonomous Execution: the agent self-corrected without human intervention. IR Accuracy: the hallucination was caught and flagged, the real finding distinguished. Constraint Implementation: the verifier is a separate Go process running deterministic stages — architectural, not prompt-based. Audit Trail: every finding traces to a specific tool execution. Breadth and Depth: cross-source corroboration between disk and memory. Usability: single binary, drops into the SIFT Workstation, MIT licensed. Galaxy. Find evil — but verify."*

## Things to NOT do

- **No music.** No transitions. No animated logos. The judges explicitly said "not marketing videos."
- **No screen of you talking.** Just terminal + audio narration.
- **No lying.** If something fails on first take, fix it and re-record. Don't fake a clean run.
- **Don't go over 5 minutes.** Hard cap. Practice with a stopwatch.
