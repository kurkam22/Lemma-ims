'use client'

import { AREA_KEY } from '@/lib/i18n/labels'
import { useT } from '@/lib/i18n/provider'

function tone(pct: number): string {
  if (pct >= 75) return 'var(--lemma-do)'
  if (pct >= 50) return 'var(--lemma-primary)'
  if (pct >= 25) return 'var(--lemma-check)'
  return 'var(--lemma-mist)'
}

// A ring for the overall readiness figure and slim bars for each area.
// The figure is Lemma's own indicator, so the disclaimer stays next to it.
export default function ReadinessCard({
  pct,
  areas,
}: {
  pct: number
  areas: { area: string; pct: number }[]
}) {
  const { t } = useT()
  const r = 42
  const c = 2 * Math.PI * r
  const shown = Math.max(0, Math.min(100, pct))
  return (
    <section className="lemma-card p-5" aria-label={t('card.readiness')}>
      <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>
        {t('card.readiness')}
      </h2>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative shrink-0" style={{ width: 96, height: 96 }} role="img" aria-label={t('card.readinessAria', { pct: shown })}>
          <svg viewBox="0 0 100 100" width="96" height="96" aria-hidden>
            <circle cx="50" cy="50" r={r} fill="none" stroke="var(--lemma-line)" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={tone(shown)}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(c * shown) / 100} ${c}`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold leading-none" style={{ color: 'var(--lemma-ink)' }}>
              {shown}%
            </span>
          </div>
        </div>
        <p className="text-[11px] leading-snug" style={{ color: 'var(--lemma-mist)' }}>
          {t('readiness.disclaimer')}
        </p>
      </div>
      <ul className="mt-4 space-y-2.5">
        {areas.map((a) => (
          <li key={a.area}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="truncate pr-2" style={{ color: 'var(--lemma-slate)' }}>{AREA_KEY[a.area] ? t(AREA_KEY[a.area]) : a.area}</span>
              <span className="font-medium" style={{ color: 'var(--lemma-ink)' }}>{a.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--lemma-line)' }}>
              <div className="h-full rounded-full" style={{ width: `${a.pct}%`, background: tone(a.pct) }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
