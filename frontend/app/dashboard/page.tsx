'use client'

import { useState } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/sections/Footer'
import {
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  Upload,
  Zap,
  Hash,
  FileText,
  ChevronRight,
  Lock,
} from 'lucide-react'

type Decision = 'allow' | 'block' | 'rerun'
type VerifyState = 'idle' | 'verifying' | 'valid' | 'broken'
type ViewMode = 'mock' | 'upload'
type EntryState = 'normal' | 'tampered' | 'unverified'

interface AuditEntry {
  id: number
  timestamp: string
  finding_id: string
  decision: Decision
  reason: string
  confidence: number
  stages: string[]
  prev_hash: string
  hash: string
  technique?: string
  host?: string
}

const MOCK_ENTRIES: AuditEntry[] = [
  {
    id: 1,
    timestamp: '2024-03-14T09:23:41.127Z',
    finding_id: 'FND-2024-001',
    decision: 'allow',
    reason:
      'PowerShell encoded command matches known LOLBin pattern. Parent process chain: explorer.exe → cmd.exe → powershell.exe -EncodedCommand. MITRE ATT&CK T1059.001 — behavior consistent with observed admin tooling in this environment. No exfiltration indicators present.',
    confidence: 0.94,
    stages: ['triage', 'behavior', 'context'],
    prev_hash: '0000000000000000',
    hash: 'a3f8e2c1d9b47e5f',
    technique: 'T1059.001',
    host: 'WKSTN-042',
  },
  {
    id: 2,
    timestamp: '2024-03-14T09:31:18.443Z',
    finding_id: 'FND-2024-002',
    decision: 'block',
    reason:
      'Hallucination detected — proposed artifact path HKLM\\SYSTEM\\CurrentControlSet\\Services\\FakeSvc does not exist in acquired registry hive image. No corroborating evidence found. Investigation blocked pending human review before further action.',
    confidence: 0.08,
    stages: ['triage', 'validate'],
    prev_hash: 'a3f8e2c1d9b47e5f',
    hash: '7d2c9f4a1e836b0d',
    technique: 'T1112',
    host: 'WKSTN-042',
  },
  {
    id: 3,
    timestamp: '2024-03-14T09:44:52.891Z',
    finding_id: 'FND-2024-003',
    decision: 'allow',
    reason:
      'Run key persistence confirmed at HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\svchost32. SHA-256 b14d2fe3c8a09517... matches Emotet dropper variant (Feodo Tracker confirmed). MFT timestamps corroborate installation at 2024-03-14T06:11:22Z.',
    confidence: 0.97,
    stages: ['triage', 'behavior', 'context', 'validate'],
    prev_hash: '7d2c9f4a1e836b0d',
    hash: 'f5a1b3e8c2d60947',
    technique: 'T1547.001',
    host: 'WKSTN-042',
  },
  {
    id: 4,
    timestamp: '2024-03-14T10:02:09.334Z',
    finding_id: 'FND-2024-004',
    decision: 'block',
    reason:
      'Fabricated tool name detected — "mimikatz-v3-pro.exe" does not exist; no such version has been released. Credential access investigation blocked. Requires re-scoping with valid artifact references from memory acquisition output.',
    confidence: 0.06,
    stages: ['triage', 'validate'],
    prev_hash: 'f5a1b3e8c2d60947',
    hash: '3b8e1f7d4c2a9056',
    technique: 'T1003',
    host: 'DC-01',
  },
  {
    id: 5,
    timestamp: '2024-03-14T10:19:37.662Z',
    finding_id: 'FND-2024-005',
    decision: 'rerun',
    reason:
      'SMB lateral movement pattern identified but insufficient log coverage for high-confidence determination. Event log gap detected 09:45–10:10 UTC on DC-01. Flagged for rerun with supplementary EVTX from domain controller before attribution.',
    confidence: 0.51,
    stages: ['triage', 'behavior'],
    prev_hash: '3b8e1f7d4c2a9056',
    hash: 'c9d5f2a8e1b37460',
    technique: 'T1021.002',
    host: 'DC-01',
  },
  {
    id: 6,
    timestamp: '2024-03-14T10:47:22.118Z',
    finding_id: 'FND-2024-006',
    decision: 'allow',
    reason:
      'Lateral movement via SMB confirmed. Pass-the-Hash technique — Event ID 4648 on DC-01 correlates with NTLM logon from WKSTN-042 at 09:51:03 UTC. Domain admin credential extracted post-Emotet execution; attack chain fully reconstructed.',
    confidence: 0.93,
    stages: ['triage', 'behavior', 'context', 'validate'],
    prev_hash: 'c9d5f2a8e1b37460',
    hash: '8f4e2d1c7a9b5036',
    technique: 'T1021.002',
    host: 'DC-01',
  },
  {
    id: 7,
    timestamp: '2024-03-14T11:03:45.779Z',
    finding_id: 'FND-2024-005-R1',
    decision: 'allow',
    reason:
      'Re-analysis of FND-2024-005 with supplementary EVTX from DC-01 security log. Event log gap resolved — lateral movement confirmed via Pass-the-Hash. Chain of custody intact; consistent with Emotet post-exploitation timeline in FND-2024-006.',
    confidence: 0.91,
    stages: ['triage', 'behavior', 'context', 'validate'],
    prev_hash: '8f4e2d1c7a9b5036',
    hash: '2a7c5e9f3d1b840e',
    technique: 'T1021.002',
    host: 'WKSTN-042 → DC-01',
  },
]

const TAMPER_TARGET_ID = 3
const TAMPERED_REASON =
  'MODIFIED: Run key persistence — artifact hash overwritten from b14d2fe3c8a09517... to 00000000deadbeef. Registry hive inconsistency injected. Timestamp rollback applied to FND-2024-003 to conceal Emotet installation window.'
const TAMPERED_CONFIDENCE = 0.23
const TAMPERED_HASH = '×××INVALID××××××'

const DECISION_CONFIG: Record<
  Decision,
  { label: string; color: string; bg: string; border: string; Icon: typeof CheckCircle }
> = {
  allow: {
    label: 'ALLOW',
    color: 'text-neon-green',
    bg: 'bg-neon-green/10',
    border: 'border-neon-green/30',
    Icon: CheckCircle,
  },
  block: {
    label: 'BLOCK',
    color: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/30',
    Icon: XCircle,
  },
  rerun: {
    label: 'RERUN',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/30',
    Icon: RefreshCw,
  },
}

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('mock')
  const [tamperedId, setTamperedId] = useState<number | null>(null)
  const [verifyState, setVerifyState] = useState<VerifyState>('idle')
  const [uploadedEntries, setUploadedEntries] = useState<AuditEntry[]>([])
  const [jsonlInput, setJsonlInput] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)

  const displayEntries = viewMode === 'upload' ? uploadedEntries : MOCK_ENTRIES

  const stats = {
    total: displayEntries.length,
    allowed: displayEntries.filter((e) => e.decision === 'allow').length,
    blocked: displayEntries.filter((e) => e.decision === 'block').length,
    rerun: displayEntries.filter((e) => e.decision === 'rerun').length,
  }

  const handleSimulateTamper = () => {
    if (tamperedId !== null) return
    setTamperedId(TAMPER_TARGET_ID)
    setVerifyState('idle')
    setTimeout(() => {
      setVerifyState('verifying')
      setTimeout(() => setVerifyState('broken'), 1400)
    }, 1600)
  }

  const handleVerifyChain = () => {
    if (verifyState === 'verifying') return
    setVerifyState('verifying')
    setTimeout(() => setVerifyState(tamperedId !== null ? 'broken' : 'valid'), 1400)
  }

  const handleReset = () => {
    setTamperedId(null)
    setVerifyState('idle')
  }

  const parseJsonl = (content: string) => {
    try {
      const lines = content.trim().split('\n').filter((l) => l.trim())
      const parsed = lines.map((line, i) => {
        const obj = JSON.parse(line)
        return { id: i + 1, ...obj } as AuditEntry
      })
      setUploadedEntries(parsed)
      setParseError(null)
    } catch (e) {
      setParseError(`Parse error: ${e instanceof Error ? e.message : 'Invalid JSON'}`)
    }
  }

  const getEntryState = (entry: AuditEntry): EntryState => {
    if (viewMode !== 'mock' || tamperedId === null) return 'normal'
    if (entry.id === tamperedId) return 'tampered'
    if (verifyState === 'broken' && entry.id > tamperedId) return 'unverified'
    return 'normal'
  }

  const chainBadgeClass =
    verifyState === 'broken'
      ? 'bg-red-400/10 border-red-400/30 text-red-400'
      : verifyState === 'verifying'
        ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400'
        : 'bg-neon-green/10 border-neon-green/30 text-neon-green'

  return (
    <main className="min-h-screen bg-dark-900">
      <Nav />

      <div className="pt-20 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── PAGE HEADER ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-10 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neon-green/10 rounded-lg border border-neon-green/20">
                <Shield className="w-6 h-6 text-neon-green" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Audit Trail</h1>
                <p className="text-xs font-mono text-gray-600 mt-0.5">
                  Galaxy DFIR · SCRUTINIZER decision log
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Chain integrity badge */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all duration-500 ${chainBadgeClass}`}
              >
                {verifyState === 'broken' ? (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    CHAIN BROKEN
                  </>
                ) : verifyState === 'verifying' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    VERIFYING...
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    Chain integrity: VERIFIED ✓
                  </>
                )}
              </div>

              <button
                onClick={handleVerifyChain}
                disabled={verifyState === 'verifying'}
                className="px-3 py-1.5 text-xs font-mono border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-40 transition-all"
              >
                Verify Chain
              </button>

              {viewMode === 'mock' &&
                (tamperedId === null ? (
                  <button
                    onClick={handleSimulateTamper}
                    className="px-3 py-1.5 text-xs font-mono border border-red-400/20 rounded-lg text-red-400 hover:border-red-400/40 hover:bg-red-400/5 transition-all flex items-center gap-1.5"
                  >
                    <Zap className="w-3 h-3" />
                    Simulate Tampering
                  </button>
                ) : (
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 text-xs font-mono border border-yellow-400/20 rounded-lg text-yellow-400 hover:border-yellow-400/40 transition-all"
                  >
                    Reset Demo
                  </button>
                ))}

              <button
                onClick={() => {
                  setViewMode((v) => (v === 'mock' ? 'upload' : 'mock'))
                  setTamperedId(null)
                  setVerifyState('idle')
                }}
                className="px-3 py-1.5 text-xs font-mono border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 transition-all flex items-center gap-1.5"
              >
                <Upload className="w-3 h-3" />
                {viewMode === 'mock' ? 'Upload Log' : 'View Demo'}
              </button>
            </div>
          </div>

          {/* ── STATS BAR ── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
            {[
              { label: 'TOTAL', value: stats.total, color: 'text-white' },
              { label: 'ALLOWED', value: stats.allowed, color: 'text-neon-green' },
              { label: 'BLOCKED', value: stats.blocked, color: 'text-red-400' },
              { label: 'RERUN', value: stats.rerun, color: 'text-yellow-400' },
              {
                label: 'CHAIN',
                value:
                  verifyState === 'broken'
                    ? 'BROKEN'
                    : verifyState === 'verifying'
                      ? '···'
                      : 'VALID',
                color:
                  verifyState === 'broken'
                    ? 'text-red-400'
                    : verifyState === 'verifying'
                      ? 'text-yellow-400'
                      : 'text-neon-green',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-card border border-white/5 p-4 text-center"
              >
                <div className={`text-2xl font-black font-mono ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs font-mono text-gray-600 mt-1 tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* ── UPLOAD PANEL ── */}
          {viewMode === 'upload' && (
            <div className="mb-8 glass-card border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-neon-blue" />
                <span className="text-sm font-mono font-semibold text-gray-300">
                  Load Audit Log
                </span>
                <span className="text-xs font-mono text-gray-600 ml-1">
                  — paste JSONL or upload file
                </span>
              </div>

              <textarea
                value={jsonlInput}
                onChange={(e) => setJsonlInput(e.target.value)}
                placeholder={
                  '{"id":1,"timestamp":"2024-01-01T00:00:00Z","finding_id":"FND-001","decision":"allow","reason":"...","confidence":0.9,"stages":["triage"],"prev_hash":"0000000000000000","hash":"abcdef1234567890"}\n{"id":2,...}'
                }
                className="w-full h-36 bg-dark-800 border border-white/10 rounded-lg p-3 text-xs font-mono text-gray-300 placeholder-gray-700 focus:outline-none focus:border-neon-green/30 resize-none transition-colors"
              />

              {parseError && (
                <div className="mt-2 flex items-center gap-1.5 text-xs font-mono text-red-400">
                  <XCircle className="w-3 h-3" />
                  {parseError}
                </div>
              )}

              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => parseJsonl(jsonlInput)}
                  className="px-4 py-2 text-xs font-mono bg-neon-green text-dark-900 rounded-lg font-bold hover:bg-neon-green/90 transition-all"
                >
                  Parse &amp; Load
                </button>
                <span className="text-xs font-mono text-gray-600">or</span>
                <label className="px-4 py-2 text-xs font-mono border border-white/10 rounded-lg text-gray-400 hover:text-white hover:border-white/20 cursor-pointer transition-all">
                  Browse File
                  <input
                    type="file"
                    accept=".jsonl,.json,.txt,.log"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = (ev) => {
                        const content = ev.target?.result as string
                        setJsonlInput(content)
                        parseJsonl(content)
                      }
                      reader.readAsText(file)
                    }}
                  />
                </label>
                {uploadedEntries.length > 0 && (
                  <span className="text-xs font-mono text-neon-green">
                    ✓ {uploadedEntries.length} entries loaded
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── VERIFY BANNER ── */}
          {verifyState === 'verifying' && (
            <div className="flex items-center gap-2 mb-5 text-xs font-mono text-yellow-400">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Traversing hash chain — verifying entry integrity...
            </div>
          )}

          {verifyState === 'broken' && (
            <div className="flex items-center gap-2 mb-5 px-4 py-2.5 rounded-lg bg-red-400/5 border border-red-400/20 text-xs font-mono text-red-400">
              <Zap className="w-3.5 h-3.5 flex-shrink-0" />
              Chain integrity failure at{' '}
              <span className="font-bold">FND-2024-003</span> — all subsequent entries are
              unverified. Tamper detected.
            </div>
          )}

          {/* ── TIMELINE ── */}
          {(viewMode === 'mock' || uploadedEntries.length > 0) && (
            <div>
              {displayEntries.map((entry, index) => {
                const entryState = getEntryState(entry)
                const isTampered = entryState === 'tampered'
                const isUnverified = entryState === 'unverified'
                const isLast = index === displayEntries.length - 1
                const cfg = DECISION_CONFIG[entry.decision]

                const displayReason = isTampered ? TAMPERED_REASON : entry.reason
                const displayConfidence = isTampered ? TAMPERED_CONFIDENCE : entry.confidence
                const displayHash = isTampered ? TAMPERED_HASH : entry.hash
                const hashMismatch = isTampered && verifyState === 'broken'

                return (
                  <div key={entry.id} className="relative flex gap-4">
                    {/* ── Timeline node + connector ── */}
                    <div className="flex flex-col items-center w-8 flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-500 ${
                          hashMismatch
                            ? 'border-red-400 bg-red-400/10'
                            : isUnverified
                              ? 'border-gray-800 bg-dark-800'
                              : 'border-neon-green/40 bg-dark-800'
                        }`}
                      >
                        {hashMismatch ? (
                          <Zap className="w-4 h-4 text-red-400" />
                        ) : isUnverified ? (
                          <div className="w-2 h-2 rounded-full bg-gray-700" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-neon-green/60" />
                        )}
                      </div>
                      {!isLast && (
                        <div
                          className={`w-px flex-1 my-1 transition-all duration-500 ${
                            hashMismatch
                              ? 'bg-red-400/30'
                              : isUnverified
                                ? 'bg-gray-800'
                                : 'bg-neon-green/10'
                          }`}
                          style={{ minHeight: 20 }}
                        />
                      )}
                    </div>

                    {/* ── Entry card ── */}
                    <div
                      className={`flex-1 mb-4 rounded-xl border p-5 transition-all duration-500 ${
                        hashMismatch
                          ? 'border-red-400/40 bg-red-400/5 shadow-[0_0_32px_rgba(248,113,113,0.07)]'
                          : isUnverified
                            ? 'border-white/5 bg-dark-800/20 opacity-30 pointer-events-none'
                            : verifyState === 'verifying'
                              ? 'glass-card border-white/5 animate-pulse'
                              : 'glass-card border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Card header */}
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-mono font-bold text-white">
                            {entry.finding_id}
                          </span>
                          {entry.host && (
                            <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                              {entry.host}
                            </span>
                          )}
                          {entry.technique && (
                            <span className="text-xs font-mono text-neon-blue/80 bg-neon-blue/5 px-2 py-0.5 rounded border border-neon-blue/15">
                              {entry.technique}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isTampered && (
                            <span className="text-xs font-mono font-bold text-red-400 bg-red-400/10 border border-red-400/30 px-2 py-0.5 rounded animate-pulse">
                              ⚡ TAMPERED
                            </span>
                          )}
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold ${cfg.color} ${cfg.bg} ${cfg.border}`}
                          >
                            <cfg.Icon className="w-3 h-3" />
                            {cfg.label}
                          </div>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="text-xs font-mono text-gray-600 mb-3">
                        {entry.timestamp.replace('T', ' ').replace('Z', ' UTC')}
                      </div>

                      {/* Reason */}
                      <p
                        className={`text-sm leading-relaxed mb-4 transition-colors duration-500 ${
                          isTampered ? 'text-red-300' : 'text-gray-300'
                        }`}
                      >
                        {displayReason}
                      </p>

                      {/* Confidence bar */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-mono text-gray-600">Confidence</span>
                          <span
                            className={`text-xs font-mono font-bold transition-colors duration-500 ${
                              displayConfidence >= 0.8
                                ? 'text-neon-green'
                                : displayConfidence >= 0.5
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                            }`}
                          >
                            {Math.round(displayConfidence * 100)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              displayConfidence >= 0.8
                                ? 'bg-neon-green'
                                : displayConfidence >= 0.5
                                  ? 'bg-yellow-400'
                                  : 'bg-red-400'
                            }`}
                            style={{ width: `${displayConfidence * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Stage pills */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {entry.stages.map((stage) => (
                          <span
                            key={stage}
                            className="text-xs font-mono text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded"
                          >
                            {stage}
                          </span>
                        ))}
                      </div>

                      {/* Hash chain row */}
                      <div
                        className={`flex items-center gap-2 pt-3 border-t transition-colors duration-500 ${
                          hashMismatch ? 'border-red-400/20' : 'border-white/5'
                        }`}
                      >
                        <Hash className="w-3 h-3 text-gray-700 flex-shrink-0" />
                        <code className="text-xs font-mono text-gray-700">
                          {entry.prev_hash.slice(0, 16)}
                        </code>
                        <ChevronRight className="w-3 h-3 text-gray-700 flex-shrink-0" />
                        <code
                          className={`text-xs font-mono transition-colors duration-500 ${
                            hashMismatch
                              ? 'text-red-400 line-through decoration-red-400'
                              : 'text-gray-600'
                          }`}
                        >
                          {displayHash.slice(0, 16)}
                        </code>
                        {hashMismatch && (
                          <span className="text-xs font-mono text-red-400 font-bold ml-1">
                            ✗ MISMATCH
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── EMPTY UPLOAD STATE ── */}
          {viewMode === 'upload' && uploadedEntries.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-700">
              <FileText className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm font-mono">Paste JSONL above to load your audit log</p>
            </div>
          )}

        </div>
      </div>

      <Footer />
    </main>
  )
}
