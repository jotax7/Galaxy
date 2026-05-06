package stages

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/galaxy-dfir/galaxy/core/pipeline"
	"github.com/galaxy-dfir/galaxy/domains/dfir"
)

func runStage(t *testing.T, stage pipeline.Stage, finding *dfir.Finding, evidence *dfir.EvidenceContext) pipeline.StageResult {
	t.Helper()
	bag := pipeline.NewBag()
	bag.Set(BagKeyFinding, finding)
	bag.Set(BagKeyEvidence, evidence)
	return stage.Run(bag)
}

func TestProvenance_PathExists(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "evidence.bin")
	os.WriteFile(path, []byte("0123456789"), 0644)

	finding := &dfir.Finding{
		ID:           "f-1",
		EvidencePath: path,
	}
	r := runStage(t, &ProvenanceStage{}, finding, &dfir.EvidenceContext{})
	if r.Decision != pipeline.DecisionAllow {
		t.Fatalf("expected allow for existing path, got %s: %s", r.Decision, r.Reason)
	}
}

func TestProvenance_PathMissing(t *testing.T) {
	finding := &dfir.Finding{
		ID:           "f-2",
		EvidencePath: "/this/path/does/not/exist",
	}
	r := runStage(t, &ProvenanceStage{}, finding, &dfir.EvidenceContext{})
	if r.Decision != pipeline.DecisionBlock {
		t.Fatalf("expected block for missing path, got %s", r.Decision)
	}
	if r.Status != "path_missing" {
		t.Fatalf("expected path_missing status, got %s", r.Status)
	}
}

func TestProvenance_OffsetOutOfRange(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "small.bin")
	os.WriteFile(path, []byte("abc"), 0644)

	finding := &dfir.Finding{
		ID:           "f-3",
		EvidencePath: path,
		Offset:       9999,
	}
	r := runStage(t, &ProvenanceStage{}, finding, &dfir.EvidenceContext{})
	if r.Decision != pipeline.DecisionBlock {
		t.Fatalf("expected block for out-of-range offset, got %s", r.Decision)
	}
}

func TestProvenance_LineOutOfRange(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "short.txt")
	os.WriteFile(path, []byte("a\nb\nc\n"), 0644)

	finding := &dfir.Finding{
		ID:           "f-4",
		EvidencePath: path,
		LineNumber:   100,
	}
	r := runStage(t, &ProvenanceStage{}, finding, &dfir.EvidenceContext{})
	if r.Decision != pipeline.DecisionBlock {
		t.Fatalf("expected block for out-of-range line, got %s", r.Decision)
	}
}

func TestProvenance_LineWithinRange(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "ok.txt")
	os.WriteFile(path, []byte("a\nb\nc\nd\n"), 0644)

	finding := &dfir.Finding{
		ID:           "f-5",
		EvidencePath: path,
		LineNumber:   3,
	}
	r := runStage(t, &ProvenanceStage{}, finding, &dfir.EvidenceContext{})
	if r.Decision != pipeline.DecisionAllow {
		t.Fatalf("expected allow for valid line, got %s: %s", r.Decision, r.Reason)
	}
}

func TestProvenance_NoPathCited(t *testing.T) {
	finding := &dfir.Finding{ID: "f-6"}
	r := runStage(t, &ProvenanceStage{}, finding, &dfir.EvidenceContext{})
	if r.Decision != pipeline.DecisionAllow {
		t.Fatalf("expected allow when no path cited, got %s", r.Decision)
	}
	if r.Status != "no_path_cited" {
		t.Fatalf("expected no_path_cited, got %s", r.Status)
	}
}
