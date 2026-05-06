/**
 * Galaxy — Investigator Agent
 *
 * Responsibility: drive an autonomous DFIR investigation against evidence
 * using Protocol SIFT's tools, then emit structured Findings for the
 * deterministic Go scrutinizer to validate.
 *
 * The investigator is the ONLY component allowed to call an LLM directly.
 * Everything else in Galaxy (the scrutinizer pipeline, the audit log) is
 * deterministic. This separation is deliberate: it means the LLM cannot
 * bypass the verification layer no matter what it hallucinates.
 *
 * The agent loop:
 *   1. Plan: decide which SIFT tool to run next based on current evidence
 *      state and findings collected so far.
 *   2. Execute: invoke the tool via Protocol SIFT MCP.
 *   3. Observe: parse the output, extract candidate findings.
 *   4. Self-check: run the scrutinizer against each candidate.
 *   5. Iterate: if scrutinizer says RERUN, adjust parameters and retry.
 *   6. Terminate: when all queued lines of inquiry are exhausted OR
 *      max-iterations is hit, return the surviving findings.
 */

import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { spawn } from "node:child_process";

// ─── Types ────────────────────────────────────────────────────────────────

const FindingSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  artifact_type: z.string(),
  source: z.enum(["disk_image", "memory_capture", "log_file", "network_pcap", "live_endpoint"]),
  evidence_path: z.string().optional(),
  offset: z.number().optional(),
  line_number: z.number().optional(),
  mitre_ttps: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1),
  severity: z.enum(["informational", "low", "medium", "high", "critical"]),
  tool_execution: z.object({
    execution_id: z.string(),
    tool: z.string(),
    command: z.string(),
    started_at: z.string(),
    output_digest: z.string(),
    output_bytes: z.number(),
  }),
  supporting_findings: z.array(z.string()).default([]),
});

export type Finding = z.infer<typeof FindingSchema>;

export interface EvidenceContext {
  disk_image_path?: string;
  memory_capture_path?: string;
  mount_point?: string;
  evidence_hashes: Record<string, string>;
  log_files?: string[];
}

export interface InvestigationOptions {
  evidence: EvidenceContext;
  maxIterations: number;
  /** Path to the galaxy CLI binary used to scrutinize candidate findings. */
  galaxyBinary?: string;
  /** Output directory for tool execution logs and findings. */
  outputDir: string;
}

export interface InvestigationResult {
  findings: Finding[];
  rejected_findings: Array<{ finding: Finding; reason: string }>;
  iterations: number;
  total_tool_calls: number;
}

// ─── Investigator Agent ───────────────────────────────────────────────────

export class Investigator {
  constructor(private opts: InvestigationOptions) {}

  async run(): Promise<InvestigationResult> {
    const findings: Finding[] = [];
    const rejected: Array<{ finding: Finding; reason: string }> = [];
    let iter = 0;
    let toolCalls = 0;

    await fs.mkdir(this.opts.outputDir, { recursive: true });

    // The agent loop. In production this would call the Claude Agent SDK
    // with a system prompt, tools array (one per SIFT capability), and let
    // the model drive the investigation. For the skeleton we leave the
    // body as a TODO marked inline so the structure is clear.

    while (iter < this.opts.maxIterations) {
      iter++;
      console.log(`[investigator] iteration ${iter}/${this.opts.maxIterations}`);

      // TODO: call Claude Agent SDK here with:
      //   - System prompt from prompts/investigator.md
      //   - Tool list: protocol_sift_run, fs_list, fs_stat
      //   - Conversation history including prior findings and verdicts
      //
      // The LLM returns either a finding to scrutinize, or a "done" signal.

      const candidate = await this.proposeFinding(iter);
      if (!candidate) break;

      toolCalls++;
      const verdict = await this.scrutinize(candidate, findings);

      if (verdict.decision === "allow") {
        findings.push(candidate);
        console.log(`[investigator] ✓ accepted: ${candidate.id} (${candidate.title})`);
      } else if (verdict.decision === "rerun") {
        rejected.push({ finding: candidate, reason: verdict.reason });
        console.log(`[investigator] ↻ rerun requested: ${candidate.id} (${verdict.reason})`);
        // The agent should refine its approach on the next loop iteration.
      } else {
        rejected.push({ finding: candidate, reason: verdict.reason });
        console.log(`[investigator] ✗ rejected: ${candidate.id} (${verdict.reason})`);
      }
    }

    const result: InvestigationResult = {
      findings,
      rejected_findings: rejected,
      iterations: iter,
      total_tool_calls: toolCalls,
    };

    await fs.writeFile(
      path.join(this.opts.outputDir, "report.json"),
      JSON.stringify(result, null, 2),
      "utf8",
    );

    return result;
  }

  /** TODO: replace with a real Claude Agent SDK call. */
  private async proposeFinding(iter: number): Promise<Finding | null> {
    if (iter > 1) return null; // skeleton: emit one stub finding then stop
    return {
      id: `f-${iter}`,
      title: "Stub finding — replace with real agent output",
      description: "This is placeholder data. The real investigator calls Claude with SIFT tool definitions and parses returned tool_use blocks into Finding structs.",
      artifact_type: "unknown",
      source: "disk_image",
      mitre_ttps: [],
      confidence: 0.5,
      severity: "informational",
      tool_execution: {
        execution_id: `exec-${iter}`,
        tool: "vol3.py windows.pslist",
        command: "vol3.py -f memory.dump windows.pslist",
        started_at: new Date().toISOString(),
        output_digest: "sha256:0".repeat(64),
        output_bytes: 0,
      },
      supporting_findings: [],
    };
  }

  /** Calls the galaxy Go binary to scrutinize a single finding. */
  private async scrutinize(
    finding: Finding,
    siblings: Finding[],
  ): Promise<{ decision: "allow" | "rerun" | "block"; reason: string }> {
    const binary = this.opts.galaxyBinary || "galaxy";
    const inputPath = path.join(this.opts.outputDir, `candidate-${finding.id}.json`);
    const payload = {
      finding,
      evidence: this.opts.evidence,
      siblings,
    };
    await fs.writeFile(inputPath, JSON.stringify(payload), "utf8");

    return new Promise((resolve) => {
      const proc = spawn(binary, ["scrutinize", inputPath], {
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      proc.stdout.on("data", (d) => (stdout += d.toString()));
      proc.on("close", () => {
        try {
          const parsed = JSON.parse(stdout);
          resolve({ decision: parsed.decision, reason: parsed.reason || "" });
        } catch {
          // Skeleton fallback — accept everything until the Go side is wired.
          resolve({ decision: "allow", reason: "" });
        }
      });
      proc.on("error", () => resolve({ decision: "allow", reason: "" }));
    });
  }
}

// ─── CLI Entry ────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , configPath] = process.argv;
  if (!configPath) {
    console.error("usage: tsx investigator.ts <config.json>");
    process.exit(1);
  }
  const cfg: InvestigationOptions = JSON.parse(
    await fs.readFile(configPath, "utf8"),
  );
  const inv = new Investigator(cfg);
  const result = await inv.run();
  console.log(JSON.stringify(result, null, 2));
}
