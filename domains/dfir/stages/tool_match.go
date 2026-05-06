package stages

import (
	"fmt"
	"strings"

	"github.com/galaxy-dfir/galaxy/core/pipeline"
	"github.com/galaxy-dfir/galaxy/domains/dfir"
)

// BagKeyExecutions is the bag key for the list of tool executions seen
// during the current investigation. Populated by the investigator agent
// before running the scrutinizer.
const BagKeyExecutions = "dfir.tool_executions"

// ToolMatchStage verifies that the tool the finding cites:
//   1. Is a real SIFT/Volatility/Plaso tool (not invented).
//   2. Was actually executed during this investigation.
//   3. Produced output whose digest matches what the agent saw.
//
// Common hallucination this catches:
//   - Agent invents "vol3.py windows.evilfind" (no such plugin exists).
//   - Agent attributes a finding to a tool it never ran.
//   - Agent claims output that doesn't match the recorded output.
type ToolMatchStage struct {
	// AllowUnknownTools, if true, permits findings whose tool isn't in the
	// SIFTToolNames list. Useful for custom user tools but disables a
	// hallucination check, so off by default.
	AllowUnknownTools bool
}

func (s *ToolMatchStage) Name() string { return "tool_match" }

func (s *ToolMatchStage) Run(bag *pipeline.Bag) pipeline.StageResult {
	finding := bag.MustGet(BagKeyFinding).(*dfir.Finding)

	if finding.ToolExecution == nil {
		return pipeline.StageResult{
			Decision: pipeline.DecisionBlock,
			Status:   "no_tool_execution",
			Reason:   "finding has no ToolExecution reference; every finding must trace to a tool invocation",
		}
	}

	toolName := strings.TrimSpace(finding.ToolExecution.Tool)
	if toolName == "" {
		return pipeline.StageResult{
			Decision: pipeline.DecisionBlock,
			Status:   "empty_tool_name",
			Reason:   "ToolExecution.Tool is empty",
		}
	}

	// Check tool name against the known SIFT tool roster.
	if !s.AllowUnknownTools && !isKnownSIFTTool(toolName) {
		return pipeline.StageResult{
			Decision: pipeline.DecisionBlock,
			Status:   "unknown_tool",
			Reason:   fmt.Sprintf("tool %q is not a recognized SIFT/Volatility/Plaso tool — possible hallucination", toolName),
			Details: map[string]any{
				"cited_tool": toolName,
			},
		}
	}

	// Verify the cited execution exists in the recorded execution list.
	execs, _ := bag.Get(BagKeyExecutions)
	if execs == nil {
		// No executions recorded yet (first run). Allow but flag.
		return pipeline.StageResult{
			Decision: pipeline.DecisionAllow,
			Status:   "no_executions_recorded",
			Details: map[string]any{
				"cited_tool":   toolName,
				"execution_id": finding.ToolExecution.ExecutionID,
			},
		}
	}

	executions := execs.([]dfir.ToolExecutionRef)
	matched := findExecution(executions, finding.ToolExecution.ExecutionID)
	if matched == nil {
		return pipeline.StageResult{
			Decision: pipeline.DecisionBlock,
			Status:   "execution_not_found",
			Reason:   fmt.Sprintf("finding cites execution %q but no such execution was recorded", finding.ToolExecution.ExecutionID),
			Details: map[string]any{
				"cited_execution_id": finding.ToolExecution.ExecutionID,
				"recorded_count":     len(executions),
			},
		}
	}

	// Verify output digest matches.
	if finding.ToolExecution.OutputDigest != "" && matched.OutputDigest != "" &&
		finding.ToolExecution.OutputDigest != matched.OutputDigest {
		return pipeline.StageResult{
			Decision: pipeline.DecisionBlock,
			Status:   "output_digest_mismatch",
			Reason:   fmt.Sprintf("finding cites output digest %s but recorded execution has %s — agent may be referencing stale or fabricated output", finding.ToolExecution.OutputDigest, matched.OutputDigest),
			Details: map[string]any{
				"cited_digest":    finding.ToolExecution.OutputDigest,
				"recorded_digest": matched.OutputDigest,
			},
		}
	}

	// Verify tool name in execution matches the one cited.
	if !sameToolName(matched.Tool, toolName) {
		return pipeline.StageResult{
			Decision: pipeline.DecisionBlock,
			Status:   "tool_name_mismatch",
			Reason:   fmt.Sprintf("finding cites tool %q but execution %s was run with %q", toolName, matched.ExecutionID, matched.Tool),
		}
	}

	return pipeline.StageResult{
		Decision: pipeline.DecisionAllow,
		Status:   "verified",
		Details: map[string]any{
			"tool":         toolName,
			"execution_id": matched.ExecutionID,
			"output_bytes": matched.OutputBytes,
		},
	}
}

func isKnownSIFTTool(name string) bool {
	lower := strings.ToLower(name)
	for _, known := range dfir.SIFTToolNames {
		k := strings.ToLower(known)
		// Exact match or token-prefix match (e.g. "vol3.py windows.pslist"
		// should match "vol3.py" or "windows.pslist").
		if lower == k || strings.Contains(lower, k) {
			return true
		}
	}
	return false
}

func sameToolName(a, b string) bool {
	// Compare loosely — agents sometimes drop or add the python interpreter
	// prefix, paths, etc. We require the basename to match.
	return baseTool(a) == baseTool(b)
}

func baseTool(t string) string {
	t = strings.ToLower(strings.TrimSpace(t))
	// Strip leading "python ", "python3 ", "/usr/bin/", etc.
	for _, prefix := range []string{"python3 ", "python ", "/usr/bin/", "/usr/local/bin/"} {
		t = strings.TrimPrefix(t, prefix)
	}
	// Take the first whitespace-separated token (the program name).
	if i := strings.IndexAny(t, " \t"); i > 0 {
		return t[:i]
	}
	return t
}

func findExecution(execs []dfir.ToolExecutionRef, id string) *dfir.ToolExecutionRef {
	for i := range execs {
		if execs[i].ExecutionID == id {
			return &execs[i]
		}
	}
	return nil
}
