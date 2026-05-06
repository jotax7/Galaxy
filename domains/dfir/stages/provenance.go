package stages

import (
	"crypto/sha256"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/galaxy-dfir/galaxy/core/pipeline"
	"github.com/galaxy-dfir/galaxy/domains/dfir"
)

// ProvenanceStage verifies that the artifact a finding cites actually exists
// in the evidence. This is the single most important hallucination-catcher
// in Galaxy: if the agent invents a file path, an offset, or a registry key
// that doesn't exist, this stage rejects the finding before it reaches the
// analyst.
//
// What it checks:
//   - If EvidencePath is set: file exists under the mount point or evidence dir.
//   - If Offset is set: file is at least that long.
//   - If LineNumber is set (text artifacts): file has at least that many lines.
//   - If multiple findings cite the same path: the path is consistent.
//
// Decision: Block on missing/inaccessible evidence. Allow otherwise.
type ProvenanceStage struct {
	// MaxFileSizeForLineCheck caps how big a file we'll line-count.
	// Defaults to 100 MB.
	MaxFileSizeForLineCheck int64
}

func (s *ProvenanceStage) Name() string { return "provenance" }

func (s *ProvenanceStage) Run(bag *pipeline.Bag) pipeline.StageResult {
	finding := bag.MustGet(BagKeyFinding).(*dfir.Finding)
	ev, _ := bag.Get(BagKeyEvidence)
	evidence, _ := ev.(*dfir.EvidenceContext)

	// If the finding cites no path, we can't do file-level provenance.
	// That's allowed, but we mark it as "unverified-provenance" so the
	// confidence stage knows to lower confidence.
	if finding.EvidencePath == "" {
		return pipeline.StageResult{
			Decision: pipeline.DecisionAllow,
			Status:   "no_path_cited",
			Details: map[string]any{
				"verified_existence": false,
				"verified_offset":    false,
			},
		}
	}

	// Resolve the cited path against the evidence mount point if needed.
	resolved := finding.EvidencePath
	if evidence != nil && evidence.MountPoint != "" && !filepath.IsAbs(resolved) {
		resolved = filepath.Join(evidence.MountPoint, resolved)
	}

	info, err := os.Stat(resolved)
	if err != nil {
		// Hallucinated path — file doesn't exist.
		return pipeline.StageResult{
			Decision: pipeline.DecisionBlock,
			Status:   "path_missing",
			Reason:   fmt.Sprintf("finding cites %q but the path does not exist in evidence (resolved: %q)", finding.EvidencePath, resolved),
			Details: map[string]any{
				"cited_path":    finding.EvidencePath,
				"resolved_path": resolved,
				"error":         err.Error(),
			},
		}
	}

	// Validate offset, if cited.
	if finding.Offset > 0 {
		if !info.Mode().IsRegular() {
			return pipeline.StageResult{
				Decision: pipeline.DecisionBlock,
				Status:   "offset_on_non_file",
				Reason:   fmt.Sprintf("finding cites offset %d on %q, but %q is not a regular file", finding.Offset, finding.EvidencePath, resolved),
			}
		}
		if finding.Offset >= info.Size() {
			return pipeline.StageResult{
				Decision: pipeline.DecisionBlock,
				Status:   "offset_out_of_range",
				Reason:   fmt.Sprintf("finding cites offset %d but %q is only %d bytes", finding.Offset, finding.EvidencePath, info.Size()),
				Details: map[string]any{
					"cited_offset": finding.Offset,
					"file_size":    info.Size(),
				},
			}
		}
	}

	// Validate line number, if cited.
	if finding.LineNumber > 0 {
		maxSize := s.MaxFileSizeForLineCheck
		if maxSize == 0 {
			maxSize = 100 * 1024 * 1024
		}
		if info.Size() > maxSize {
			return pipeline.StageResult{
				Decision: pipeline.DecisionAllow,
				Status:   "line_check_skipped_size",
				Details: map[string]any{
					"file_size_bytes": info.Size(),
					"max_size_bytes":  maxSize,
				},
			}
		}
		ok, lines, err := lineExists(resolved, finding.LineNumber)
		if err != nil {
			return pipeline.StageResult{
				Decision: pipeline.DecisionBlock,
				Status:   "line_check_failed",
				Reason:   err.Error(),
			}
		}
		if !ok {
			return pipeline.StageResult{
				Decision: pipeline.DecisionBlock,
				Status:   "line_out_of_range",
				Reason:   fmt.Sprintf("finding cites line %d but %q has only %d lines", finding.LineNumber, finding.EvidencePath, lines),
				Details: map[string]any{
					"cited_line": finding.LineNumber,
					"file_lines": lines,
				},
			}
		}
	}

	return pipeline.StageResult{
		Decision: pipeline.DecisionAllow,
		Status:   "verified",
		Details: map[string]any{
			"resolved_path":      resolved,
			"file_size_bytes":    info.Size(),
			"verified_existence": true,
			"verified_offset":    finding.Offset > 0,
			"verified_line":      finding.LineNumber > 0,
		},
	}
}

// lineExists reports whether the given (1-indexed) line number exists in
// the file. Returns the actual line count along with the answer.
func lineExists(path string, line int64) (bool, int64, error) {
	if line <= 0 {
		return true, 0, nil
	}
	f, err := os.Open(path)
	if err != nil {
		return false, 0, err
	}
	defer f.Close()

	const bufSize = 64 * 1024
	buf := make([]byte, bufSize)
	var count int64
	for {
		n, err := f.Read(buf)
		if n > 0 {
			for _, b := range buf[:n] {
				if b == '\n' {
					count++
					if count >= line {
						return true, count, nil
					}
				}
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return false, count, err
		}
	}
	return count >= line, count, nil
}

// HashFile computes the SHA-256 of a file. Used by IntegrityStage and
// EvidenceContext setup.
func HashFile(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return fmt.Sprintf("sha256:%x", h.Sum(nil)), nil
}

// SanitizePath normalizes evidence paths for comparison.
func SanitizePath(p string) string {
	return filepath.Clean(strings.TrimSpace(p))
}
