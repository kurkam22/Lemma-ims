'use client'

import type { JourneyStage } from '@/lib/demo-data'

const STAGE_VARS: Record<
  JourneyStage['key'],
  { color: string; soft: string }
> = {
  plan: { color: 'var(--lemma-plan)', soft: 'var(--lemma-plan-soft)' },
  do: { color: 'var(--lemma-do)', soft: 'var(--lemma-do-soft)' },
  check: { color: 'var(--lemma-check)', soft: 'var(--lemma-check-soft)' },
  act: { color: 'var(--lemma-act)', soft: 'var(--lemma-act-soft)' },
}

export default function CertificationJourney({
  stages,
  activeStage,
}: {
  stages: JourneyStage[]
  activeStage: JourneyStage['key']
}) {
  return (
    <div className="lemma-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>
            Certification journey
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--lemma-mist)' }}>
            Your ISO system runs as a continuous Plan · Do · Check · Act cycle
          </p>
        </div>
        <span
          className="text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{ background: 'var(--lemma-primary-soft)', color: 'var(--lemma-primary)' }}
        >
          Continuous improvement
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 relative">
        {stages.map((stage, i) => {
          const v = STAGE_VARS[stage.key]
          const isActive = stage.key === activeStage
          return (
            <div
              key={stage.key}
              className="relative rounded-xl p-3.5"
              style={{
                background: isActive ? v.soft : 'var(--lemma-canvas)',
                border: `1.5px solid ${isActive ? v.color : 'var(--lemma-line)'}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: v.color }}
                >
                  {i + 1}. {stage.label}
                </span>
                <span className="text-[13px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>
                  {stage.pct}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden mb-2.5"
                style={{ background: 'var(--lemma-line)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${stage.pct}%`, background: v.color }}
                />
              </div>
              <p className="text-[11px] mb-1.5" style={{ color: 'var(--lemma-slate)' }}>
                {stage.caption}
              </p>
              <ul className="space-y-0.5">
                {stage.tasks.map((t) => (
                  <li
                    key={t}
                    className="text-[11px] flex items-start gap-1"
                    style={{ color: 'var(--lemma-mist)' }}
                  >
                    <span style={{ color: v.color }}>·</span>
                    {t}
                  </li>
                ))}
              </ul>
              {isActive && (
                <div
                  className="absolute -top-2 right-3 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: v.color, color: '#fff' }}
                >
                  you are here
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div
        className="flex items-center justify-center gap-1.5 mt-3 text-[11px]"
        style={{ color: 'var(--lemma-mist)' }}
      >
        Plan <span>→</span> Do <span>→</span> Check <span>→</span> Act{' '}
        <span style={{ color: 'var(--lemma-slate)', fontWeight: 500 }}>→ repeat</span>
      </div>
    </div>
  )
}
