// Package dfir contains Galaxy's DFIR-domain logic: investigator stages,
// finding types, MITRE ATT&CK mappings, and Protocol SIFT integration.
//
// This package is the "skin" in the skeleton+skin architecture. The core/
// pipeline knows nothing about disk images or memory captures; the dfir
// package supplies the concrete stages and types.
package dfir

// ArtifactType is the kind of forensic artifact a finding cites.
type ArtifactType string

const (
	ArtifactMFTRecord       ArtifactType = "mft_record"
	ArtifactPrefetch        ArtifactType = "prefetch"
	ArtifactAmcache         ArtifactType = "amcache"
	ArtifactRegistryKey     ArtifactType = "registry_key"
	ArtifactEventLog        ArtifactType = "event_log"
	ArtifactBrowserHistory  ArtifactType = "browser_history"
	ArtifactMemoryProcess   ArtifactType = "memory_process"
	ArtifactMemoryString    ArtifactType = "memory_string"
	ArtifactNetworkConn     ArtifactType = "network_connection"
	ArtifactFile            ArtifactType = "file"
	ArtifactScheduledTask   ArtifactType = "scheduled_task"
	ArtifactService         ArtifactType = "service"
	ArtifactPersistence     ArtifactType = "persistence_mechanism"
	ArtifactUnknown         ArtifactType = "unknown"
)

// EvidenceSource is where a finding's evidence comes from.
type EvidenceSource string

const (
	SourceDiskImage     EvidenceSource = "disk_image"
	SourceMemoryCapture EvidenceSource = "memory_capture"
	SourceLogFile       EvidenceSource = "log_file"
	SourceNetworkPCAP   EvidenceSource = "network_pcap"
	SourceLiveEndpoint  EvidenceSource = "live_endpoint"
)

// Finding is a single claim the investigator agent makes about evidence.
// The scrutinizer's job is to validate (or reject) this claim.
type Finding struct {
	ID          string         `json:"id"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	Artifact    ArtifactType   `json:"artifact_type"`
	Source      EvidenceSource `json:"source"`

	// EvidencePath is the file (or sub-path inside an image) that the
	// finding cites. Empty if not file-bound.
	EvidencePath string `json:"evidence_path,omitempty"`

	// Offset (for binary artifacts) or LineNumber (for text artifacts) —
	// exactly one is typically populated. The provenance stage uses these
	// to verify the cited location actually exists.
	Offset     int64 `json:"offset,omitempty"`
	LineNumber int64 `json:"line_number,omitempty"`

	// MitreTTPs lists MITRE ATT&CK technique IDs (e.g. "T1547.001").
	MitreTTPs []string `json:"mitre_ttps,omitempty"`

	// Confidence is the agent's self-reported confidence, 0..1.
	// (The scrutinizer recomputes its own confidence.)
	Confidence float64 `json:"confidence"`

	// Severity classification.
	Severity Severity `json:"severity"`

	// ToolExecution links this finding to the SIFT tool invocation that
	// produced it. Required — the scrutinizer rejects findings without it.
	ToolExecution *ToolExecutionRef `json:"tool_execution,omitempty"`

	// SupportingFindings are IDs of other findings that corroborate this one.
	SupportingFindings []string `json:"supporting_findings,omitempty"`
}

// Severity is the analyst-facing impact level.
type Severity string

const (
	SeverityInformational Severity = "informational"
	SeverityLow           Severity = "low"
	SeverityMedium        Severity = "medium"
	SeverityHigh          Severity = "high"
	SeverityCritical      Severity = "critical"
)

// ToolExecutionRef points back to a recorded SIFT tool execution. The
// audit log preserves the full execution; the finding holds only a ref.
type ToolExecutionRef struct {
	ExecutionID  string `json:"execution_id"`
	Tool         string `json:"tool"`           // e.g. "vol3.py windows.pslist"
	Command      string `json:"command"`        // exact command line
	StartedAt    string `json:"started_at"`
	OutputDigest string `json:"output_digest"`  // sha256 of the stdout
	OutputBytes  int64  `json:"output_bytes"`
}

// Verdict is what the scrutinizer pipeline emits about a finding.
type Verdict struct {
	FindingID  string  `json:"finding_id"`
	Decision   string  `json:"decision"` // "allow" | "rerun" | "block"
	Reason     string  `json:"reason,omitempty"`
	Confidence float64 `json:"verifier_confidence"` // 0..1, computed deterministically
	Stages     []string `json:"stages"`
}

// EvidenceContext is what stages need to verify findings: pointers to the
// files, hashes, mount points etc. Populated once per investigation.
type EvidenceContext struct {
	// DiskImagePath is the path to the disk image (.E01, .dd, .vmdk).
	DiskImagePath string `json:"disk_image_path,omitempty"`

	// MemoryCapturePath is the path to a memory dump (.mem, .raw, .vmem).
	MemoryCapturePath string `json:"memory_capture_path,omitempty"`

	// MountPoint is where the disk image is read-only mounted, if any.
	MountPoint string `json:"mount_point,omitempty"`

	// EvidenceHashes maps evidence file -> sha256 at start of investigation.
	// The integrity stage re-hashes and rejects if any has changed.
	EvidenceHashes map[string]string `json:"evidence_hashes"`

	// LogFiles is a list of additional log/text evidence files.
	LogFiles []string `json:"log_files,omitempty"`
}
