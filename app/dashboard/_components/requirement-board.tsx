'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useT } from '@/lib/i18n/provider'
import { PART_KEY, STATE_KEY, nextStep, partOf, summarize, trailOf, type DocState, type ReqState } from '@/lib/requirements'

export type BoardRow = {
  number: string
  plain: string
  title: string
  document: string
  evidence: string
  auditorAsks: string
  gap: string
  doc: DocState
  evidenceCount: number
  state: ReqState
}

const TILE: Record<ReqState, { bg: string; fg: string; border: string; image?: string }> = {
  ready: { bg: 'var(--lemma-do)', fg: '#ffffff', border: 'var(--lemma-do)' },
  partly: { bg: '#e0b04c', fg: 'var(--lemma-ink)', border: '#e0b04c' },
  needs: { bg: '#c4553f', fg: '#ffffff', border: '#c4553f' },
  na: {
    bg: '#eef1f6',
    fg: 'var(--lemma-slate)',
    border: '#a9b2c3',
    image: 'repeating-linear-gradient(45deg, transparent 0 4px, #c3cad8 4px 6px)',
  },
  notstarted: { bg: 'var(--lemma-surface)', fg: 'var(--lemma-slate)', border: '#b7c0d1' },
}

const DOC_KEY: Record<DocState, 'req.doc.approved' | 'req.doc.in_review' | 'req.doc.draft' | 'req.doc.missing'> = {
  approved: 'req.doc.approved',
  in_review: 'req.doc.in_review',
  draft: 'req.doc.draft',
  missing: 'req.doc.missing',
}

function Mark({ ok, partial }: { ok: boolean; partial?: boolean }) {
  const col = ok ? 'var(--lemma-ok)' : partial ? 'var(--lemma-check)' : 'var(--lemma-danger)'
  return <span aria-hidden className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: col }} />
}

function Swatch({ state }: { state: ReqState }) {
  return (
    <span
      aria-hidden
      className="w-[18px] h-[18px] rounded shrink-0 inline-block"
      style={{ background: TILE[state].bg, backgroundImage: TILE[state].image, border: `1.5px solid ${TILE[state].border}` }}
    />
  )
}

export default function RequirementBoard({ rows, compact = false }: { rows: BoardRow[]; compact?: boolean }) {
  const { t, tc } = useT()
  const firstToFix = rows.find((r) => r.state === 'needs' || r.state === 'partly') ?? rows[0]
  const [selected, setSelected] = useState<string | null>(firstToFix?.number ?? null)
  const sel = rows.find((r) => r.number === selected) ?? null

  const parts = Array.from(new Set(rows.map((r) => partOf(r.number))))
  const counts = summarize(rows.map((r) => r.state))
  const step = sel ? nextStep(sel.gap, sel.doc, sel.evidenceCount) : null
  const trail = sel ? trailOf(sel.gap, sel.doc, sel.evidenceCount) : null

  const partsGrid = (
    <div className={compact ? 'grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5' : 'grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-x-5 gap-y-6'}>
      {parts.map((p) => {
        const inPart = rows.filter((r) => partOf(r.number) === p)
        const ready = inPart.filter((r) => r.state === 'ready').length
        return (
          <div key={p}>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold leading-none" style={{ color: 'var(--lemma-ink)' }}>{p}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--lemma-ink)' }}>{PART_KEY[p] ? t(PART_KEY[p]) : ''}</span>
            </div>
            <div className="text-xs mt-1 mb-2.5" style={{ color: 'var(--lemma-slate)' }}>{t('req.readyOf', { ready, total: inPart.length })}</div>
            <div className="grid grid-cols-2 gap-2">
              {inPart.map((r) => {
                const tile = TILE[r.state]
                const active = r.number === selected
                return (
                  <button
                    key={r.number}
                    type="button"
                    onClick={() => setSelected(r.number)}
                    aria-pressed={active}
                    aria-label={t('req.aria', { n: r.number, state: t(STATE_KEY[r.state]) })}
                    title={`${r.number} · ${t(STATE_KEY[r.state])}`}
                    className={`${compact ? 'h-10' : 'h-12'} rounded-md text-sm font-semibold`}
                    style={{
                      background: tile.bg,
                      backgroundImage: tile.image,
                      color: tile.fg,
                      border: `1.5px solid ${tile.border}`,
                      outline: active ? '2.5px solid var(--lemma-ink)' : 'none',
                      outlineOffset: 2,
                    }}
                  >
                    {r.number}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )

  const detail =
    sel && trail ? (
      <div className="space-y-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl font-semibold" style={{ color: 'var(--lemma-ink)' }}>{sel.number}</span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'var(--lemma-canvas)', color: 'var(--lemma-slate)', border: '1px solid var(--lemma-line)' }}>
            {t(STATE_KEY[sel.state])}
          </span>
        </div>
        <p className="text-sm" style={{ color: 'var(--lemma-ink)' }}>{sel.plain}</p>
        <p className="text-xs -mt-2" style={{ color: 'var(--lemma-mist)' }}>{t('req.iso', { n: sel.number })}</p>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="rounded-lg p-3" style={{ background: 'var(--lemma-canvas)' }}>
            <div className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--lemma-slate)' }}>{t('req.answer')}</div>
            <div className="text-sm font-medium mt-1">
              <Mark ok={trail.answer === 'done'} />
              {trail.answer === 'done' ? t('req.answer.done') : trail.answer === 'gap' ? t('req.answer.gap') : t('req.answer.todo')}
            </div>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'var(--lemma-canvas)' }}>
            <div className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--lemma-slate)' }}>{t('req.document')}</div>
            <div className="text-sm font-medium mt-1">
              <Mark ok={trail.document === 'approved'} partial={trail.document === 'in_review' || trail.document === 'draft'} />
              {t(DOC_KEY[trail.document])}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--lemma-slate)' }}>{sel.document}</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'var(--lemma-canvas)' }}>
            <div className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--lemma-slate)' }}>{t('req.evidence')}</div>
            <div className="text-sm font-medium mt-1">
              <Mark ok={trail.evidence > 0} />
              {trail.evidence > 0 ? tc('req.ev.some', trail.evidence) : t('req.ev.none')}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--lemma-slate)' }}>{sel.evidence}</div>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold tracking-wide mb-1" style={{ color: 'var(--lemma-slate)' }}>{t('req.auditorMay')}</div>
          <p className="text-sm" style={{ color: 'var(--lemma-ink)' }}>{sel.auditorAsks}</p>
        </div>

        {step ? (
          <Link href={step.href} className="inline-block text-sm font-medium px-4 py-2 rounded-md" style={{ background: 'var(--lemma-primary)', color: '#fff' }}>
            {t(step.labelKey)}
          </Link>
        ) : (
          <p className="text-sm" style={{ color: 'var(--lemma-ok)' }}>{sel.state === 'na' ? t('req.na') : t('req.done')}</p>
        )}
      </div>
    ) : (
      <p className="text-sm" style={{ color: 'var(--lemma-slate)' }}>{t('req.choose')}</p>
    )

  if (compact) {
    return (
      <div className="space-y-5">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs" aria-label={t('card.stand')}>
          {(Object.keys(STATE_KEY) as ReqState[]).map((st) => (
            <li key={st} className="flex items-center gap-1.5" style={{ color: 'var(--lemma-slate)' }}>
              <Swatch state={st} />
              <span>{t(STATE_KEY[st])}</span>
              <span className="font-semibold" style={{ color: 'var(--lemma-ink)' }}>{counts[st]}</span>
            </li>
          ))}
        </ul>
        {partsGrid}
        <div className="rounded-lg p-4" style={{ border: '1px solid var(--lemma-line)' }} aria-live="polite">
          {detail}
        </div>
        <p className="text-[11px] leading-snug" style={{ color: 'var(--lemma-mist)' }}>{t('req.note')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="lemma-card p-5">{partsGrid}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <section className="lemma-card p-5" aria-label={t('card.stand')}>
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>{t('card.stand')}</h2>
          <ul className="mt-3 space-y-2.5">
            {(Object.keys(STATE_KEY) as ReqState[]).map((st) => (
              <li key={st} className="flex items-center gap-3 text-sm">
                <Swatch state={st} />
                <span className="flex-1" style={{ color: 'var(--lemma-slate)' }}>{t(STATE_KEY[st])}</span>
                <span className="font-semibold" style={{ color: 'var(--lemma-ink)' }}>{counts[st]}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] mt-3 leading-snug" style={{ color: 'var(--lemma-mist)' }}>{t('req.note')}</p>
        </section>
        <section className="lemma-card p-5 lg:col-span-2" aria-live="polite" aria-label={t('req.title')}>
          {detail}
        </section>
      </div>
    </div>
  )
}
