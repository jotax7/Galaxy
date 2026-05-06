// Package classify provides keyword-based classification primitives used
// across stages. Domains supply their own keyword sets; the matching logic
// is shared.
package classify

import "strings"

// MinPhraseLen is the minimum keyword length for substring matching.
// Keywords shorter than this only match on token boundaries (via MatchWords)
// to avoid false positives like "pay" matching "payload".
const MinPhraseLen = 5

// Tokenize splits text on whitespace and common separators.
func Tokenize(text string) []string {
	return strings.FieldsFunc(text, func(r rune) bool {
		return r == ' ' || r == '_' || r == '-' || r == '/' || r == '.' || r == ','
	})
}

// MatchWords returns the keywords whose exact tokens appear in words.
func MatchWords(words, keywords []string) []string {
	kwSet := make(map[string]struct{}, len(keywords))
	for _, kw := range keywords {
		kwSet[kw] = struct{}{}
	}
	var hits []string
	seen := make(map[string]bool)
	for _, w := range words {
		if _, ok := kwSet[w]; ok && !seen[w] {
			hits = append(hits, w)
			seen[w] = true
		}
	}
	return hits
}

// MatchPhrases returns the keywords (length >= MinPhraseLen) that appear
// as substrings of text.
func MatchPhrases(text string, keywords []string) []string {
	var hits []string
	for _, kw := range keywords {
		if len(kw) < MinPhraseLen {
			continue
		}
		if strings.Contains(text, kw) {
			hits = append(hits, kw)
		}
	}
	return hits
}

// AppendUnique appends extras to base, dropping duplicates and empty strings.
func AppendUnique(base []string, extra ...string) []string {
	seen := make(map[string]bool, len(base))
	for _, item := range base {
		seen[item] = true
	}
	for _, item := range extra {
		if item == "" || seen[item] {
			continue
		}
		base = append(base, item)
		seen[item] = true
	}
	return base
}

// ContainsAny reports whether s contains any of the candidate substrings.
func ContainsAny(s string, candidates ...string) bool {
	for _, c := range candidates {
		if strings.Contains(s, c) {
			return true
		}
	}
	return false
}
