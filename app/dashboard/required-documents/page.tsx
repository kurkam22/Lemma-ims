'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { DOC_SETS, docSetFor } from '@/lib/required-documents'

function SetupCompleteBanner() {
  const params = useSearchParams()
  if (params.get('setup') !== 'complete') return null
  return (
    <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3">
      <div className="text-sm font-semibold text-emerald-900">
        Setup complete — nice work. 🎉
      </div>
      <p className="text-xs text-emerald-800 mt-0.5">
        These are the documents your certification needs. You don&apos;t have to write
        them alone: pick the first one and let the AI draft it from what you just
        told us — most companies start with the <span className="font-medium">Quality policy</span>.
      </p>
    </div>
  )
}

function RequiredDocumentsInner() {
  const [standardId, setStandardId] = useState('iso-9001')
  const set = docSetFor(standardId)

  return (
    <div className="space-y-6 max-w-5xl">
      <Suspense fallback={null}>
        <SetupCompleteBanner />
      </Suspense>
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Required documents</h1>
        <p className="text-sm text-gray-500 mt-1">
          The documents your certification needs — in plain language, with the clause
          reference for your auditor. Create each one with AI or upload what you already have.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="std" className="text-sm text-gray-600">
          Standard:
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
          {set.docs.length} documents · explanations in our own words (clause numbers cited for reference)
        </span>
      </div>

      <div className="space-y-2">
        {set.docs.map((d, i) => (
          <div
            key={d.id}
            className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-400 w-6 shrink-0">{i + 1}.</span>
                <span className="text-sm font-medium text-gray-900">{d.title}</span>
                <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                  {d.clauseRef}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 sm:ml-8">{d.why}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 sm:ml-2">
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
        ))}
      </div>

      <p className="text-[11px] text-gray-400 leading-relaxed">
        This checklist reflects the documented information a certification audit typically
        expects. Exact needs can vary with your activities — the AI readiness check will
        flag anything specific to your company. AI drafts require human review before use.
      </p>
    </div>
  )
}

export default function RequiredDocumentsPage() {
  return <RequiredDocumentsInner />
}
