// Package audit provides a tamper-evident JSONL audit log with a SHA-256
// hash chain. Each entry's hash includes the previous entry's hash, so any
// modification of a past entry invalidates the chain from that point forward.
//
// This package is domain-agnostic: AuditEntry carries a generic Payload field
// that callers fill with their own data structure. For DFIR (Galaxy's primary
// domain) the payload is a finding+verdict; for other domains it could be a
// payment, a policy decision, or anything else worth proving.
package audit

import (
	"bufio"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"os"
	"time"
)

// AuditEntry records a single decision in the chain. The Payload field
// is opaque to this package and may be any JSON-serializable value.
type AuditEntry struct {
	Timestamp string          `json:"timestamp"`
	SessionID string          `json:"session_id"`
	Kind      string          `json:"kind"`           // domain identifier, e.g. "dfir.finding"
	Decision  string          `json:"decision"`       // "allow" | "rerun" | "block"
	Reason    string          `json:"reason,omitempty"`
	Stages    []string        `json:"pipeline_stages"`
	Payload   json.RawMessage `json:"payload,omitempty"` // domain-specific data
	PrevHash  string          `json:"prev_hash"`
	Hash      string          `json:"hash"`
}

// AuditLog appends entries to a JSONL file, maintaining the SHA-256 chain.
type AuditLog struct {
	path     string
	prevHash string
}

const GenesisHash = "sha256:0000000000000000000000000000000000000000000000000000000000000000"

// New opens or creates an audit log. It reads the last entry's hash to
// continue the chain. Concurrent writers must serialize externally
// (e.g. via state.FileLock).
func New(path string) (*AuditLog, error) {
	al := &AuditLog{path: path, prevHash: GenesisHash}

	f, err := os.Open(path)
	if err != nil {
		if os.IsNotExist(err) {
			return al, nil
		}
		return nil, fmt.Errorf("open audit log: %w", err)
	}
	defer f.Close()

	var lastLine string
	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 1024*1024), 1024*1024)
	for scanner.Scan() {
		lastLine = scanner.Text()
	}
	if lastLine != "" {
		var entry AuditEntry
		if err := json.Unmarshal([]byte(lastLine), &entry); err == nil && entry.Hash != "" {
			al.prevHash = entry.Hash
		}
	}
	return al, nil
}

// Log appends an entry, automatically setting Timestamp, PrevHash and Hash.
func (al *AuditLog) Log(entry AuditEntry) error {
	entry.Timestamp = time.Now().UTC().Format(time.RFC3339Nano)
	entry.PrevHash = al.prevHash
	entry.Hash = computeHash(entry)
	al.prevHash = entry.Hash

	data, err := json.Marshal(entry)
	if err != nil {
		return fmt.Errorf("marshal audit entry: %w", err)
	}

	f, err := os.OpenFile(al.path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
	if err != nil {
		return fmt.Errorf("open audit log for write: %w", err)
	}
	defer f.Close()

	if _, err := f.Write(append(data, '\n')); err != nil {
		return fmt.Errorf("write audit entry: %w", err)
	}
	return nil
}

// ReadEntries reads all entries from a log file in order.
func ReadEntries(path string) ([]AuditEntry, error) {
	f, err := os.Open(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, fmt.Errorf("open audit log: %w", err)
	}
	defer f.Close()

	var entries []AuditEntry
	scanner := bufio.NewScanner(f)
	scanner.Buffer(make([]byte, 1024*1024), 1024*1024)
	for scanner.Scan() {
		var e AuditEntry
		if err := json.Unmarshal(scanner.Bytes(), &e); err != nil {
			continue
		}
		entries = append(entries, e)
	}
	return entries, scanner.Err()
}

// VerifyChain checks the chain integrity. Returns the index of the first
// invalid entry, or -1 if the chain is intact.
func VerifyChain(entries []AuditEntry) int {
	prev := GenesisHash
	for i, e := range entries {
		if e.PrevHash != prev {
			return i
		}
		if !hashMatches(e) {
			return i
		}
		prev = e.Hash
	}
	return -1
}

func computeHash(e AuditEntry) string {
	payload := struct {
		Timestamp string          `json:"timestamp"`
		SessionID string          `json:"session_id"`
		Kind      string          `json:"kind"`
		Decision  string          `json:"decision"`
		Reason    string          `json:"reason,omitempty"`
		Stages    []string        `json:"pipeline_stages"`
		Payload   json.RawMessage `json:"payload,omitempty"`
		PrevHash  string          `json:"prev_hash"`
	}{
		Timestamp: e.Timestamp,
		SessionID: e.SessionID,
		Kind:      e.Kind,
		Decision:  e.Decision,
		Reason:    e.Reason,
		Stages:    e.Stages,
		Payload:   e.Payload,
		PrevHash:  e.PrevHash,
	}
	data, _ := json.Marshal(payload)
	sum := sha256.Sum256(data)
	return fmt.Sprintf("sha256:%x", sum[:])
}

func hashMatches(e AuditEntry) bool {
	return e.Hash == computeHash(e)
}
