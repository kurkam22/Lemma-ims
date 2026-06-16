'use client'

import type { AiInsight } from '@/lib/demo-data'

const SEV: Record<AiInsight['severity'], { bg: string; fg: string; icon: string }> = {
  info: { bg: 'var(--lemma-plan-soft)', fg: 'var(--lemma-plan)', icon: 'i' },
  warning: { bg: 'var(--lemma-check-soft)', fg: 'var(--lemma-check)', icon: '!' },
  danger: { bg: 'var(--lemma-danger-soft)', fg: 'var(--lemma-danger)', icon: '!' },
}

const STAGE_LABEL: Record<AiInsight['stage'], string> = {
  plan: 'Plan',
  do: 'Do',
  check: 'Check',
  act: 'Act',
}

export default function AiInsights({ insights }: { insights: AiInsight[] }) {
  return (
    <div className="lemma-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold"
          style={{ background: 'var(--lemma-primary)', color: '#fff' }}
        >
          AI
        </span>
        <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>
          What Lemma AI noticed
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {insights.map((ins) => {
          const s = SEV[ins.severity]
          return (
            <div
              key={ins.title}
              className="rounded-xl p-3 flex gap-2.5"
              style={{ background: 'var(--lemma-surface)', border: '1px solid var(--lemma-line)' }}
            >
              <span
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0"
                style={{ background: s.bg, color: s.fg }}
              >
                {s.icon}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[13px] font-medium" style={{ color: 'var(--lemma-ink)' }}>
                    {ins.title}
                  </span>
                  <span
                    className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--lemma-canvas)', color: 'var(--lemma-mist)' }}
                  >
                    {STAGE_LABEL[ins.stage]}
                  </span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--lemma-slate)' }}>
                  {ins.detail}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
