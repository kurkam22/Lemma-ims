'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PART_NAME, STATE_LABEL, nextStep, partOf, summarize, trailOf, type DocState, type ReqState } from '@/lib/requirements'

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

const DOC_LABEL: Record<DocState, string> = { approved: 'Approved', in_review: 'Waiting for approval', draft: 'Draft only', missing: 'Not written yet' }

function Mark({ ok, partial }: { ok: boolean; partial?: boolean }) {
  const col = ok ? 'var(--lemma-ok)' : partial ? 'var(--lemma-check)' : 'var(--lemma-danger)'
  return <span aria-hidden className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: col }} />
}

export default function RequirementBoard({ rows }: { rows: BoardRow[] }) {
  const firstToFix = rows.find((r) => r.state === 'needs' || r.state === 'partly') ?? rows[0]
  const [selected, setSelected] = useState<string | null>(firstToFix?.number ?? null)
  const sel = rows.find((r) => r.number === selected) ?? null

  const parts = Array.from(new Set(rows.map((r) => partOf(r.number))))
  const counts = summarize(rows.map((r) => r.state))

  const step = sel ? nextStep(sel.gap, sel.doc, sel.evidenceCount) : null
  const trail = sel ? trailOf(sel.gap, sel.doc, sel.evidenceCount) : null

  return (
    <div className="space-y-5">
      <div className="lemma-card p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-x-5 gap-y-6">
          {parts.map((p) => {
            const inPart = rows.filter((r) => partOf(r.number) === p)
            const ready = inPart.filter((r) => r.state === 'ready').length
            return (
              <div key={p}>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold leading-none" style={{ color: 'var(--lemma-ink)' }}>{p}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--lemma-ink)' }}>{PART_NAME[p] ?? ''}</span>
                </div>
                <div className="text-xs mt-1 mb-2.5" style={{ color: 'var(--lemma-slate)' }}>{ready} of {inPart.length} ready</div>
                <div className="grid grid-cols-2 gap-2">
                  {inPart.map((r) => {
                    const t = TILE[r.state]
                    const active = r.number === selected
                    return (
                      <button
                        key={r.number}
                        type="button"
                        onClick={() => setSelected(r.number)}
                        aria-pressed={active}
                        aria-label={`Requirement ${r.number}: ${STATE_LABEL[r.state]}`}
                        title={`${r.number} · ${STATE_LABEL[r.state]}`}
                        className="h-12 rounded-md text-sm font-semibold"
                        style={{
                          background: t.bg,
                          backgroundImage: t.image,
                          color: t.fg,
                          border: `1.5px solid ${t.border}`,
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <section className="lemma-card p-5" aria-label="Where you stand">
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lemma-ink)' }}>Where you stand</h2>
          <ul className="mt-3 space-y-2.5">
            {(Object.keys(STATE_LABEL) as ReqState[]).map((s) => (
              <li key={s} className="flex items-center gap-3 text-sm">
                <span
                  aria-hidden
                  className="w-[18px] h-[18px] rounded shrink-0"
                  style={{ background: TILE[s].bg, backgroundImage: TILE[s].image, border: `1.5px solid ${TILE[s].border}` }}
                />
                <span className="flex-1" style={{ color: 'var(--lemma-slate)' }}>{STATE_LABEL[s]}</span>
                <span className="font-semibold" style={{ color: 'var(--lemma-ink)' }}>{counts[s]}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] mt-3 leading-snug" style={{ color: 'var(--lemma-mist)' }}>
            Lemma’s own indicator from your answers, documents and evidence. It is not an ISO score and not an auditor’s finding.
          </p>
        </section>

        <section className="lemma-card p-5 lg:col-span-2" aria-live="polite" aria-label="Selected requirement">
          {sel && trail ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-2xl font-semibold" style={{ color: 'var(--lemma-ink)' }}>{sel.number}</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'var(--lemma-canvas)', color: 'var(--lemma-slate)', border: '1px solid var(--lemma-line)' }}>
                  {STATE_LABEL[sel.state]}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--lemma-ink)' }}>{sel.plain}</p>
              <p className="text-xs -mt-2" style={{ color: 'var(--lemma-mist)' }}>ISO 9001 clause {sel.number}</p>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="rounded-lg p-3" style={{ background: 'var(--lemma-canvas)' }}>
                  <div className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--lemma-slate)' }}>ANSWER</div>
                  <div className="text-sm font-medium mt-1"><Mark ok={trail.answer === 'done'} partial={false} />{trail.answer === 'done' ? 'You have told us how you do it' : trail.answer === 'gap' ? 'You marked this as a gap' : 'Not answered yet'}</div>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--lemma-canvas)' }}>
                  <div className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--lemma-slate)' }}>DOCUMENT</div>
                  <div className="text-sm font-medium mt-1"><Mark ok={trail.document === 'approved'} partial={trail.document === 'in_review' || trail.document === 'draft'} />{DOC_LABEL[trail.document]}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--lemma-slate)' }}>{sel.document}</div>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--lemma-canvas)' }}>
                  <div className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--lemma-slate)' }}>EVIDENCE</div>
                  <div className="text-sm font-medium mt-1"><Mark ok={trail.evidence > 0} />{trail.evidence > 0 ? `${trail.evidence} ${trail.evidence === 1 ? 'record' : 'records'} attached` : 'No records attached'}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--lemma-slate)' }}>{sel.evidence}</div>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold tracking-wide mb-1" style={{ color: 'var(--lemma-slate)' }}>AN AUDITOR MAY ASK</div>
                <p className="text-sm" style={{ color: 'var(--lemma-ink)' }}>{sel.auditorAsks}</p>
              </div>

              {step ? (
                <Link href={step.href} className="inline-block text-sm font-medium px-4 py-2 rounded-md" style={{ background: 'var(--lemma-primary)', color: '#fff' }}>
                  {step.label}
                </Link>
              ) : (
                <p className="text-sm" style={{ color: 'var(--lemma-ok)' }}>
                  {sel.state === 'na' ? 'Marked not applicable.' : 'Nothing left to do here.'}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--lemma-slate)' }}>Choose a square to see its trail.</p>
          )}
        </section>
      </div>
    </div>
  )
}
