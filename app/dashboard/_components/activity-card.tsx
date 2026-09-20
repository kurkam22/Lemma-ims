'use client'

import { whenLabel, type ActivityItem } from '@/lib/pulse'
import { useT } from '@/lib/i18n/provider'

export default function ActivityCard({ items, today }: { items: ActivityItem[]; today: Date }) {
  const { t, locale } = useT()
  return (
    <section className="lemma-card p-5" aria-label={t('card.activity')}>
      <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>
        {t('card.activity')}
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm" style={{ color: 'var(--lemma-slate)' }}>
          {t('card.activity.empty')}
        </p>
      ) : (
        <ul className="mt-3">
          {items.map((a, i) => (
            <li
              key={a.id}
              className="flex items-center gap-3 py-2.5"
              style={i > 0 ? { borderTop: '1px solid var(--lemma-line)' } : undefined}
            >
              <span
                aria-hidden
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: a.tone === 'ok' ? 'var(--lemma-ok)' : 'var(--lemma-primary)' }}
              />
              <span className="flex-1 min-w-0 truncate text-sm" style={{ color: 'var(--lemma-ink)' }} title={a.text}>
                {a.text}
              </span>
              <span className="text-[11px] whitespace-nowrap shrink-0" style={{ color: 'var(--lemma-mist)' }}>
                {whenLabel(a.at, today, locale)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
