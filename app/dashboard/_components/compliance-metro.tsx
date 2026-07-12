'use client'

import { useState } from 'react'
import {
  PHASE_META, STOP_LETTERS, STATUS_COLORS,
  type MetroClause, type MetroPhase, type MetroStatus,
} from '@/lib/metro-data'

// ── Layout constants ────────────────────────────────────────────────
const VIEW_W = 920
const VIEW_H = 560
const TRACK_X0 = 96
const TRACK_X1 = 812
const LINE_Y: Record<MetroPhase, number> = { plan: 104, do: 218, check: 332, act: 446 }
const PHASE_PCT: Record<MetroPhase, number> = { plan: 90, do: 71, check: 48, act: 25 }

// Station x-positions per phase (spread along the line)
const STATION_X: Record<string, number> = {
  '4': 180, '5': 336, '6': 492, // plan
  '7': 260, '8': 470, // do
  '9': 356, // check
  '10': 316, // act
}

const BRANCH_STEP = 44 // px between branch stops (45° diagonal)

function StatusMarker({ cx, cy, status }: { cx: number; cy: number; status: MetroStatus }) {
  const c = STATUS_COLORS[status]
  if (status === 'done') return <circle cx={cx} cy={cy} r={7} fill={c} />
  if (status === 'progress')
    return (
      <g>
        <circle cx={cx} cy={cy} r={7} fill="#fff" stroke={c} strokeWidth={1.5} />
        <path d={`M ${cx - 7} ${cy} A 7 7 0 0 1 ${cx + 7} ${cy} Z`} fill={c} />
      </g>
    )
  return <circle cx={cx} cy={cy} r={7} fill="#fff" stroke={c} strokeWidth={2} strokeDasharray="3 2.5" />
}

export default function ComplianceMetro({
  clauses,
  standardLabel = 'ISO 9001:2015',
}: {
  clauses: MetroClause[]
  standardLabel?: string
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const sel = clauses.find((c) => c.clause === selected) ?? null
  const dimmed = (clause: string) => selected !== null && selected !== clause

  return (
    <div className="lemma-card bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Compliance metro map</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Your certification as a transit map: each requirement is a station on its
            Plan–Do–Check–Act line. Tap a station to trace its route — document,
            evidence, audit, corrective action.
          </p>
        </div>
        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
          {standardLabel}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto select-none"
        role="img"
        aria-label="Compliance metro map: requirement stations on Plan, Do, Check and Act lines"
      >
        <defs>
          <marker id="metro-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M1 1 L8 5 L1 9" fill="none" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {/* Continual-improvement loop: Act curves back up to Plan */}
        <path
          d={`M ${TRACK_X1} ${LINE_Y.act} C ${TRACK_X1 + 88} ${LINE_Y.act}, ${TRACK_X1 + 88} ${LINE_Y.plan}, ${TRACK_X1 + 6} ${LINE_Y.plan}`}
          fill="none" stroke="#9ca3af" strokeWidth={2.5} strokeDasharray="6 6" markerEnd="url(#metro-arrow)"
          opacity={selected ? 0.25 : 0.9}
        />
        <text x={TRACK_X1 + 76} y={(LINE_Y.plan + LINE_Y.act) / 2} fontSize={10} fill="#6b7280"
          textAnchor="middle" transform={`rotate(90 ${TRACK_X1 + 76} ${(LINE_Y.plan + LINE_Y.act) / 2})`}
          opacity={selected ? 0.25 : 1}>
          repeat · continual improvement
        </text>

        {/* Lines (tracks) */}
        {(Object.keys(LINE_Y) as MetroPhase[]).map((phase) => {
          const y = LINE_Y[phase]
          const meta = PHASE_META[phase]
          const lineDim = selected !== null && !clauses.some((c) => c.phase === phase && c.clause === selected)
          return (
            <g key={phase} opacity={lineDim ? 0.28 : 1} style={{ transition: 'opacity .25s' }}>
              <line x1={TRACK_X0} y1={y} x2={TRACK_X1} y2={y} stroke={meta.color} strokeWidth={9} strokeLinecap="round" />
              {/* line badge */}
              <rect x={16} y={y - 13} width={64} height={26} rx={13} fill={meta.color} />
              <text x={48} y={y - 1} fontSize={10.5} fontWeight={700} fill="#fff" textAnchor="middle">{meta.label}</text>
              <text x={48} y={y + 9} fontSize={8.5} fill="#fff" textAnchor="middle" opacity={0.9}>{PHASE_PCT[phase]}%</text>
            </g>
          )
        })}

        {/* Stations + branches */}
        {clauses.map((c) => {
          const x = STATION_X[c.clause] ?? TRACK_X0 + 100
          const y = LINE_Y[c.phase]
          const meta = PHASE_META[c.phase]
          const isSel = selected === c.clause
          return (
            <g
              key={c.clause}
              opacity={dimmed(c.clause) ? 0.22 : 1}
              style={{ transition: 'opacity .25s', cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              aria-pressed={isSel}
              aria-label={`Clause ${c.clause} — ${c.title}`}
              onClick={() => setSelected(isSel ? null : c.clause)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelected(isSel ? null : c.clause)
                }
              }}
            >
              {/* Branch with stops (trace route); Act line branches upward to stay in-canvas */}
              {c.stops && c.stops.length > 0 && (
                <g>
                  {(() => {
                    const dir = c.phase === 'act' ? -1 : 1
                    return (
                      <>
                        <line
                          x1={x} y1={y}
                          x2={x + BRANCH_STEP * c.stops.length * 0.7071}
                          y2={y + dir * BRANCH_STEP * c.stops.length * 0.7071}
                          stroke={meta.color} strokeWidth={3} opacity={0.45} strokeLinecap="round"
                        />
                        {c.stops.map((s, i) => {
                          const sx = x + BRANCH_STEP * (i + 1) * 0.7071
                          const sy = y + dir * BRANCH_STEP * (i + 1) * 0.7071
                          return (
                            <g key={s.kind}>
                              <circle cx={sx} cy={sy} r={9} fill="#fff" stroke={STATUS_COLORS[s.status]} strokeWidth={2}
                                strokeDasharray={s.status === 'missing' ? '3 2.5' : undefined} />
                              {s.status === 'done' && <circle cx={sx} cy={sy} r={5} fill={STATUS_COLORS.done} />}
                              {s.status === 'progress' && (
                                <path d={`M ${sx - 5} ${sy} A 5 5 0 0 1 ${sx + 5} ${sy} Z`} fill={STATUS_COLORS.progress} />
                              )}
                              <text x={sx} y={dir === 1 ? sy - 12 : sy + 18} fontSize={8.5} fontWeight={700} fill="#374151" textAnchor="middle">
                                {STOP_LETTERS[s.kind]}
                              </text>
                            </g>
                          )
                        })}
                      </>
                    )
                  })()}
                </g>
              )}

              {/* Station */}
              <circle cx={x} cy={y} r={isSel ? 15 : 13} fill="#fff" stroke={meta.color} strokeWidth={3.5}
                style={{ transition: 'r .15s' }} />
              <StatusMarker cx={x} cy={y} status={c.status} />
              {/* Clause number above, name below */}
              <text x={x} y={y - 22} fontSize={11} fontWeight={700} fill={meta.color} textAnchor="middle">
                {c.clause}
              </text>
              <text x={x} y={y + 30} fontSize={10} fontWeight={isSel ? 700 : 500} fill="#374151" textAnchor="middle">
                {c.title}
              </text>
            </g>
          )
        })}

        {/* Legend */}
        <g transform={`translate(${TRACK_X0}, ${VIEW_H - 34})`} opacity={selected ? 0.35 : 1}>
          <circle cx={6} cy={0} r={6} fill={STATUS_COLORS.done} />
          <text x={17} y={3.5} fontSize={9.5} fill="#4b5563">done</text>
          <g transform="translate(66,0)">
            <circle cx={6} cy={0} r={6} fill="#fff" stroke={STATUS_COLORS.progress} strokeWidth={1.5} />
            <path d="M 0 0 A 6 6 0 0 1 12 0 Z" fill={STATUS_COLORS.progress} />
            <text x={17} y={3.5} fontSize={9.5} fill="#4b5563">in progress</text>
          </g>
          <g transform="translate(160,0)">
            <circle cx={6} cy={0} r={6} fill="#fff" stroke={STATUS_COLORS.missing} strokeWidth={2} strokeDasharray="3 2.5" />
            <text x={17} y={3.5} fontSize={9.5} fill="#4b5563">missing</text>
          </g>
          <text x={244} y={3.5} fontSize={9.5} fill="#6b7280">
            branch stops: D document · E evidence · A audit · C corrective action
          </text>
        </g>
      </svg>

      {/* Trace panel */}
      {sel && (
        <div className="mt-3 border border-gray-200 rounded-lg p-4"
          style={{ background: PHASE_META[sel.phase].soft }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-white rounded-full px-2 py-0.5"
              style={{ background: PHASE_META[sel.phase].color }}>
              {PHASE_META[sel.phase].label} · clause {sel.clause}
            </span>
            <span className="text-sm font-semibold text-gray-900">{sel.title}</span>
          </div>
          {sel.requirement && (
            <p className="text-xs text-gray-700 mt-2"><span className="font-medium">Requirement:</span> {sel.requirement}</p>
          )}
          {sel.answer && (
            <p className="text-xs text-gray-700 mt-1"><span className="font-medium">Your answer:</span> {sel.answer}</p>
          )}
          {sel.stops && sel.stops.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {sel.stops.map((s) => (
                <span key={s.kind}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white border rounded-full px-2.5 py-1"
                  style={{ borderColor: STATUS_COLORS[s.status], color: STATUS_COLORS[s.status] }}>
                  <span className="font-bold">{STOP_LETTERS[s.kind]}</span> {s.label}
                </span>
              ))}
            </div>
          )}
          <button type="button" onClick={() => setSelected(null)}
            className="mt-3 text-[11px] font-medium text-gray-500 hover:text-gray-800">
            Close trace
          </button>
        </div>
      )}

      <p className="text-[10px] text-gray-400 mt-3">
        When a company runs several standards, shared requirements become transfer
        stations where lines cross — one station serving two certifications at once.
      </p>
    </div>
  )
}
