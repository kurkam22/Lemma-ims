'use client'

import type { ComplianceChainRow, ChainStatus } from '@/lib/demo-data'

const STATUS_STYLE: Record<ChainStatus, { bg: string; fg: string; dot: string; label: string }> = {
  done: {
    bg: 'var(--lemma-ok-soft)',
    fg: 'var(--lemma-ok)',
    dot: 'var(--lemma-ok)',
    label: 'Done',
  },
  progress: {
    bg: 'var(--lemma-check-soft)',
    fg: 'var(--lemma-check)',
    dot: 'var(--lemma-check)',
    label: 'In progress',
  },
  missing: {
    bg: 'var(--lemma-danger-soft)',
    fg: 'var(--lemma-danger)',
    dot: 'var(--lemma-danger)',
    label: 'Missing',
  },
}

const LINKS = ['Clause', 'Requirement', 'Answer', 'Document', 'Evidence', 'Audit', 'CAPA']

function Node({
  label,
  status,
  strong,
}: {
  label: string
  status?: ChainStatus
  strong?: boolean
}) {
  const s = status ? STATUS_STYLE[status] : null
  return (
    <div
      className="rounded-lg px-2.5 py-2 min-w-[120px] flex-1"
      style={{
        background: s ? s.bg : 'var(--lemma-canvas)',
        border: `1px solid ${s ? s.fg : 'var(--lemma-line)'}`,
      }}
    >
      {status && (
        <div className="flex items-center gap-1 mb-0.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: STATUS_STYLE[status].dot }}
          />
          <span className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: s!.fg }}>
            {STATUS_STYLE[status].label}
          </span>
        </div>
      )}
      <div
        className="text-[11px] leading-snug"
        style={{
          color: strong ? 'var(--lemma-ink)' : 'var(--lemma-slate)',
          fontWeight: strong ? 600 : 400,
        }}
      >
        {label}
      </div>
    </div>
  )
}

function Arrow() {
  return (
    <div className="flex items-center justify-center px-0.5 shrink-0" aria-hidden>
      <span style={{ color: 'var(--lemma-mist)', fontSize: 14 }}>→</span>
    </div>
  )
}

export default function ComplianceChain({ rows }: { rows: ComplianceChainRow[] }) {
  return (
    <div className="lemma-card p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>
          Compliance chain
        </h2>
        <span className="text-[11px]" style={{ color: 'var(--lemma-mist)' }}>
          one requirement, end to end
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--lemma-slate)' }}>
        See how a single ISO clause becomes an answer, a document, evidence, an audit
        result, and a corrective action — the full trace an auditor follows.
      </p>

      <div
        className="hidden md:flex items-center gap-1 mb-2 px-1"
        style={{ color: 'var(--lemma-mist)' }}
      >
        {LINKS.map((l, i) => (
          <div key={l} className="flex items-center gap-1 flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide">{l}</span>
            {i < LINKS.length - 1 && <span className="ml-auto" />}
          </div>
        ))}
      </div>

      <div className="space-y-2.5">
        {rows.map((r) => (
          <div
            key={r.clause}
            className="rounded-xl p-2.5"
            style={{ background: 'var(--lemma-canvas)', border: '1px solid var(--lemma-line)' }}
          >
            <div className="flex flex-col md:flex-row md:items-stretch gap-1.5">
              <div
                className="rounded-lg px-2.5 py-2 flex md:flex-col items-center md:items-start justify-center shrink-0"
                style={{ background: 'var(--lemma-primary-soft)', minWidth: 64 }}
              >
                <span className="text-[9px] font-semibold uppercase" style={{ color: 'var(--lemma-primary)' }}>
                  Clause
                </span>
                <span className="text-[15px] font-bold md:mt-0.5 ml-1 md:ml-0" style={{ color: 'var(--lemma-primary)' }}>
                  {r.clause}
                </span>
              </div>
              <Node label={r.requirement} strong />
              <Arrow />
              <Node label={r.answer} />
              <Arrow />
              <Node label={r.document.label} status={r.document.status} />
              <Arrow />
              <Node label={r.evidence.label} status={r.evidence.status} />
              <Arrow />
              <Node label={r.audit.label} status={r.audit.status} />
              {r.capa && (
                <>
                  <Arrow />
                  <Node label={r.capa.label} status={r.capa.status} />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
