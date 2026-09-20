'use client'

import { useT } from '@/lib/i18n/provider'

function Mark({ good }: { good: boolean }) {
  return (
    <span
      aria-hidden
      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
      style={{ background: good ? 'var(--lemma-ok-soft)' : 'var(--lemma-check-soft)', color: good ? 'var(--lemma-ok)' : 'var(--lemma-check)' }}
    >
      {good ? (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.5l2.2 2.2L9.5 3.8" /></svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 3v3.6M6 9h.01" /></svg>
      )}
    </span>
  )
}

export default function StandCard({
  documentsReady,
  evidenceConfirmed,
  openCapas,
  openIssues,
}: {
  documentsReady: number
  evidenceConfirmed: number
  openCapas: number
  openIssues: number
}) {
  const { t } = useT()
  const rows: { label: string; value: number; good: boolean }[] = [
    { label: t('card.stand.docs'), value: documentsReady, good: documentsReady > 0 },
    { label: t('card.stand.evidence'), value: evidenceConfirmed, good: evidenceConfirmed > 0 },
    { label: t('card.stand.problems'), value: openIssues, good: openIssues === 0 },
    { label: t('card.stand.capas'), value: openCapas, good: openCapas === 0 },
  ]
  return (
    <section className="lemma-card p-5" aria-label={t('card.stand')}>
      <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>
        {t('card.stand')}
      </h2>
      <ul className="mt-3">
        {rows.map((r, i) => (
          <li
            key={r.label}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={i > 0 ? { borderTop: '1px solid var(--lemma-line)' } : undefined}
          >
            <Mark good={r.good} />
            <span className="flex-1" style={{ color: 'var(--lemma-slate)' }}>{r.label}</span>
            <span className="font-semibold" style={{ color: 'var(--lemma-ink)' }}>{r.value}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
