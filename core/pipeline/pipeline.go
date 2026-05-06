// Package pipeline orchestrates a sequence of validation stages over an
// input. Each stage decides ALLOW (continue), RERUN (caller should retry
// with adjusted params), or BLOCK (terminal failure).
//
// This is the core skeleton: domain code (e.g. domains/dfir) supplies the
// concrete stages. The pipeline itself knows nothing about DFIR, payments,
// or any specific domain.
package pipeline

import "fmt"

// Decision is the verdict a stage emits.
type Decision string

const (
	DecisionAllow Decision = "allow"
	DecisionRerun Decision = "rerun"
	DecisionBlock Decision = "block"
)

// StageResult is what each stage returns.
type StageResult struct {
	Name     string   `json:"name"`
	Decision Decision `json:"decision"`
	Status   string   `json:"status"`           // human-readable short status
	Reason   string   `json:"reason,omitempty"` // explanation, esp. for non-Allow
	Details  any      `json:"details,omitempty"`
}

// Stage is a single validation step. Stages take a context-bag and return
// a result. The context-bag is a typed `Bag` that domains can extend.
type Stage interface {
	Name() string
	Run(bag *Bag) StageResult
}

// Bag is a typed shared context that flows through the pipeline. Stages
// read/write it. Domains use a wrapper around Bag to add typed accessors.
type Bag struct {
	values map[string]any
}

// NewBag creates an empty bag.
func NewBag() *Bag {
	return &Bag{values: make(map[string]any)}
}

// Set stores a value in the bag.
func (b *Bag) Set(key string, value any) {
	b.values[key] = value
}

// Get retrieves a value. The second return is false if the key doesn't exist.
func (b *Bag) Get(key string) (any, bool) {
	v, ok := b.values[key]
	return v, ok
}

// MustGet panics if the key is missing — use only when stage logic guarantees it.
func (b *Bag) MustGet(key string) any {
	v, ok := b.values[key]
	if !ok {
		panic(fmt.Sprintf("pipeline.Bag: missing key %q", key))
	}
	return v
}

// Run executes stages in order. Stops at the first non-Allow decision.
// Returns all stage results that ran (including the failing one).
func Run(bag *Bag, stages []Stage) []StageResult {
	results := make([]StageResult, 0, len(stages))
	for _, s := range stages {
		r := s.Run(bag)
		r.Name = s.Name()
		results = append(results, r)
		if r.Decision != DecisionAllow {
			break
		}
	}
	return results
}

// FinalDecision returns the most-restrictive decision from a list of stage
// results. Block > Rerun > Allow.
func FinalDecision(results []StageResult) Decision {
	final := DecisionAllow
	for _, r := range results {
		switch r.Decision {
		case DecisionBlock:
			return DecisionBlock
		case DecisionRerun:
			final = DecisionRerun
		}
	}
	return final
}

// StageNames returns just the names of stages run, useful for audit logs.
func StageNames(results []StageResult) []string {
	out := make([]string, len(results))
	for i, r := range results {
		out[i] = r.Name + ":" + string(r.Decision)
	}
	return out
}
