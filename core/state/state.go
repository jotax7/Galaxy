// Package state persists Galaxy state between agent invocations. Each
// galaxy CLI invocation is a separate OS process, so state is serialized
// to disk with file locking.
package state

import (
	"encoding/json"
	"fmt"
	"os"
	"syscall"
	"time"
)

// State holds anything the pipeline needs to remember across invocations.
// Domains add their own typed values via the generic Domain map.
type State struct {
	// Calls maps a key (e.g. tool name, session id) to call timestamps.
	Calls map[string][]int64 `json:"calls"`

	// Iterations maps a session ID to its current re-run count, used to
	// enforce --max-iterations.
	Iterations map[string]int `json:"iterations"`

	// Domain holds opaque domain-specific data, JSON-serialized.
	Domain map[string]json.RawMessage `json:"domain"`
}

// New creates an empty state.
func New() *State {
	return &State{
		Calls:      make(map[string][]int64),
		Iterations: make(map[string]int),
		Domain:     make(map[string]json.RawMessage),
	}
}

// Load reads state from disk. Returns empty state if the file does not exist.
// Prunes stale entries (older than 24h) on load.
func Load(path string) (*State, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return New(), nil
		}
		return nil, fmt.Errorf("read state: %w", err)
	}
	s := New()
	if err := json.Unmarshal(data, s); err != nil {
		return nil, fmt.Errorf("parse state: %w", err)
	}
	s.Prune()
	return s, nil
}

// Save writes state to disk atomically with 0600 permissions.
func (s *State) Save(path string) error {
	data, err := json.Marshal(s)
	if err != nil {
		return fmt.Errorf("marshal state: %w", err)
	}
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, data, 0600); err != nil {
		return fmt.Errorf("write state tmp: %w", err)
	}
	if err := os.Rename(tmp, path); err != nil {
		os.Remove(tmp)
		return fmt.Errorf("rename state: %w", err)
	}
	return nil
}

// RecordCall logs a call timestamp under a key.
func (s *State) RecordCall(key string) {
	s.Calls[key] = append(s.Calls[key], time.Now().Unix())
}

// IncrementIteration increases the re-run counter for a session and returns
// the new count.
func (s *State) IncrementIteration(sessionID string) int {
	s.Iterations[sessionID]++
	return s.Iterations[sessionID]
}

// GetIteration returns the current iteration count for a session.
func (s *State) GetIteration(sessionID string) int {
	return s.Iterations[sessionID]
}

// SetDomain stores a domain-specific value.
func (s *State) SetDomain(key string, value any) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	s.Domain[key] = data
	return nil
}

// GetDomain retrieves a domain-specific value into out.
func (s *State) GetDomain(key string, out any) (bool, error) {
	data, ok := s.Domain[key]
	if !ok {
		return false, nil
	}
	if err := json.Unmarshal(data, out); err != nil {
		return true, err
	}
	return true, nil
}

// Prune removes Calls older than 25h and Iterations older than 24h.
func (s *State) Prune() {
	cutoff := time.Now().Add(-25 * time.Hour).Unix()
	for k, ts := range s.Calls {
		pruned := ts[:0]
		for _, t := range ts {
			if t > cutoff {
				pruned = append(pruned, t)
			}
		}
		if len(pruned) == 0 {
			delete(s.Calls, k)
		} else {
			s.Calls[k] = pruned
		}
	}
}

// FileLock holds an OS-level advisory lock used to serialize concurrent
// galaxy invocations against the same config dir.
type FileLock struct {
	f *os.File
}

// AcquireLock obtains an exclusive lock on the given path.
func AcquireLock(path string) (*FileLock, error) {
	f, err := os.OpenFile(path, os.O_CREATE|os.O_RDWR, 0600)
	if err != nil {
		return nil, fmt.Errorf("open lock file: %w", err)
	}
	if err := syscall.Flock(int(f.Fd()), syscall.LOCK_EX); err != nil {
		f.Close()
		return nil, fmt.Errorf("acquire lock: %w", err)
	}
	return &FileLock{f: f}, nil
}

// Release releases the file lock and cleans up.
func (fl *FileLock) Release() {
	if fl.f == nil {
		return
	}
	name := fl.f.Name()
	_ = syscall.Flock(int(fl.f.Fd()), syscall.LOCK_UN)
	fl.f.Close()
	fl.f = nil
	os.Remove(name)
}
