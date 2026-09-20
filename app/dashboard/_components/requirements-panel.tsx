'use client'

import Link from 'next/link'
import { useT } from '@/lib/i18n/provider'
import RequirementBoard, { type BoardRow } from '@/app/dashboard/_components/requirement-board'

// The Requirements board as a dashboard panel.
export default function RequirementsPanel({ rows, sample = false }: { rows: BoardRow[]; sample?: boolean }) {
  const { t } = useT()
  const allNotStarted = rows.length > 0 && rows.every((r) => r.state === 'notstarted')
  return (
    <section className="lemma-card p-5" aria-label={t('req.title')}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 mb-4">
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>{t('req.title')}</h2>
        {!sample && (
          <Link href="/dashboard/requirements" className="text-xs font-medium" style={{ color: 'var(--lemma-primary)' }}>
            {t('req.open')} ›
          </Link>
        )}
      </div>
      {allNotStarted && !sample && (
        <div className="mb-4 px-4 py-3 rounded-md text-sm" style={{ background: 'var(--lemma-check-soft)', color: 'var(--lemma-check)' }}>
          {t('req.empty')}{' '}
          <Link href="/dashboard/gap-assessment" className="font-medium underline">{t('req.emptyLink')}</Link>
        </div>
      )}
      {rows.length > 0 && <RequirementBoard rows={rows} compact />}
    </section>
  )
}
