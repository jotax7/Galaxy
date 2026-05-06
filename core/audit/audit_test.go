package audit

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestChainContinuity(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "audit.jsonl")

	al, err := New(path)
	if err != nil {
		t.Fatalf("New: %v", err)
	}

	for i := 0; i < 3; i++ {
		if err := al.Log(AuditEntry{
			SessionID: "s1",
			Kind:      "test",
			Decision:  "allow",
			Stages:    []string{"a:allow"},
		}); err != nil {
			t.Fatalf("Log %d: %v", i, err)
		}
	}

	entries, err := ReadEntries(path)
	if err != nil {
		t.Fatalf("ReadEntries: %v", err)
	}
	if len(entries) != 3 {
		t.Fatalf("expected 3 entries, got %d", len(entries))
	}

	if idx := VerifyChain(entries); idx >= 0 {
		t.Fatalf("chain invalid at %d: %+v", idx, entries[idx])
	}
}

func TestChainTamperDetection(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "audit.jsonl")

	al, _ := New(path)
	for i := 0; i < 3; i++ {
		_ = al.Log(AuditEntry{SessionID: "s1", Kind: "test", Decision: "allow"})
	}

	// Read, tamper with the second entry's decision, write back.
	entries, _ := ReadEntries(path)
	entries[1].Decision = "block" // tamper

	out, _ := os.Create(path)
	for _, e := range entries {
		data, _ := json.Marshal(e)
		out.Write(append(data, '\n'))
	}
	out.Close()

	tampered, _ := ReadEntries(path)
	idx := VerifyChain(tampered)
	if idx != 1 {
		t.Fatalf("expected break at index 1, got %d", idx)
	}
}

func TestResumesFromExistingChain(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "audit.jsonl")

	al1, _ := New(path)
	_ = al1.Log(AuditEntry{SessionID: "s1", Kind: "test", Decision: "allow"})

	// Re-open and append more; chain should remain valid.
	al2, err := New(path)
	if err != nil {
		t.Fatalf("reopen: %v", err)
	}
	_ = al2.Log(AuditEntry{SessionID: "s1", Kind: "test", Decision: "block"})

	entries, _ := ReadEntries(path)
	if len(entries) != 2 {
		t.Fatalf("expected 2 entries, got %d", len(entries))
	}
	if idx := VerifyChain(entries); idx >= 0 {
		t.Fatalf("chain invalid at %d", idx)
	}
}
