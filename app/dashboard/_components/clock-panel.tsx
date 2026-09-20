'use client'

import Link from 'next/link'
import { dueLabel, formatDate } from '@/lib/attention'
import type { ClockModel } from '@/lib/certclock'
import { useT } from '@/lib/i18n/provider'
import CertificateClock, { LegendMarker } from '@/app/dashboard/_components/certificate-clock'

// The Certificate clock as a dashboard panel: the three rings, the next few
// events and a legend. Without a certificate it invites the person to enter
// the two dates.
export default function ClockPanel({
  model,
  expiresOn,
  today,
  sample = false,
}: {
  model: ClockModel | null
  expiresOn: string | null
  today: Date
  sample?: boolean
}) {
  const { t, locale } = useT()

  if (!model || !expiresOn) {
    return (
      <section className="lemma-card p-5" aria-label={t('clock.title')}>
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>{t('clock.empty.title')}</h2>
        <p className="text-sm mt-2 max-w-md" style={{ color: 'var(--lemma-slate)' }}>{t('clock.empty.text')}</p>
        <Link href="/dashboard/certification" className="inline-block mt-4 text-sm font-medium px-4 py-2 rounded-md" style={{ background: 'var(--lemma-primary)', color: '#fff' }}>
          {t('clock.empty.button')}
        </Link>
      </section>
    )
  }

  const upcoming = model.events.filter((e) => !e.done && e.daysLeft >= 0).slice(0, 3)

  return (
    <section className="lemma-card p-5" aria-label={t('clock.title')}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>{t('clock.title')}</h2>
        {!sample && (
          <Link href="/dashboard/certification" className="text-xs font-medium" style={{ color: 'var(--lemma-primary)' }}>
            {t('clock.manage')} ›
          </Link>
        )}
      </div>
      <p className="text-xs mt-0.5" style={{ color: 'var(--lemma-slate)' }}>
        {t('clock.ends', { date: formatDate(expiresOn, locale), days: model.daysToExpiry })}
      </p>

      <div className="mx-auto mt-2" style={{ maxWidth: 460 }}>
        <CertificateClock model={model} today={today} />
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs items-center mt-1" style={{ color: 'var(--lemma-slate)' }}>
        <span className="flex items-center gap-1.5"><LegendMarker kind="external" /> {t('clock.legend.external')}</span>
        <span className="flex items-center gap-1.5"><LegendMarker kind="internal" /> {t('clock.legend.internal')}</span>
        <span className="flex items-center gap-1.5"><LegendMarker kind="review" /> {t('clock.legend.review')}</span>
        <span>{t('clock.legend.note')}</span>
      </div>

      <div className="mt-4 rounded-lg overflow-hidden" style={{ border: '1px solid var(--lemma-line)' }}>
        <div className="px-4 py-2.5 text-sm font-semibold" style={{ color: 'var(--lemma-ink)' }}>{t('clock.comingUp')}</div>
        {upcoming.length === 0 ? (
          <p className="px-4 pb-3 text-sm" style={{ color: 'var(--lemma-slate)' }}>{t('clock.none')}</p>
        ) : (
          <ul>
            {upcoming.map((e, i) => (
              <li key={e.id} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: '1px solid var(--lemma-line)', background: i === 0 ? 'var(--lemma-check-soft)' : undefined }}>
                <LegendMarker kind={e.kind} done={false} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium truncate" style={{ color: 'var(--lemma-ink)' }}>{e.label}</span>
                  <span className="block text-xs truncate" style={{ color: 'var(--lemma-slate)' }}>{formatDate(e.date, locale)} · {e.sub}</span>
                </span>
                <span className="text-xs font-medium whitespace-nowrap" style={{ color: i === 0 ? 'var(--lemma-check)' : 'var(--lemma-slate)' }}>
                  {dueLabel(e.daysLeft, e.date, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
