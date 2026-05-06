package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"github.com/galaxy-dfir/galaxy/core/audit"
	"github.com/galaxy-dfir/galaxy/domains/dfir"
	"github.com/galaxy-dfir/galaxy/domains/dfir/scrutinizer"
)

var version = "0.1.0"

func main() {
	root := &cobra.Command{
		Use:   "galaxy",
		Short: "Self-skeptical AI agent for SIFT forensics",
		Long: `Galaxy is an autonomous incident response agent built on Protocol SIFT
that scrutinizes its own findings before reporting. Self-correction,
traceable, audit-grade.`,
		SilenceUsage: true,
	}

	root.AddCommand(
		newInvestigateCmd(),
		newScrutinizeCmd(),
		newAuditCmd(),
		newDemoCmd(),
		newVersionCmd(),
	)

	if err := root.Execute(); err != nil {
		os.Exit(1)
	}
}

// ─── investigate ──────────────────────────────────────────────────────────

func newInvestigateCmd() *cobra.Command {
	var (
		evidence   string
		memory     string
		maxIter    int
		outputPath string
	)
	cmd := &cobra.Command{
		Use:   "investigate",
		Short: "Run an autonomous investigation against evidence",
		RunE: func(cmd *cobra.Command, args []string) error {
			fmt.Println("Galaxy investigation starting...")
			fmt.Printf("  evidence:        %s\n", evidence)
			fmt.Printf("  memory:          %s\n", memory)
			fmt.Printf("  max iterations:  %d\n", maxIter)
			fmt.Printf("  output:          %s\n", outputPath)
			fmt.Println()
			fmt.Println("[Galaxy] Spawning investigator agent (TypeScript)...")
			fmt.Println("[Galaxy] The agent will propose findings; this binary will scrutinize each one.")
			fmt.Println("[Galaxy] See agents/investigator/ for the LLM-driven loop and prompts/investigator.md for the system prompt.")
			return nil
		},
	}
	cmd.Flags().StringVarP(&evidence, "evidence", "e", "", "Path to disk image (.E01, .dd, .vmdk)")
	cmd.Flags().StringVarP(&memory, "memory", "m", "", "Path to memory capture (.mem, .raw, .vmem)")
	cmd.Flags().IntVar(&maxIter, "max-iterations", 5, "Maximum re-run iterations before forcing termination")
	cmd.Flags().StringVarP(&outputPath, "output", "o", "report.json", "Where to write the final report")
	return cmd
}

// ─── scrutinize ───────────────────────────────────────────────────────────

// scrutinizeInput is the JSON shape the investigator agent writes when
// asking the Go scrutinizer to evaluate a single candidate finding.
type scrutinizeInput struct {
	Finding    *dfir.Finding           `json:"finding"`
	Evidence   *dfir.EvidenceContext   `json:"evidence"`
	Siblings   []*dfir.Finding         `json:"siblings"`
	Executions []dfir.ToolExecutionRef `json:"executions"`
}

func newScrutinizeCmd() *cobra.Command {
	var auditPath string
	cmd := &cobra.Command{
		Use:   "scrutinize <input.json>",
		Short: "Run the scrutinizer against a JSON file describing a candidate finding",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			data, err := os.ReadFile(args[0])
			if err != nil {
				return fmt.Errorf("read input: %w", err)
			}
			var in scrutinizeInput
			if err := json.Unmarshal(data, &in); err != nil {
				return fmt.Errorf("parse input: %w", err)
			}
			if in.Finding == nil {
				return fmt.Errorf("input is missing finding")
			}

			s := scrutinizer.NewScrutinizer()
			verdict := s.Scrutinize(in.Finding, in.Evidence, in.Siblings, in.Executions)

			if auditPath != "" {
				if err := appendAudit(auditPath, in.Finding, verdict); err != nil {
					fmt.Fprintf(os.Stderr, "warning: audit append failed: %v\n", err)
				}
			}

			out, err := json.MarshalIndent(verdict, "", "  ")
			if err != nil {
				return err
			}
			fmt.Println(string(out))
			return nil
		},
	}
	cmd.Flags().StringVar(&auditPath, "audit", "", "Append verdict to this audit log path")
	return cmd
}

func appendAudit(path string, f *dfir.Finding, v dfir.Verdict) error {
	al, err := audit.New(path)
	if err != nil {
		return err
	}
	payload, err := json.Marshal(map[string]any{
		"finding":             f,
		"verifier_confidence": v.Confidence,
	})
	if err != nil {
		return err
	}
	return al.Log(audit.AuditEntry{
		SessionID: f.ID,
		Kind:      "dfir.finding",
		Decision:  v.Decision,
		Reason:    v.Reason,
		Stages:    v.Stages,
		Payload:   payload,
	})
}

// ─── audit ────────────────────────────────────────────────────────────────

func newAuditCmd() *cobra.Command {
	var verify bool
	var path string
	cmd := &cobra.Command{
		Use:   "audit",
		Short: "Show the audit trail",
		RunE: func(cmd *cobra.Command, args []string) error {
			if path == "" {
				path = "audit.jsonl"
			}
			entries, err := audit.ReadEntries(path)
			if err != nil {
				return err
			}
			if len(entries) == 0 {
				fmt.Println("(no audit entries yet)")
				return nil
			}
			for _, e := range entries {
				data, _ := json.MarshalIndent(e, "", "  ")
				fmt.Println(string(data))
			}
			if verify {
				fmt.Println()
				idx := audit.VerifyChain(entries)
				if idx < 0 {
					fmt.Printf("Chain valid: %d entries\n", len(entries))
				} else {
					fmt.Printf("Chain BROKEN at entry %d\n", idx)
					return fmt.Errorf("audit chain integrity failure")
				}
			}
			return nil
		},
	}
	cmd.Flags().BoolVar(&verify, "verify", false, "Verify hash chain integrity")
	cmd.Flags().StringVar(&path, "path", "audit.jsonl", "Audit log path")
	return cmd
}

// ─── demo ─────────────────────────────────────────────────────────────────

func newDemoCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "demo",
		Short: "Run a canned demo: scrutinize three fixture findings and show the verdicts",
		RunE: func(cmd *cobra.Command, args []string) error {
			fmt.Println("Galaxy demo — running scrutinizer over three fixture findings:")
			fmt.Println("  1. Clean finding (should ALLOW)")
			fmt.Println("  2. Hallucinated path (should BLOCK at provenance)")
			fmt.Println("  3. Made-up tool name (should BLOCK at tool_match)")
			fmt.Println()
			s := scrutinizer.NewScrutinizer()
			for _, fx := range demoFixtures() {
				v := s.Scrutinize(fx.finding, fx.evidence, nil, fx.executions)
				fmt.Printf("--- %s ---\n", fx.label)
				fmt.Printf("Decision:   %s\n", v.Decision)
				fmt.Printf("Confidence: %.2f\n", v.Confidence)
				fmt.Printf("Reason:     %s\n", v.Reason)
				fmt.Printf("Stages:     %v\n\n", v.Stages)
			}
			return nil
		},
	}
}

type demoFixture struct {
	label      string
	finding    *dfir.Finding
	evidence   *dfir.EvidenceContext
	executions []dfir.ToolExecutionRef
}

func demoFixtures() []demoFixture {
	tmp, _ := os.CreateTemp("", "galaxy-demo-*.txt")
	tmp.WriteString("line1\nline2\nline3\n")
	tmp.Close()
	realPath := tmp.Name()

	exec1 := dfir.ToolExecutionRef{
		ExecutionID:  "exec-1",
		Tool:         "vol3.py windows.pslist",
		Command:      "vol3.py -f memory.dump windows.pslist",
		StartedAt:    "2026-04-15T12:00:00Z",
		OutputDigest: "sha256:" + repeat("a", 64),
		OutputBytes:  1024,
	}

	cleanFinding := &dfir.Finding{
		ID:           "f-clean",
		Title:        "Suspicious powershell.exe running as SYSTEM",
		Description:  "Encoded PowerShell command, possible lateral movement",
		Artifact:     dfir.ArtifactMemoryProcess,
		Source:       dfir.SourceMemoryCapture,
		EvidencePath: realPath,
		LineNumber:   2,
		Confidence:   0.9,
		Severity:     dfir.SeverityHigh,
		ToolExecution: &dfir.ToolExecutionRef{
			ExecutionID:  "exec-1",
			Tool:         "vol3.py windows.pslist",
			Command:      exec1.Command,
			StartedAt:    exec1.StartedAt,
			OutputDigest: exec1.OutputDigest,
			OutputBytes:  exec1.OutputBytes,
		},
	}

	hallucinatedPath := &dfir.Finding{
		ID:            "f-bad-path",
		Title:         "Persistence in registry Run key",
		Description:   "Suspicious autorun entry detected",
		Artifact:      dfir.ArtifactRegistryKey,
		Source:        dfir.SourceDiskImage,
		EvidencePath:  "/this/path/does/not/exist/anywhere",
		LineNumber:    42,
		Confidence:    0.8,
		Severity:      dfir.SeverityHigh,
		ToolExecution: &exec1,
	}

	madeUpTool := &dfir.Finding{
		ID:           "f-bad-tool",
		Title:        "Allegedly found something",
		Description:  "Agent claims to have run a tool that doesn't exist",
		Artifact:     dfir.ArtifactFile,
		Source:       dfir.SourceDiskImage,
		EvidencePath: realPath,
		Confidence:   0.7,
		Severity:     dfir.SeverityMedium,
		ToolExecution: &dfir.ToolExecutionRef{
			ExecutionID:  "exec-fake",
			Tool:         "vol3.py windows.evilfind",
			Command:      "vol3.py -f memory.dump windows.evilfind",
			StartedAt:    "2026-04-15T12:05:00Z",
			OutputDigest: "sha256:" + repeat("b", 64),
			OutputBytes:  100,
		},
	}

	evidence := &dfir.EvidenceContext{
		EvidenceHashes: map[string]string{realPath: "sha256:demo"},
	}

	return []demoFixture{
		{label: "1. Clean finding", finding: cleanFinding, evidence: evidence, executions: []dfir.ToolExecutionRef{exec1}},
		{label: "2. Hallucinated path", finding: hallucinatedPath, evidence: evidence, executions: []dfir.ToolExecutionRef{exec1}},
		{label: "3. Made-up tool", finding: madeUpTool, evidence: evidence, executions: []dfir.ToolExecutionRef{exec1}},
	}
}

func repeat(s string, n int) string {
	out := ""
	for i := 0; i < n; i++ {
		out += s
	}
	return out
}

// ─── version ──────────────────────────────────────────────────────────────

func newVersionCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Print version",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("galaxy %s\n", version)
		},
	}
}
