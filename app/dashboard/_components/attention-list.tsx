'use client'

import Link from 'next/link'
import { useState } from 'react'
import { dueLabel, type AttentionItem, type Urgency } from '@/lib/attention'
import { useT } from '@/lib/i18n/provider'

const URGENCY_STYLE: Record<Urgency, { dot: string; chipBg: string; chipFg: string; labelKey: 'att.chip.overdue' | 'att.chip.today' | 'att.chip.soon' | 'att.chip.open' | 'att.chip.upcoming' }> = {
  overdue: { dot: 'var(--lemma-danger)', chipBg: 'var(--lemma-danger-soft)', chipFg: 'var(--lemma-danger)', labelKey: 'att.chip.overdue' },
  today: { dot: 'var(--lemma-danger)', chipBg: 'var(--lemma-danger-soft)', chipFg: 'var(--lemma-danger)', labelKey: 'att.chip.today' },
  soon: { dot: 'var(--lemma-check)', chipBg: 'var(--lemma-check-soft)', chipFg: 'var(--lemma-check)', labelKey: 'att.chip.soon' },
  open: { dot: 'var(--lemma-check)', chipBg: 'var(--lemma-check-soft)', chipFg: 'var(--lemma-check)', labelKey: 'att.chip.open' },
  upcoming: { dot: 'var(--lemma-mist)', chipBg: 'var(--lemma-canvas)', chipFg: 'var(--lemma-slate)', labelKey: 'att.chip.upcoming' },
}

const VISIBLE = 4

function summary(items: AttentionItem[], t: (key: 'att.sum.urgent' | 'att.sum.week' | 'att.sum.decide' | 'att.sum.later', p: { count: number }) => string): { text: string; tone: 'danger' | 'normal' }[] {
  const overdue = items.filter((i) => i.urgency === 'overdue' || i.urgency === 'today').length
  const week = items.filter((i) => i.urgency === 'soon').length
  const decide = items.filter((i) => i.urgency === 'open').length
  const later = items.filter((i) => i.urgency === 'upcoming').length
  const out: { text: string; tone: 'danger' | 'normal' }[] = []
  if (overdue) out.push({ text: t('att.sum.urgent', { count: overdue }), tone: 'danger' })
  if (week) out.push({ text: t('att.sum.week', { count: week }), tone: 'normal' })
  if (decide) out.push({ text: t('att.sum.decide', { count: decide }), tone: 'normal' })
  if (later) out.push({ text: t('att.sum.later', { count: later }), tone: 'normal' })
  return out
}

export default function AttentionList({
  items,
  emptyHref,
  emptyLabel,
}: {
  items: AttentionItem[]
  /** Where the empty state sends the person. */
  emptyHref: string
  emptyLabel: string
}) {
  const { t, locale } = useT()
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? items : items.slice(0, VISIBLE)
  const hidden = items.length - shown.length
  const counts = summary(items, t)

  return (
    <section className="lemma-card overflow-hidden" aria-labelledby="attention-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-4 pb-3">
        <h2 id="attention-heading" className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>
          {t('att.title')}
        </h2>
        {counts.length > 0 && (
          <p className="text-xs" style={{ color: 'var(--lemma-slate)' }}>
            {counts.map((c, i) => (
              <span key={c.text}>
                {i > 0 && ' · '}
                <span style={c.tone === 'danger' ? { color: 'var(--lemma-danger)', fontWeight: 600 } : undefined}>{c.text}</span>
              </span>
            ))}
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-5 pb-5">
          <p className="text-sm" style={{ color: 'var(--lemma-ink)' }}>
            {t('att.empty')}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--lemma-slate)' }}>
            {t('att.empty2')}
          </p>
          <Link
            href={emptyHref}
            className="inline-block mt-3 text-xs font-medium px-3 py-1.5 rounded-md"
            style={{ background: 'var(--lemma-primary)', color: '#fff' }}
          >
            {emptyLabel}
          </Link>
        </div>
      ) : (
        <ul>
          {shown.map((item) => {
            const s = URGENCY_STYLE[item.urgency]
            const chip = item.daysLeft !== null ? dueLabel(item.daysLeft, item.due, locale) : t(s.labelKey)
            return (
              <li key={item.id} style={{ borderTop: '1px solid var(--lemma-line)' }}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50"
                  aria-label={`${item.title}. ${chip}. ${item.actionLabel}`}
                >
                  <span aria-hidden className="w-2 h-2 rounded-full shrink-0" style={{ background: s.dot }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium" style={{ color: 'var(--lemma-ink)' }} title={item.title}>
                      {item.title}
                    </span>
                    <span className="block truncate text-xs" style={{ color: 'var(--lemma-slate)' }}>
                      <span className="sm:hidden font-medium" style={{ color: s.chipFg }}>
                        {chip} ·{' '}
                      </span>
                      {item.detail}
                    </span>
                  </span>
                  <span
                    className="hidden sm:inline text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                    style={{ background: s.chipBg, color: s.chipFg }}
                  >
                    {chip}
                  </span>
                  <span className="text-xs font-medium whitespace-nowrap shrink-0" style={{ color: 'var(--lemma-primary)' }}>
                    <span className="hidden md:inline">{item.actionLabel} </span>›
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {items.length > VISIBLE && (
        <div className="px-5 py-2.5" style={{ borderTop: '1px solid var(--lemma-line)' }}>
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-medium"
            style={{ color: 'var(--lemma-primary)' }}
          >
            {showAll ? t('att.showFewer') : t('att.showMore', { count: hidden })}
          </button>
        </div>
      )}
    </section>
  )
}
