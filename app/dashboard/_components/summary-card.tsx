import { READINESS_DISCLAIMER } from '@/lib/readiness'

// A compact "where you stand" card that sits beside the attention list,
// so the top of the dashboard is short instead of a tall stack of blocks.
export default function SummaryCard({
  readinessPct,
  documentsReady,
  evidenceConfirmed,
  openCapas,
}: {
  readinessPct: number
  documentsReady: number
  evidenceConfirmed: number
  openCapas: number
}) {
  const rows: [string, number][] = [
    ['Documents approved', documentsReady],
    ['Evidence confirmed', evidenceConfirmed],
    ['Open corrective actions', openCapas],
  ]
  return (
    <section className="lemma-card p-5 flex flex-col" aria-label="Where you stand">
      <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>
        Where you stand
      </h2>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-4xl font-semibold tracking-tight" style={{ color: 'var(--lemma-primary)' }}>
          {readinessPct}%
        </span>
        <span className="text-xs" style={{ color: 'var(--lemma-slate)' }}>
          readiness
        </span>
      </div>
      <p className="text-[11px] leading-snug mt-1" style={{ color: 'var(--lemma-mist)' }}>
        {READINESS_DISCLAIMER}
      </p>
      <dl className="mt-4">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between py-2 text-sm"
            style={{ borderTop: '1px solid var(--lemma-line)' }}
          >
            <dt style={{ color: 'var(--lemma-slate)' }}>{label}</dt>
            <dd className="font-semibold" style={{ color: 'var(--lemma-ink)' }}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
