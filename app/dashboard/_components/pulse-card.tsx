'use client'

import type { PulseRow } from '@/lib/pulse'
import { useT } from '@/lib/i18n/provider'

export default function PulseCard({ rows }: { rows: PulseRow[] }) {
  const { t } = useT()
  const empty = rows.every((r) => r.value === 0 && r.delta === null)
  return (
    <section className="lemma-card p-5" aria-label={t('card.pulse')}>
      <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>
        {t('card.pulse')}
      </h2>
      {empty ? (
        <p className="mt-3 text-sm" style={{ color: 'var(--lemma-slate)' }}>
          {t('card.pulse.empty')}
        </p>
      ) : (
        <ul className="mt-3">
          {rows.map((r, i) => {
            const better = r.delta === null || r.delta === 0 ? null : (r.delta > 0) === (r.good === 'up')
            return (
              <li
                key={r.label}
                className="flex items-center justify-between py-2.5 text-sm"
                style={i > 0 ? { borderTop: '1px solid var(--lemma-line)' } : undefined}
              >
                <span style={{ color: 'var(--lemma-slate)' }}>{r.label}</span>
                <span className="flex items-baseline gap-2">
                  <span className="font-semibold" style={{ color: 'var(--lemma-ink)' }}>{r.value}</span>
                  {r.delta !== null && r.delta !== 0 && (
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: better ? 'var(--lemma-ok)' : 'var(--lemma-check)' }}
                      title={t('card.pulse.compare')}
                    >
                      {r.delta > 0 ? '▲' : '▼'} {Math.abs(r.delta)}
                    </span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      <p className="text-[11px] mt-2" style={{ color: 'var(--lemma-mist)' }}>
        {t('card.pulse.note')}
      </p>
    </section>
  )
}
