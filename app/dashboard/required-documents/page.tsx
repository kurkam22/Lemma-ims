'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  DOC_SETS,
  docSetFor,
  applicableDocs,
  excludedDocs,
  APPLICABILITY_QUESTIONS,
  EXCLUSION_REASONS,
  OBLIGATION_LABELS,
  type Applicability,
  type RequiredDoc,
} from '@/lib/required-documents'

function SetupCompleteBanner() {
  const params = useSearchParams()
  if (params.get('setup') !== 'complete') return null
  return (
    <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3">
      <div className="text-sm font-semibold text-emerald-900">Setup complete — nice work. 🎉</div>
      <p className="text-xs text-emerald-800 mt-0.5">
        These are the documents your certification needs. You don&apos;t have to write them alone:
        pick the first one and let the AI draft it from what you just told us — most companies start
        with the <span className="font-medium">quality promise (policy)</span>.
      </p>
    </div>
  )
}

function DocRow({ doc, index }: { doc: RequiredDoc; index: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 w-5 shrink-0">{index}.</span>
          <span className="text-sm font-medium text-gray-900">{doc.title}</span>
          {doc.isoTitle && <span className="text-[11px] text-gray-400">{doc.isoTitle}</span>}
          <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
            {doc.clauseRef}
          </span>
          {(() => {
            const o = OBLIGATION_LABELS[doc.obligation]
            const tone =
              o.tone === 'red'
                ? 'text-red-700 bg-red-50 border-red-200'
                : o.tone === 'blue'
                ? 'text-blue-700 bg-blue-50 border-blue-200'
                : 'text-gray-500 bg-gray-100 border-gray-200'
            return (
              <span
                title={o.hint}
                className={`text-[10px] font-medium border rounded px-1.5 py-0.5 ${tone}`}
              >
                {o.label}
              </span>
            )
          })()}
        </div>
        <p className="text-xs text-gray-500 mt-1 sm:ml-7">{doc.why}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/dashboard/documents/generator"
          className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md px-3 py-1.5"
        >
          Create with AI
        </Link>
        <Link
          href="/dashboard/documents/centre"
          className="text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md px-3 py-1.5"
        >
          Upload
        </Link>
      </div>
    </div>
  )
}

function RequiredDocumentsInner() {
  const [standardId, setStandardId] = useState('iso-9001')
  const [answers, setAnswers] = useState<Partial<Record<Applicability, boolean>>>({})
  const set = docSetFor(standardId)

  const shown = applicableDocs(set.docs, answers)
  const excluded = excludedDocs(set.docs, answers)
  const living = shown.filter((d) => d.kind === 'maintain')
  const records = shown.filter((d) => d.kind === 'retain')

  return (
    <div className="space-y-6 max-w-5xl">
      <Suspense fallback={null}>
        <SetupCompleteBanner />
      </Suspense>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">What you need to prepare</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your personal list — in plain words, with the official reference for your auditor.
          Answer the three questions below and we remove anything that doesn&apos;t apply to you.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="std" className="text-sm text-gray-600">
          Certificate:
        </label>
        <select
          id="std"
          value={standardId}
          onChange={(e) => setStandardId(e.target.value)}
          className="border border-gray-300 rounded-md text-sm px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {DOC_SETS.map((s) => (
            <option key={s.standardId} value={s.standardId}>
              {s.standardLabel}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400">
          {shown.length} items for you{excluded.length > 0 && ` · ${excluded.length} removed`}
        </span>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-800">
          Three questions — so we only ask for what your company actually needs
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          The standard lets you skip requirements that genuinely don&apos;t apply, as long as the
          reason is recorded. We write the reason for you.
        </p>
        <div className="mt-3 space-y-3">
          {APPLICABILITY_QUESTIONS.map((q) => (
            <div key={q.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1">
                <div className="text-sm text-gray-800">{q.question}</div>
                <div className="text-[11px] text-gray-400">{q.hint}</div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {[
                  { label: 'Yes', val: true },
                  { label: 'No', val: false },
                ].map((o) => {
                  const active = answers[q.id] === o.val
                  return (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.val }))}
                      className={`text-xs font-medium rounded-md px-3 py-1.5 border ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
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
      </div>

      <div>
        <div className="text-sm font-semibold text-gray-800">
          Documents to write and keep up to date
          <span className="font-normal text-gray-400 ml-2 text-xs">
            ({living.length}) — living documents you review and re-approve over time
          </span>
        </div>
        <div className="space-y-2 mt-2">
          {living.map((d, i) => (
            <DocRow key={d.id} doc={d} index={i + 1} />
          ))}
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold text-gray-800">
          Records to collect as you work
          <span className="font-normal text-gray-400 ml-2 text-xs">
            ({records.length}) — proof of what happened; you keep these, you don&apos;t rewrite them
          </span>
        </div>
        <div className="space-y-2 mt-2">
          {records.map((d, i) => (
            <DocRow key={d.id} doc={d} index={i + 1} />
          ))}
        </div>
      </div>

      {excluded.length > 0 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-4">
          <div className="text-sm font-semibold text-gray-700">
            Not required for you ({excluded.length})
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Based on your answers. Your auditor may ask why — this is the reason we record in your
            scope statement:
          </p>
          <ul className="mt-2 space-y-1.5">
            {excluded.map((d) => (
              <li key={d.id} className="text-xs text-gray-600">
                <span className="font-medium text-gray-800">{d.title}</span>{' '}
                <span className="text-gray-400">({d.clauseRef})</span>
                <div className="text-[11px] text-gray-500 italic ml-0.5">
                  {d.appliesIf ? EXCLUSION_REASONS[d.appliesIf] : ''}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-gray-400 leading-relaxed">
        This list reflects what a certification audit typically expects. The standard does not
        require you to copy its structure or its words — your documents can use your own language.
        AI drafts require human review before use.
      </p>
    </div>
  )
}

export default function RequiredDocumentsPage() {
  return <RequiredDocumentsInner />
}
