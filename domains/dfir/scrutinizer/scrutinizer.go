// Package scrutinizer wires the five DFIR stages into a runnable pipeline.
// Lives in its own package to avoid an import cycle: stages depend on dfir
// types, and the scrutinizer depends on both.
package scrutinizer

import (
	"github.com/galaxy-dfir/galaxy/core/pipeline"
	"github.com/galaxy-dfir/galaxy/domains/dfir"
	"github.com/galaxy-dfir/galaxy/domains/dfir/stages"
)

// Scrutinizer runs the five-stage DFIR scrutiny pipeline against a single
// finding. This is the heart of Galaxy: every finding the investigator
// agent proposes must pass here before reaching the analyst report.
type Scrutinizer struct {
	Stages []pipeline.Stage
}

// NewScrutinizer builds the default 5-stage pipeline.
func NewScrutinizer() *Scrutinizer {
	return &Scrutinizer{
		Stages: []pipeline.Stage{
			&stages.ClassifyStage{},
			&stages.ProvenanceStage{},
			&stages.ToolMatchStage{},
			&stages.CrossSourceStage{RerunOnContradiction: true},
			&stages.ConfidenceStage{},
		},
	}
}

// Scrutinize runs the pipeline against a finding. The caller supplies the
// EvidenceContext, the list of all findings (for cross-source), and the
// recorded tool executions. Returns a Verdict.
func (s *Scrutinizer) Scrutinize(
	finding *dfir.Finding,
	evidence *dfir.EvidenceContext,
	allFindings []*dfir.Finding,
	executions []dfir.ToolExecutionRef,
) dfir.Verdict {
	bag := pipeline.NewBag()
	bag.Set(stages.BagKeyFinding, finding)
	bag.Set(stages.BagKeyEvidence, evidence)
	bag.Set(stages.BagKeyAllFindings, allFindings)
	bag.Set(stages.BagKeyExecutions, executions)

	results := runWithBagPersistence(bag, s.Stages)

	confidence := 0.0
	if v, ok := bag.Get(stages.BagKeyVerifierConfidence); ok {
		confidence, _ = v.(float64)
	}

	return dfir.Verdict{
		FindingID:  finding.ID,
		Decision:   string(pipeline.FinalDecision(results)),
		Reason:     compileReasons(results),
		Confidence: confidence,
		Stages:     pipeline.StageNames(results),
	}
}

// runWithBagPersistence runs stages in order, but also stores each stage's
// result on the bag so later stages (especially Confidence) can read prior
// stage details. This is a small extension of pipeline.Run.
func runWithBagPersistence(bag *pipeline.Bag, stageList []pipeline.Stage) []pipeline.StageResult {
	results := make([]pipeline.StageResult, 0, len(stageList))
	for _, s := range stageList {
		r := s.Run(bag)
		r.Name = s.Name()
		bag.Set("stage_result."+r.Name, r)
		results = append(results, r)
		if r.Decision == pipeline.DecisionBlock {
			break
		}
		// On Rerun, we still let later stages run because Confidence
		// might escalate to Block or de-escalate to Allow based on aggregate.
		// (Pipeline-wise this differs from PayGuard's hard-stop; intentional.)
	}
	return results
}

func compileReasons(results []pipeline.StageResult) string {
	for _, r := range results {
		if r.Decision != pipeline.DecisionAllow && r.Reason != "" {
			return r.Reason
		}
	}
	return ""
}
