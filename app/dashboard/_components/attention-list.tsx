'use client'

import Link from 'next/link'
import { useState } from 'react'
import { dueLabel, type AttentionItem, type Urgency } from '@/lib/attention'

const URGENCY_STYLE: Record<Urgency, { dot: string; chipBg: string; chipFg: string; label: string }> = {
  overdue: { dot: 'var(--lemma-danger)', chipBg: 'var(--lemma-danger-soft)', chipFg: 'var(--lemma-danger)', label: 'Overdue' },
  today: { dot: 'var(--lemma-danger)', chipBg: 'var(--lemma-danger-soft)', chipFg: 'var(--lemma-danger)', label: 'Due today' },
  soon: { dot: 'var(--lemma-check)', chipBg: 'var(--lemma-check-soft)', chipFg: 'var(--lemma-check)', label: 'This week' },
  open: { dot: 'var(--lemma-check)', chipBg: 'var(--lemma-check-soft)', chipFg: 'var(--lemma-check)', label: 'Needs a decision' },
  upcoming: { dot: 'var(--lemma-mist)', chipBg: 'var(--lemma-canvas)', chipFg: 'var(--lemma-slate)', label: 'Coming up' },
}

const VISIBLE = 6

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
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? items : items.slice(0, VISIBLE)
  const hidden = items.length - shown.length

  return (
    <section className="lemma-card" aria-labelledby="attention-heading">
      <div className="flex items-baseline justify-between px-5 pt-4 pb-3">
        <h2 id="attention-heading" className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>
          Needs your attention
        </h2>
        {items.length > 0 && (
          <span className="text-xs" style={{ color: 'var(--lemma-slate)' }}>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-5 pb-5">
          <p className="text-sm" style={{ color: 'var(--lemma-ink)' }}>
            Nothing needs your attention right now.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--lemma-slate)' }}>
            Deadlines, open actions and pending approvals will appear here as you add them.
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
          {shown.map((item, i) => {
            const s = URGENCY_STYLE[item.urgency]
            const primary = i === 0
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3"
                style={{ borderTop: '1px solid var(--lemma-line)' }}
              >
                <span
                  aria-hidden
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: s.dot }}
                />
                <div className="min-w-0 flex-1 basis-64">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--lemma-ink)' }}>
                      {item.title}
                    </span>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: s.chipBg, color: s.chipFg }}
                    >
                      {item.daysLeft !== null ? dueLabel(item.daysLeft, item.due) : s.label}
                    </span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--lemma-slate)' }}>
                    {item.detail}
                  </div>
                </div>
                <Link
                  href={item.href}
                  className="text-xs font-medium px-3 py-1.5 rounded-md shrink-0"
                  style={
                    primary
                      ? { background: 'var(--lemma-primary)', color: '#fff' }
                      : { border: '1px solid var(--lemma-line)', color: 'var(--lemma-primary)', background: 'var(--lemma-surface)' }
                  }
                >
                  {item.actionLabel}
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {hidden > 0 && (
        <div className="px-5 py-3" style={{ borderTop: '1px solid var(--lemma-line)' }}>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-xs font-medium"
            style={{ color: 'var(--lemma-primary)' }}
          >
            Show {hidden} more
          </button>
        </div>
      )}
      {showAll && items.length > VISIBLE && (
        <div className="px-5 py-3" style={{ borderTop: '1px solid var(--lemma-line)' }}>
          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="text-xs font-medium"
            style={{ color: 'var(--lemma-primary)' }}
          >
            Show fewer
          </button>
        </div>
      )}
    </section>
  )
}
