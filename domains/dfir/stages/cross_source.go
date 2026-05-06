package stages

import (
	"fmt"
	"strings"

	"github.com/galaxy-dfir/galaxy/core/pipeline"
	"github.com/galaxy-dfir/galaxy/domains/dfir"
)

// BagKeyAllFindings is the list of all findings in the current case (not
// just the one being scrutinized). Used by cross-source consistency to
// compare disk vs memory vs logs claims about the same artifact.
const BagKeyAllFindings = "dfir.all_findings"

// CrossSourceStage checks consistency between findings drawn from different
// evidence sources. The DFIR principle: an attacker leaves traces in
// multiple places. If the disk says a process ran but memory shows no trace,
// or memory shows a process that disk has no execution evidence for, that's
// either an interesting forensic observation or a hallucination — and the
// agent should distinguish.
//
// Decisions:
//   - Allow: the finding is corroborated by another source, or the absence
//     of corroboration is consistent (e.g. memory-only finding with no disk
//     persistence is plausible).
//   - Rerun: contradictory finding from another source — the agent should
//     re-run with cross-source tools to resolve.
//   - Block: the finding makes a claim that is provably contradicted by
//     another finding (e.g. claims process X was running, but a recorded
//     pslist execution shows it was not).
type CrossSourceStage struct {
	// RerunOnContradiction, if true, returns Rerun rather than Block when
	// a contradiction is detected. Useful early in development when the
	// agent should iterate; production may prefer Block.
	RerunOnContradiction bool
}

func (s *CrossSourceStage) Name() string { return "cross_source" }

func (s *CrossSourceStage) Run(bag *pipeline.Bag) pipeline.StageResult {
	finding := bag.MustGet(BagKeyFinding).(*dfir.Finding)
	allRaw, ok := bag.Get(BagKeyAllFindings)
	if !ok {
		// No comparison set available; nothing to do.
		return pipeline.StageResult{
			Decision: pipeline.DecisionAllow,
			Status:   "no_peers",
		}
	}
	all := allRaw.([]*dfir.Finding)

	// Group peer findings by what they claim.
	related := relatedFindings(finding, all)

	if len(related) == 0 {
		// No peers to corroborate or contradict. Allow but flag.
		return pipeline.StageResult{
			Decision: pipeline.DecisionAllow,
			Status:   "uncorroborated",
			Details: map[string]any{
				"corroborated": false,
				"peers":        0,
			},
		}
	}

	corroborating, contradicting := splitByAgreement(finding, related)

	if len(contradicting) > 0 {
		decision := pipeline.DecisionBlock
		status := "contradicted"
		if s.RerunOnContradiction {
			decision = pipeline.DecisionRerun
			status = "contradicted_rerun"
		}
		return pipeline.StageResult{
			Decision: decision,
			Status:   status,
			Reason:   fmt.Sprintf("finding contradicts %d peer finding(s) from other evidence sources: %s", len(contradicting), summarizePeers(contradicting)),
			Details: map[string]any{
				"contradicting_ids": idsOf(contradicting),
				"corroborating_ids": idsOf(corroborating),
			},
		}
	}

	return pipeline.StageResult{
		Decision: pipeline.DecisionAllow,
		Status:   "corroborated",
		Details: map[string]any{
			"corroborated":      true,
			"corroborating_ids": idsOf(corroborating),
			"peer_count":        len(related),
		},
	}
}

// relatedFindings finds peers that talk about the same underlying entity
// (process, file, registry key, network connection) as the target.
func relatedFindings(target *dfir.Finding, all []*dfir.Finding) []*dfir.Finding {
	var out []*dfir.Finding
	targetKey := entityKey(target)
	if targetKey == "" {
		return nil
	}
	for _, f := range all {
		if f.ID == target.ID {
			continue
		}
		if entityKey(f) == targetKey {
			out = append(out, f)
		}
	}
	return out
}

// entityKey extracts a coarse identifier of what entity a finding is about.
// Two findings with the same key are about the same thing (one process,
// one file path, etc.) and should agree.
func entityKey(f *dfir.Finding) string {
	if f.EvidencePath != "" {
		return "path:" + strings.ToLower(SanitizePath(f.EvidencePath))
	}
	// Try to extract a process name or PID from the title.
	title := strings.ToLower(f.Title)
	if idx := strings.Index(title, "pid "); idx >= 0 {
		rest := title[idx+4:]
		if end := strings.IndexAny(rest, " ,;:"); end > 0 {
			return "pid:" + rest[:end]
		}
		return "pid:" + rest
	}
	return ""
}

// splitByAgreement separates peers into those that agree with target and
// those that contradict. "Agreement" is heuristic: same artifact type and
// non-conflicting severity claims is agreement; opposite presence claims
// (e.g. one says "process running", another from pslist execution implies
// "process not in list") is contradiction.
func splitByAgreement(target *dfir.Finding, peers []*dfir.Finding) (agree, disagree []*dfir.Finding) {
	for _, p := range peers {
		if contradicts(target, p) {
			disagree = append(disagree, p)
		} else {
			agree = append(agree, p)
		}
	}
	return
}

func contradicts(a, b *dfir.Finding) bool {
	// Different sources for the same entity often agree, but if both sources
	// describe presence/absence opposingly, that's a contradiction.
	// We use a simple keyword heuristic: presence words vs absence words in
	// title/description.
	aPresent := mentionsPresence(a)
	bPresent := mentionsPresence(b)
	aAbsent := mentionsAbsence(a)
	bAbsent := mentionsAbsence(b)
	if (aPresent && bAbsent) || (aAbsent && bPresent) {
		return true
	}
	return false
}

var presenceWords = []string{"running", "active", "present", "found", "detected", "loaded", "executed"}
var absenceWords = []string{"not running", "not present", "missing", "deleted", "removed", "absent", "no trace"}

func mentionsPresence(f *dfir.Finding) bool {
	t := strings.ToLower(f.Title + " " + f.Description)
	for _, w := range presenceWords {
		if strings.Contains(t, w) {
			return true
		}
	}
	return false
}

func mentionsAbsence(f *dfir.Finding) bool {
	t := strings.ToLower(f.Title + " " + f.Description)
	for _, w := range absenceWords {
		if strings.Contains(t, w) {
			return true
		}
	}
	return false
}

func idsOf(findings []*dfir.Finding) []string {
	out := make([]string, len(findings))
	for i, f := range findings {
		out[i] = f.ID
	}
	return out
}

func summarizePeers(findings []*dfir.Finding) string {
	parts := make([]string, 0, len(findings))
	for _, f := range findings {
		parts = append(parts, fmt.Sprintf("%s(%s/%s)", f.ID, f.Source, f.Artifact))
	}
	return strings.Join(parts, ", ")
}
