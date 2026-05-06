package stages

import (
	"strings"

	"github.com/galaxy-dfir/galaxy/core/classify"
	"github.com/galaxy-dfir/galaxy/core/pipeline"
	"github.com/galaxy-dfir/galaxy/domains/dfir"
)

// BagKeyFinding is the pipeline.Bag key under which the current finding lives.
const BagKeyFinding = "dfir.finding"

// BagKeyEvidence is the pipeline.Bag key for the EvidenceContext.
const BagKeyEvidence = "dfir.evidence_context"

// BagKeyEnrichedTTPs is set by the classify stage and read by later stages
// that want to know the auto-derived MITRE TTPs.
const BagKeyEnrichedTTPs = "dfir.enriched_ttps"

// ClassifyStage normalizes a Finding's artifact_type, severity, and MITRE
// TTPs based on its title/description. If the agent left these fields blank
// or generic ("unknown"), this stage attempts to derive them from keywords.
//
// Decision: always Allow (this stage cannot fail). Its job is to enrich,
// not to gate.
type ClassifyStage struct{}

func (s *ClassifyStage) Name() string { return "classify" }

func (s *ClassifyStage) Run(bag *pipeline.Bag) pipeline.StageResult {
	f, ok := bag.Get(BagKeyFinding)
	if !ok {
		return pipeline.StageResult{
			Decision: pipeline.DecisionBlock,
			Status:   "no_finding",
			Reason:   "internal: classify stage received no finding",
		}
	}
	finding := f.(*dfir.Finding)

	text := strings.ToLower(finding.Title + " " + finding.Description)
	words := classify.Tokenize(text)

	// 1. Infer ArtifactType if unknown.
	if finding.Artifact == "" || finding.Artifact == dfir.ArtifactUnknown {
		finding.Artifact = inferArtifact(text, words)
	}

	// 2. Auto-populate MITRE TTPs from keyword phrases.
	if len(finding.MitreTTPs) == 0 {
		var ttps []string
		for phrase, ids := range dfir.MITREKeywordsToTTP {
			if strings.Contains(text, phrase) {
				ttps = classify.AppendUnique(ttps, ids...)
			}
		}
		finding.MitreTTPs = ttps
		bag.Set(BagKeyEnrichedTTPs, ttps)
	}

	// 3. Suspicious-indicator boost: if the finding mentions known IOCs,
	//    bump severity floor to Medium (don't lower an already-higher value).
	hasIOC := false
	for _, kw := range dfir.SuspiciousIndicatorKeywords {
		if strings.Contains(text, kw) {
			hasIOC = true
			break
		}
	}
	if hasIOC && severityRank(finding.Severity) < severityRank(dfir.SeverityMedium) {
		finding.Severity = dfir.SeverityMedium
	}
	if finding.Severity == "" {
		finding.Severity = dfir.SeverityInformational
	}

	return pipeline.StageResult{
		Decision: pipeline.DecisionAllow,
		Status:   "classified:" + string(finding.Artifact) + "/" + string(finding.Severity),
		Details: map[string]any{
			"artifact":  finding.Artifact,
			"severity":  finding.Severity,
			"mitre":     finding.MitreTTPs,
			"ioc_match": hasIOC,
		},
	}
}

func inferArtifact(text string, words []string) dfir.ArtifactType {
	for artifact, keywords := range dfir.ArtifactKeywords {
		if hits := classify.MatchWords(words, keywords); len(hits) > 0 {
			return artifact
		}
		if hits := classify.MatchPhrases(text, keywords); len(hits) > 0 {
			return artifact
		}
	}
	return dfir.ArtifactUnknown
}

func severityRank(s dfir.Severity) int {
	switch s {
	case dfir.SeverityCritical:
		return 4
	case dfir.SeverityHigh:
		return 3
	case dfir.SeverityMedium:
		return 2
	case dfir.SeverityLow:
		return 1
	default:
		return 0
	}
}
