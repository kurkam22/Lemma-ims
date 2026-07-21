'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ISO9001_CLAUSES,
  GROUP_LABELS,
  OBLIGATION_META,
  applicableClauses,
  type Clause,
  type Applicability,
} from '@/lib/iso9001-framework'

const GROUP_ORDER: Clause['group'][] = [
  'context',
  'leadership',
  'planning',
  'support',
  'operation',
  'evaluation',
  'improvement',
]

const APPLIC_QS: { id: Applicability; q: string; hint: string }[] = [
  { id: 'if-design', q: 'Do you design your own products or services?', hint: 'If you work to customer drawings or fixed recipes, answer no.' },
  { id: 'if-measuring', q: 'Do you use measuring equipment to decide pass/fail?', hint: 'Scales, gauges, thermometers, testers.' },
  { id: 'if-customer-property', q: 'Do you hold anything belonging to customers?', hint: 'Their materials, tools, or data.' },
]

export default function GuidedBuildPage() {
  const [answers, setAnswers] = useState<Partial<Record<Applicability, boolean>>>({})
  const [open, setOpen] = useState<string | null>('4.1')

  const shown = applicableClauses(answers)
  const shownIds = new Set(shown.map((c) => c.id))
  const totalDocs = shown.reduce((n, c) => n + c.documents.length, 0)
  const requiredDocs = shown
    .flatMap((c) => c.documents)
    .filter((d) => d.obligation.startsWith('required')).length

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Build your quality system, step by step</h1>
        <p className="text-sm text-gray-500 mt-1">
          The whole of ISO 9001 in plain language, in the order you actually do it. Each step shows
          what it means, the questions to answer, and whether ISO truly requires a document — or it&apos;s
          just recommended.
        </p>
      </div>

      {/* Scale-to-company questions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-800">First, three questions so we only show what applies to you</div>
        <div className="mt-3 space-y-3">
          {APPLIC_QS.map((q) => (
            <div key={q.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1">
                <div className="text-sm text-gray-800">{q.q}</div>
                <div className="text-[11px] text-gray-400">{q.hint}</div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {[{ label: 'Yes', v: true }, { label: 'No', v: false }].map((o) => {
                  const active = answers[q.id] === o.v
                  return (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.v }))}
                      className={`text-xs font-medium rounded-md px-3 py-1.5 border ${
                        active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {o.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-500">
          Your plan: <span className="font-semibold text-gray-800">{shown.length} steps</span> ·{' '}
          <span className="font-semibold text-gray-800">{totalDocs} documents</span> ({requiredDocs} required by ISO, {totalDocs - requiredDocs} recommended)
        </div>
      </div>

      {/* Clause groups */}
      {GROUP_ORDER.map((group) => {
        const clauses = ISO9001_CLAUSES.filter((c) => c.group === group && shownIds.has(c.id))
        if (clauses.length === 0) return null
        return (
          <div key={group}>
            <div className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">
              {GROUP_LABELS[group]}
            </div>
            <div className="space-y-2">
              {clauses.map((c) => (
                <ClauseCard key={c.id} clause={c} open={open === c.id} onToggle={() => setOpen(open === c.id ? null : c.id)} />
              ))}
            </div>
          </div>
        )
      })}

      <p className="text-[11px] text-gray-400 leading-relaxed">
        This walkthrough reflects what a certification audit typically expects. The standard does not
        require you to copy its structure or wording — your documents can use your own language. AI
        drafts require human review before use, and this readiness view is Lemma&apos;s own indicator,
        not an ISO or certification-body score.
      </p>
    </div>
  )
}

function ObligationBadge({ obligation }: { obligation: Clause['documents'][number]['obligation'] }) {
  const meta = OBLIGATION_META[obligation]
  const tone =
    meta.tone === 'red'
      ? 'text-red-700 bg-red-50 border-red-200'
      : meta.tone === 'blue'
      ? 'text-blue-700 bg-blue-50 border-blue-200'
      : 'text-gray-500 bg-gray-100 border-gray-200'
  return <span className={`text-[10px] font-medium border rounded px-1.5 py-0.5 ${tone}`}>{meta.label}</span>
}

function ClauseCard({ clause, open, onToggle }: { clause: Clause; open: boolean; onToggle: () => void }) {
  const modeLabel =
    clause.mode === 'behaviour'
      ? 'Show it (no document)'
      : clause.mode === 'assembly'
      ? 'Assembled from your data'
      : 'Produces a document'

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
        aria-expanded={open}
      >
        <span className="text-[11px] font-mono text-gray-400 w-8 shrink-0">{clause.id}</span>
        <span className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900">{clause.title}</span>
          <span className="text-[11px] text-gray-400 ml-2">{clause.isoTitle}</span>
        </span>
        <span className="text-[10px] text-gray-400 shrink-0 hidden sm:inline">{modeLabel}</span>
        <span className="text-gray-400 shrink-0">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100">
          <p className="text-sm text-gray-600 mt-2">{clause.plainIntro}</p>

          {clause.honestNote && (
            <div className="mt-2 text-xs text-blue-800 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
              {clause.honestNote}
            </div>
          )}

          {/* Questions */}
          {clause.questions.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-semibold text-gray-700 mb-1.5">Questions to answer</div>
              <ul className="space-y-1.5">
                {clause.questions.map((q) => (
                  <li key={q.id} className="text-xs text-gray-600 flex gap-2">
                    <span className="text-blue-500 shrink-0">•</span>
                    <span>
                      {q.q}
                      {q.aiResearch && (
                        <span className="text-[10px] text-emerald-600 ml-1">(AI can suggest — you confirm)</span>
                      )}
                      {q.hint && <span className="block text-[11px] text-gray-400">{q.hint}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Documents */}
          {clause.documents.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-semibold text-gray-700 mb-1.5">What this produces</div>
              <div className="space-y-1.5">
                {clause.documents.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-medium text-gray-800">{d.title}</span>
                    <ObligationBadge obligation={d.obligation} />
                    <span className="text-[10px] text-gray-400">
                      {d.kind === 'maintain' ? 'keep updated' : 'record'} · {d.formats.join('/').toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {clause.documents.length > 0 && (
              <Link
                href="/dashboard/documents/generator"
                className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md px-3 py-1.5"
              >
                Create with AI
              </Link>
            )}
            <Link
              href="/dashboard/required-documents"
              className="text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md px-3 py-1.5"
            >
              See all documents
            </Link>
          </div>

          {clause.uploadSuggestions.length > 0 && (
            <div className="mt-3 text-[11px] text-gray-400">
              You can upload: {clause.uploadSuggestions.join(' · ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
