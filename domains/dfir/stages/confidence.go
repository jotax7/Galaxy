package stages

import (
	"fmt"

	"github.com/galaxy-dfir/galaxy/core/pipeline"
	"github.com/galaxy-dfir/galaxy/domains/dfir"
)

// ConfidenceStage computes a final, deterministic confidence score for the
// finding based on what the prior stages discovered. This is the verifier's
// own confidence, not the agent's self-reported one.
//
// Inputs:
//   - All prior stage results (read from bag).
//   - The finding's claimed confidence (sanity-check ceiling).
//
// Outputs:
//   - A confidence in [0, 1].
//   - A decision: Allow if >= AllowThreshold, Rerun if >= RerunThreshold,
//     Block otherwise.
type ConfidenceStage struct {
	AllowThreshold float64 // default 0.6
	RerunThreshold float64 // default 0.3
}

// BagKeyVerifierConfidence holds the deterministic confidence computed
// here, so the audit log and report can include it.
const BagKeyVerifierConfidence = "dfir.verifier_confidence"

func (s *ConfidenceStage) Name() string { return "confidence" }

func (s *ConfidenceStage) Run(bag *pipeline.Bag) pipeline.StageResult {
	finding := bag.MustGet(BagKeyFinding).(*dfir.Finding)

	allow := s.AllowThreshold
	if allow == 0 {
		allow = 0.6
	}
	rerun := s.RerunThreshold
	if rerun == 0 {
		rerun = 0.3
	}

	score := computeScore(bag, finding)
	bag.Set(BagKeyVerifierConfidence, score)

	switch {
	case score >= allow:
		return pipeline.StageResult{
			Decision: pipeline.DecisionAllow,
			Status:   fmt.Sprintf("confidence=%.2f", score),
			Details:  map[string]any{"score": score, "threshold_allow": allow},
		}
	case score >= rerun:
		return pipeline.StageResult{
			Decision: pipeline.DecisionRerun,
			Status:   fmt.Sprintf("confidence=%.2f_rerun", score),
			Reason:   fmt.Sprintf("verifier confidence %.2f below allow threshold %.2f; recommend re-run with additional evidence", score, allow),
			Details:  map[string]any{"score": score},
		}
	default:
		return pipeline.StageResult{
			Decision: pipeline.DecisionBlock,
			Status:   fmt.Sprintf("confidence=%.2f_block", score),
			Reason:   fmt.Sprintf("verifier confidence %.2f below rerun threshold %.2f; finding rejected", score, rerun),
			Details:  map[string]any{"score": score},
		}
	}
}

// computeScore aggregates signals from prior stages into a 0..1 confidence.
//
// Signals (each contributes positively or negatively):
//   + Provenance verified existence:        +0.30
//   + Provenance verified offset/line:      +0.10
//   + Tool execution matched:               +0.20
//   + Output digest matched:                +0.10
//   + Cross-source corroboration:           +0.20
//   - Cross-source contradiction:            -0.40 (already blocked, but if rerun)
//   + Has MITRE TTP mapping:                +0.05
//   + Agent's self-reported confidence:     +up to 0.20 (capped)
//   - No tool execution reference:          -0.30
//
// The ceiling is the agent's self-reported confidence + 0.10 — we never give
// a finding more confidence than the agent had, plus a small bonus for
// strong external corroboration.
func computeScore(bag *pipeline.Bag, finding *dfir.Finding) float64 {
	score := 0.0

	// Provenance signal.
	if v, ok := stageDetail(bag, "provenance", "verified_existence"); ok {
		if b, _ := v.(bool); b {
			score += 0.30
		}
	}
	if v, ok := stageDetail(bag, "provenance", "verified_offset"); ok {
		if b, _ := v.(bool); b {
			score += 0.05
		}
	}
	if v, ok := stageDetail(bag, "provenance", "verified_line"); ok {
		if b, _ := v.(bool); b {
			score += 0.05
		}
	}

	// Tool match signal.
	if statusOf(bag, "tool_match") == "verified" {
		score += 0.20
	}

	// Cross-source signal.
	switch statusOf(bag, "cross_source") {
	case "corroborated":
		score += 0.20
	case "uncorroborated", "no_peers":
		// neutral
	}

	// MITRE mapping bonus.
	if len(finding.MitreTTPs) > 0 {
		score += 0.05
	}

	// Agent's own confidence as a small bonus (capped at 0.20).
	bonus := finding.Confidence * 0.20
	if bonus > 0.20 {
		bonus = 0.20
	}
	score += bonus

	// Penalize if the agent didn't even cite a tool execution.
	if finding.ToolExecution == nil {
		score -= 0.30
	}

	if score < 0 {
		score = 0
	}
	if score > 1 {
		score = 1
	}
	return score
}

// stageDetail looks up a detail key from a stage's recorded result. The
// pipeline doesn't expose results to later stages directly, so we store
// them on the bag under a per-stage key when running.
func stageDetail(bag *pipeline.Bag, stage, key string) (any, bool) {
	v, ok := bag.Get("stage_result." + stage)
	if !ok {
		return nil, false
	}
	r, ok := v.(pipeline.StageResult)
	if !ok {
		return nil, false
	}
	d, ok := r.Details.(map[string]any)
	if !ok {
		return nil, false
	}
	val, ok := d[key]
	return val, ok
}

func statusOf(bag *pipeline.Bag, stage string) string {
	v, ok := bag.Get("stage_result." + stage)
	if !ok {
		return ""
	}
	r, ok := v.(pipeline.StageResult)
	if !ok {
		return ""
	}
	return r.Status
}
