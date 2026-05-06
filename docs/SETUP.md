# Galaxy — Setup & First Run

This guide takes you from a fresh clone to a working `galaxy demo` in 10 minutes.

## Prerequisites

- **Go 1.21+** — `go version`
- **Node 20+** and npm — `node --version`
- **SIFT Workstation** (for real investigations) — [download from SANS](https://www.sans.org/tools/sift-workstation)
- **Protocol SIFT** (installed inside SIFT) — `curl -fsSL https://raw.githubusercontent.com/teamdfir/protocol-sift/main/install.sh | bash`

For the first day of dev you don't need SIFT or Protocol SIFT — the Go scrutinizer runs against fixtures.

## Day 1 — Get the scrutinizer running locally

```bash
# 1. Clone
git clone <YOUR_REPO_URL> galaxy
cd galaxy

# 2. Build
go mod tidy
make build

# 3. Run the canned demo
./galaxy demo
```

You should see three findings scrutinized:
1. A clean finding → ALLOW
2. A finding with a hallucinated path → BLOCK
3. A finding citing an invented tool name → BLOCK

If that works, the core verifier pipeline is alive.

## Day 1 — Run scrutinize on the fixture

```bash
./galaxy scrutinize domains/dfir/fixtures/hallucinated_finding.json
```

Expected output:
```json
{
  "finding_id": "f-demo-hallucination",
  "decision": "block",
  "reason": "finding cites line 8420 but the path does not exist...",
  "verifier_confidence": 0.0,
  "stages": ["classify:allow", "provenance:block"]
}
```

This is the demo's "money shot" reproduced offline.

## Day 1 — Audit log

```bash
# Append a verdict to the audit log
./galaxy scrutinize domains/dfir/fixtures/hallucinated_finding.json --audit ./audit.jsonl

# View it
./galaxy audit --path ./audit.jsonl

# Verify integrity
./galaxy audit --path ./audit.jsonl --verify
```

Try modifying any field of an entry inside `audit.jsonl` with a text editor and re-run `--verify`. The chain breaks at the first modified entry.

## Day 2 — Bring up SIFT

1. Download the SIFT OVA (~10 GB) from SANS.
2. Import into VirtualBox or VMware.
3. Boot, login (default creds documented by SANS).
4. Inside SIFT: `curl -fsSL https://raw.githubusercontent.com/teamdfir/protocol-sift/main/install.sh | bash`
5. Download the FIND EVIL starter datasets from the Egnyte link in the brief.

## Day 2 — Install Galaxy on SIFT

Inside the SIFT VM:

```bash
git clone <YOUR_REPO_URL> ~/galaxy
cd ~/galaxy
bash install.sh
```

## Day 3+ — Wire up the investigator

The TypeScript investigator agent (`agents/investigator/investigator.ts`) is a skeleton. You need to:

1. Add an Anthropic API key (`export ANTHROPIC_API_KEY=...`).
2. Replace the `proposeFinding` stub with a real Claude Agent SDK call that:
   - Loads the system prompt from `domains/dfir/prompts/investigator.md`.
   - Exposes Protocol SIFT MCP tools to the agent.
   - Parses returned tool_use blocks into Finding structs.
3. Wire `scrutinize()` to invoke the Go binary and parse its JSON output.

The skeleton already shows the loop structure. Fill in the LLM call.

## Recommended dev order

| Day | Goal |
|-----|------|
| 1   | Skeleton compiles. Demo runs. Tests pass. |
| 2   | SIFT + Protocol SIFT working. Galaxy installed inside SIFT. |
| 3   | Investigator agent runs Protocol SIFT and emits 1 real finding. |
| 4   | First real hallucination caught. Document it. |
| 5   | Cross-source consistency checks against memory + disk. |
| 6+  | Iterate: more cases, accuracy report, video, README polish. |

## Useful commands

```bash
make build         # build the galaxy binary
make test          # go test ./...
make frontend      # build the dashboard
make clean         # nuke build artifacts

go test ./core/audit/...                        # just audit tests
go test ./domains/dfir/stages/... -v            # stage tests verbose
```
