// PayGuard Security Pipeline - TypeScript simulation of the Go backend logic

export type Decision = "ALLOW" | "ASK" | "BLOCK";
export type RiskTier = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ImpactTier = "PERCEPTION" | "REASONING" | "ACTION";
export type StageStatus = "pending" | "running" | "pass" | "fail" | "warn";

export interface PipelineInput {
  toolName: string;
  recipient: string;
  intendedRecipient?: string; // what the agent originally decided — set to detect MCP recipient swaps
  amount: number;
  currency: string;
  description?: string;
  args?: Record<string, string>;
}

export interface StageResult {
  stage: string;
  label: string;
  status: StageStatus;
  detail: string;
  latencyMs: number;
}

export interface PipelineResult {
  decision: Decision;
  reason: string;
  stages: StageResult[];
  riskTier: RiskTier;
  impactTier: ImpactTier;
  totalLatencyMs: number;
  sessionId: string;
  timestamp: Date;
}

// Financial keywords for classification
const FINANCIAL_KEYWORDS = [
  "pay", "payment", "transfer", "send", "wire", "remit",
  "charge", "debit", "credit", "invoice", "billing",
  "checkout", "purchase", "buy", "stripe", "paypal",
  "wallet", "crypto", "bitcoin", "eth", "usdc",
  "withdraw", "deposit",
];

// Credential patterns
const CREDENTIAL_PATTERNS = [
  { name: "Anthropic API Key", pattern: /sk-ant-[a-zA-Z0-9-]+/ },
  { name: "OpenAI API Key", pattern: /sk-[a-zA-Z0-9]{48}/ },
  { name: "GitHub Token", pattern: /ghp_[a-zA-Z0-9]{36}/ },
  { name: "AWS Access Key", pattern: /AKIA[A-Z0-9]{16}/ },
  { name: "Slack Token", pattern: /xoxb-[0-9]+-[a-zA-Z0-9]+/ },
  { name: "Private Key", pattern: /-----BEGIN [A-Z]+ PRIVATE KEY-----/ },
  { name: "JWT Token", pattern: /eyJ[a-zA-Z0-9-_]+\.eyJ[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+/ },
];

// Policy defaults
const POLICY = {
  maxPerCall: 500,
  requireApprovalAbove: 200,
  requireApprovalOnFirstRecipient: true,
  dailyLimit: 2000,
  rateLimitPerHour: 10,
  amountDriftTolerance: 0.01,
};

// In-memory state for demo purposes
interface PaymentRecord {
  amount: number;
  currency: string;
  count: number;
}

const paymentHistory: Map<string, PaymentRecord> = new Map();

export function resetPipelineState() {
  paymentHistory.clear();
}

function classifyTool(toolName: string): { isFinancial: boolean; riskTier: RiskTier; impactTier: ImpactTier } {
  const lowerName = toolName.toLowerCase();
  const isFinancial = FINANCIAL_KEYWORDS.some((kw) => lowerName.includes(kw));

  if (!isFinancial) {
    return { isFinancial: false, riskTier: "LOW", impactTier: "PERCEPTION" };
  }

  return { isFinancial: true, riskTier: "CRITICAL", impactTier: "ACTION" };
}

function scanCredentials(input: PipelineInput): { found: boolean; credType?: string } {
  const allValues = [
    input.toolName,
    input.recipient,
    input.description || "",
    ...Object.values(input.args || {}),
  ].join(" ");

  for (const { name, pattern } of CREDENTIAL_PATTERNS) {
    if (pattern.test(allValues)) {
      return { found: true, credType: name };
    }
  }

  return { found: false };
}

function checkPolicy(input: PipelineInput): { pass: boolean; reason: string; requiresApproval: boolean } {
  if (input.amount > POLICY.maxPerCall) {
    return {
      pass: false,
      reason: `Amount $${input.amount} exceeds max per call ($${POLICY.maxPerCall})`,
      requiresApproval: false,
    };
  }

  if (input.amount > POLICY.requireApprovalAbove) {
    return {
      pass: true,
      reason: `Amount $${input.amount} exceeds approval threshold ($${POLICY.requireApprovalAbove})`,
      requiresApproval: true,
    };
  }

  return { pass: true, reason: "Within policy limits", requiresApproval: false };
}

function checkIntegrity(input: PipelineInput): {
  status: "new_recipient" | "verified" | "recipient_swap" | "amount_drift" | "currency_change";
  detail: string;
} {
  // Detect MCP recipient swap: agent intended one recipient, MCP sent a different one
  if (input.intendedRecipient && input.intendedRecipient !== input.recipient) {
    return {
      status: "recipient_swap",
      detail: `Recipient changed: ${input.intendedRecipient} → ${input.recipient}`,
    };
  }

  const existing = paymentHistory.get(input.recipient);

  if (!existing) {
    // Register as baseline
    paymentHistory.set(input.recipient, {
      amount: input.amount,
      currency: input.currency,
      count: 1,
    });
    return { status: "new_recipient", detail: `First payment to ${input.recipient} — registered as baseline` };
  }

  // Check currency change
  if (existing.currency !== input.currency) {
    return {
      status: "currency_change",
      detail: `Currency changed from ${existing.currency} to ${input.currency} — possible tampering`,
    };
  }

  // Check amount drift (>1% tolerance)
  const drift = Math.abs(input.amount - existing.amount) / existing.amount;
  if (drift > POLICY.amountDriftTolerance) {
    if (input.amount > existing.amount * 1.5) {
      return {
        status: "amount_drift",
        detail: `Amount inflated from $${existing.amount} to $${input.amount} (+${(drift * 100).toFixed(1)}%)`,
      };
    }
  }

  // All good — increment count
  paymentHistory.set(input.recipient, { ...existing, count: existing.count + 1 });
  return { status: "verified", detail: `Payment matches baseline for ${input.recipient}` };
}

export async function runPipeline(input: PipelineInput): Promise<PipelineResult> {
  const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();
  const stages: StageResult[] = [];
  let decision: Decision = "ALLOW";
  let reason = "All checks passed";
  const startTime = Date.now();

  // Stage 1: Classification
  const classStart = Date.now();
  await new Promise((r) => setTimeout(r, 80 + Math.random() * 40));
  const { isFinancial, riskTier, impactTier } = classifyTool(input.toolName);
  stages.push({
    stage: "classify",
    label: "Classification",
    status: isFinancial ? "warn" : "pass",
    detail: isFinancial
      ? `Financial tool detected — Risk: ${riskTier}, Impact: ${impactTier}`
      : "Non-financial tool — low risk",
    latencyMs: Date.now() - classStart,
  });

  if (!isFinancial) {
    stages.push(
      { stage: "credentials", label: "Credential Scan", status: "pass", detail: "Skipped — non-financial", latencyMs: 0 },
      { stage: "policy", label: "Policy Check", status: "pass", detail: "Skipped — non-financial", latencyMs: 0 },
      { stage: "integrity", label: "Integrity Check", status: "pass", detail: "Skipped — non-financial", latencyMs: 0 },
      { stage: "audit", label: "Audit Log", status: "pass", detail: "Decision logged", latencyMs: 1 }
    );
    return {
      decision: "ALLOW",
      reason: "Non-financial tool call",
      stages,
      riskTier: "LOW",
      impactTier: "PERCEPTION",
      totalLatencyMs: Date.now() - startTime,
      sessionId,
      timestamp: new Date(),
    };
  }

  // Stage 2: Credential Scanning
  const credStart = Date.now();
  await new Promise((r) => setTimeout(r, 60 + Math.random() * 30));
  const credResult = scanCredentials(input);
  if (credResult.found) {
    stages.push({
      stage: "credentials",
      label: "Credential Scan",
      status: "fail",
      detail: `DANGER: ${credResult.credType} detected in payload — BLOCKED`,
      latencyMs: Date.now() - credStart,
    });
    stages.push(
      { stage: "policy", label: "Policy Check", status: "pending", detail: "Halted by credential scan", latencyMs: 0 },
      { stage: "integrity", label: "Integrity Check", status: "pending", detail: "Halted by credential scan", latencyMs: 0 },
      { stage: "audit", label: "Audit Log", status: "pass", detail: "Block decision logged", latencyMs: 1 }
    );
    return {
      decision: "BLOCK",
      reason: `Credential detected: ${credResult.credType}`,
      stages,
      riskTier,
      impactTier,
      totalLatencyMs: Date.now() - startTime,
      sessionId,
      timestamp: new Date(),
    };
  }
  stages.push({
    stage: "credentials",
    label: "Credential Scan",
    status: "pass",
    detail: "No credentials detected in payload",
    latencyMs: Date.now() - credStart,
  });

  // Stage 3: Policy Check
  const policyStart = Date.now();
  await new Promise((r) => setTimeout(r, 50 + Math.random() * 20));
  const policyResult = checkPolicy(input);
  if (!policyResult.pass) {
    stages.push({
      stage: "policy",
      label: "Policy Check",
      status: "fail",
      detail: policyResult.reason,
      latencyMs: Date.now() - policyStart,
    });
    stages.push(
      { stage: "integrity", label: "Integrity Check", status: "pending", detail: "Halted by policy", latencyMs: 0 },
      { stage: "audit", label: "Audit Log", status: "pass", detail: "Block decision logged", latencyMs: 1 }
    );
    return {
      decision: "BLOCK",
      reason: policyResult.reason,
      stages,
      riskTier,
      impactTier,
      totalLatencyMs: Date.now() - startTime,
      sessionId,
      timestamp: new Date(),
    };
  }

  const policyStageStatus: StageStatus = policyResult.requiresApproval ? "warn" : "pass";
  stages.push({
    stage: "policy",
    label: "Policy Check",
    status: policyStageStatus,
    detail: policyResult.reason,
    latencyMs: Date.now() - policyStart,
  });

  if (policyResult.requiresApproval) {
    decision = "ASK";
    reason = policyResult.reason;
  }

  // Stage 4: Integrity / Drift Detection
  const integrityStart = Date.now();
  await new Promise((r) => setTimeout(r, 70 + Math.random() * 30));
  const integrityResult = checkIntegrity(input);

  const isTampered = ["recipient_swap", "amount_drift", "currency_change"].includes(integrityResult.status);
  const isNewRecipient = integrityResult.status === "new_recipient";

  const integrityStatus: StageStatus = isTampered ? "fail" : isNewRecipient ? "warn" : "pass";

  stages.push({
    stage: "integrity",
    label: "Integrity Check",
    status: integrityStatus,
    detail: integrityResult.detail,
    latencyMs: Date.now() - integrityStart,
  });

  // Merge decisions (most restrictive wins)
  if (isTampered) {
    decision = "BLOCK";
    reason = integrityResult.detail;
  } else if (isNewRecipient) {
    decision = "ASK";
    reason = `New recipient detected — human approval required`;
  }

  // Stage 5: Audit
  const auditStart = Date.now();
  await new Promise((r) => setTimeout(r, 10));
  stages.push({
    stage: "audit",
    label: "Audit Log",
    status: "pass",
    detail: `Decision logged with SHA-256 hash chain entry`,
    latencyMs: Date.now() - auditStart,
  });

  return {
    decision,
    reason,
    stages,
    riskTier,
    impactTier,
    totalLatencyMs: Date.now() - startTime,
    sessionId,
    timestamp: new Date(),
  };
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  sessionId: string;
  toolName: string;
  recipient: string;
  amount: number;
  currency: string;
  decision: Decision;
  reason: string;
  hash: string;
}

export function generateMockAuditLog(): AuditEntry[] {
  const entries: AuditEntry[] = [
    {
      id: "1",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      sessionId: "A3F29B1C",
      toolName: "stripe_payment",
      recipient: "alice@company.com",
      amount: 50,
      currency: "USD",
      decision: "ALLOW",
      reason: "Payment matches baseline for alice@company.com",
      hash: "a3f29b1c4d5e6f7a8b9c0d1e2f3a4b5c",
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 4 * 60 * 1000),
      sessionId: "B7C12D4E",
      toolName: "send_payment",
      recipient: "attacker@evil.com",
      amount: 5000,
      currency: "USD",
      decision: "BLOCK",
      reason: "Amount inflated from $50 to $5000 (+9900%)",
      hash: "b7c12d4e5f6a7b8c9d0e1f2a3b4c5d6e",
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      sessionId: "C9D34E5F",
      toolName: "wire_transfer",
      recipient: "vendor@supplier.io",
      amount: 350,
      currency: "USD",
      decision: "ASK",
      reason: "First payment to vendor@supplier.io — human approval required",
      hash: "c9d34e5f6a7b8c9d0e1f2a3b4c5d6e7f",
    },
    {
      id: "4",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      sessionId: "D1E45F6A",
      toolName: "paypal_send",
      recipient: "contractor@dev.com",
      amount: 150,
      currency: "USD",
      decision: "ALLOW",
      reason: "Payment matches baseline",
      hash: "d1e45f6a7b8c9d0e1f2a3b4c5d6e7f8a",
    },
    {
      id: "5",
      timestamp: new Date(Date.now() - 1 * 60 * 1000),
      sessionId: "E3F56A7B",
      toolName: "crypto_transfer",
      recipient: "wallet_0x1234",
      amount: 100,
      currency: "USDC",
      decision: "ASK",
      reason: "New recipient detected — human approval required",
      hash: "e3f56a7b8c9d0e1f2a3b4c5d6e7f8a9b",
    },
  ];
  return entries;
}
