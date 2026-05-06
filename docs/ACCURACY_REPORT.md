# Galaxy Accuracy Report

> **Status: stub. To be populated with real numbers from benchmarking against
> the FIND EVIL starter datasets and additional cases.**
>
> This file is a required submission artifact; honest results matter more
> than impressive ones. The brief itself says: "Honesty valued over perfection."

## Methodology

We compared Galaxy against baseline Protocol SIFT on the same evidence:

- **N cases tested:** TBD (target: 5 cases minimum, mix of disk + memory).
- **Source of evidence:** FIND EVIL starter datasets + 2 additional public cases.
- **Ground truth source:** human analyst review (we documented the expected findings before running either system).

For each case we recorded:

- Total findings emitted.
- True positives (findings that match ground truth).
- False positives (findings of plausible-looking events that didn't actually happen).
- Hallucinated findings (cite artifacts, paths, or tool outputs that don't exist).
- Missed findings (true events neither system reported).

## Headline numbers (to be filled in)

|                              | Protocol SIFT (baseline) | Galaxy |
|------------------------------|:------------------------:|:------:|
| Total findings emitted       | TBD                      | TBD    |
| True positives               | TBD                      | TBD    |
| False positives              | TBD                      | TBD    |
| **Hallucinated findings**    | **TBD**                  | **TBD**|
| Missed findings              | TBD                      | TBD    |
| Hallucination catch rate     | n/a                      | TBD %  |

Galaxy's job is reducing the hallucination row. Its self-correction loop should
dramatically lower the count vs baseline, while the missed-findings row should
not significantly worsen.

## Per-stage hallucination catches (to be filled in)

Of the hallucinated findings Galaxy caught, which stage caught them?

| Stage               | Catches | Example |
|---------------------|:-------:|---------|
| Classify            | TBD     | TBD     |
| Provenance          | TBD     | TBD     |
| Tool match          | TBD     | TBD     |
| Cross-source        | TBD     | TBD     |
| Confidence          | TBD     | TBD     |

## Failure modes we observed

This section will document where Galaxy fell short. Examples we expect:

- **Plausible-but-wrong findings that cite real artifacts.** The provenance
  stage verifies the artifact exists, not that the agent's interpretation of
  it is correct. We expect a residual hallucination rate from this class.
- **Rerun loops.** Some findings get marked Rerun by Confidence stage and
  the agent re-runs but the new finding hits the same issue. We document
  how often this happens vs converges.
- **Tool execution log size limits.** Very large tool outputs (e.g. full
  Plaso timelines) blow context windows; the agent samples them, and
  occasionally cites a portion of the output that wasn't in its sample.

## Evidence integrity testing

(Documented separately in [`EVIDENCE_INTEGRITY.md`](EVIDENCE_INTEGRITY.md).)

- All starting hashes recorded.
- All ending hashes recompared.
- 0 spoliation events expected (architectural read-only enforcement).

## Reproducibility

The full output of every test run is preserved in `datasets/runs/<case-id>/`.
Each run includes:

- `findings.json` — every finding, accepted or rejected.
- `audit.jsonl` — full audit chain.
- `tool-executions/` — every SIFT tool's stdout/stderr.
- `verdict-summary.txt` — per-finding stage results.

To reproduce: `make reproduce CASE=<case-id>`.
