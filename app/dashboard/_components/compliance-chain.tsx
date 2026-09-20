'use client'

import { useT } from '@/lib/i18n/provider'

import type { ComplianceChainRow, ChainStatus, Origin } from '@/lib/demo-data'

const STATUS_STYLE: Record<ChainStatus, { bg: string; fg: string; dot: string; labelKey: 'chain.status.done' | 'chain.status.progress' | 'chain.status.missing' }> = {
  done: {
    bg: 'var(--lemma-ok-soft)',
    fg: 'var(--lemma-ok)',
    dot: 'var(--lemma-ok)',
    labelKey: 'chain.status.done' as const,
  },
  progress: {
    bg: 'var(--lemma-check-soft)',
    fg: 'var(--lemma-check)',
    dot: 'var(--lemma-check)',
    labelKey: 'chain.status.progress' as const,
  },
  missing: {
    bg: 'var(--lemma-danger-soft)',
    fg: 'var(--lemma-danger)',
    dot: 'var(--lemma-danger)',
    labelKey: 'chain.status.missing' as const,
  },
}

const LINK_KEYS = ['chain.col.clause', 'chain.col.requirement', 'chain.col.answer', 'chain.col.document', 'chain.col.evidence', 'chain.col.audit', 'chain.col.capa'] as const

function Node({
  label,
  status,
  strong,
  origin,
}: {
  label: string
  status?: ChainStatus
  strong?: boolean
  origin?: Origin
}) {
  const { t } = useT()
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
            {t(STATUS_STYLE[status].labelKey)}
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
      {origin && (
        <div
          className="text-[9px] mt-1 font-medium"
          style={{ color: origin === 'iso' ? 'var(--lemma-primary)' : 'var(--lemma-mist)' }}
          title={
            origin === 'iso'
              ? t('chain.tip.iso')
              : t('chain.tip.company')
          }
        >
          {origin === 'iso' ? t('chain.origin.iso') : t('chain.origin.company')}
        </div>
      )}
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
  const { t } = useT()
  return (
    <div className="lemma-card p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>
          {t('chain.title')}
        </h2>
        <span className="text-[11px]" style={{ color: 'var(--lemma-mist)' }}>
          {t('chain.tag')}
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--lemma-slate)' }}>
        {t('chain.desc')}
      </p>

      <div
        className="hidden md:flex items-center gap-1 mb-2 px-1"
        style={{ color: 'var(--lemma-mist)' }}
      >
        {LINK_KEYS.map((l, i) => (
          <div key={l} className="flex items-center gap-1 flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide">{t(l)}</span>
            {i < LINK_KEYS.length - 1 && <span className="ml-auto" />}
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
                  {t('chain.col.clause')}
                </span>
                <span className="text-[15px] font-bold md:mt-0.5 ml-1 md:ml-0" style={{ color: 'var(--lemma-primary)' }}>
                  {r.clause}
                </span>
              </div>
              <Node label={r.requirement} strong origin="iso" />
              <Arrow />
              <Node label={r.answer} origin={r.answerOrigin} />
              <Arrow />
              <Node label={r.document.label} status={r.document.status} origin={r.document.origin} />
              <Arrow />
              <Node label={r.evidence.label} status={r.evidence.status} origin={r.evidence.origin} />
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
