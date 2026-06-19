'use client'

import { useState } from 'react'
import {
  AUDITOR_CRITERIA,
  AUDITOR_RED_FLAGS,
  AUDITOR_CHECKLIST,
  VERIFY_LINKS,
} from '@/lib/auditor-guide'

type Answer = 'yes' | 'no' | 'unsure'

const WEIGHT_STYLE = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  important: 'bg-amber-50 text-amber-700 border-amber-200',
  helpful: 'bg-gray-50 text-gray-600 border-gray-200',
} as const

export default function ChooseAuditorPage() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({})

  function set(id: string, a: Answer) {
    setAnswers((prev) => ({ ...prev, [id]: a }))
  }

  const criticalItems = AUDITOR_CHECKLIST.filter((q) => q.critical)
  const criticalPassed = criticalItems.filter((q) => answers[q.id] === 'yes').length
  const anyCriticalFail = criticalItems.some(
    (q) => answers[q.id] === 'no' || answers[q.id] === 'unsure'
  )
  const allAnswered = AUDITOR_CHECKLIST.every((q) => answers[q.id])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Audit &amp; certification guide</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          How to pick a certification body that issues a certificate your customers
          and tenders will actually accept. The certification body is the
          independent auditor — separate from any consultant who helped you prepare.
        </p>
      </div>

      {/* Criteria */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          What to check
        </h2>
        <div className="space-y-2">
          {AUDITOR_CRITERIA.map((c) => (
            <div key={c.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-gray-900">{c.title}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full border ${WEIGHT_STYLE[c.weight]}`}
                >
                  {c.weight}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                <span className="font-medium text-gray-700">Why: </span>
                {c.why}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                <span className="font-medium text-gray-700">Check: </span>
                {c.whatToCheck}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive checklist */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Evaluate a specific body
        </h2>
        <div className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
          {AUDITOR_CHECKLIST.map((q) => (
            <div key={q.id} className="p-3 flex items-center justify-between gap-3">
              <span className="text-sm text-gray-700">
                {q.question}
                {q.critical && <span className="text-red-500 ml-1">*</span>}
              </span>
              <div className="flex gap-1 shrink-0">
                {(['yes', 'no', 'unsure'] as Answer[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => set(q.id, a)}
                    className={`text-xs px-2 py-1 rounded border ${
                      answers[q.id] === a
                        ? a === 'yes'
                          ? 'bg-green-600 border-green-600 text-white'
                          : a === 'no'
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'bg-gray-500 border-gray-500 text-white'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {a === 'yes' ? 'Yes' : a === 'no' ? 'No' : '?'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400">* critical — a No or Unsure here is a stop sign.</p>

        {allAnswered && (
          <div
            className={`rounded-lg border p-4 ${
              anyCriticalFail
                ? 'bg-red-50 border-red-200'
                : 'bg-green-50 border-green-200'
            }`}
          >
            <div className="text-sm font-medium">
              {anyCriticalFail
                ? '⚠ Not recommended yet'
                : '✓ This body passes the critical checks'}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {anyCriticalFail
                ? `Resolve every critical item before proceeding. Passed ${criticalPassed} of ${criticalItems.length} critical checks.`
                : 'All critical checks passed. Compare on price/days, sector experience, and logistics before deciding.'}
            </p>
          </div>
        )}
      </section>

      {/* Red flags */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Red flags
        </h2>
        <ul className="border border-gray-200 rounded-lg bg-white divide-y divide-gray-100">
          {AUDITOR_RED_FLAGS.map((f, i) => (
            <li key={i} className="p-3 text-sm text-gray-700 flex gap-2">
              <span className="text-red-500">•</span>
              {f}
            </li>
          ))}
        </ul>
      </section>

      {/* Verify */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Verify accreditation
        </h2>
        {VERIFY_LINKS.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50"
          >
            <div className="text-sm font-medium text-blue-700">{l.label} ↗</div>
            <p className="text-xs text-gray-600 mt-0.5">{l.note}</p>
          </a>
        ))}
        <p className="text-[11px] text-gray-400">
          Note: this is general guidance, not legal advice. Accreditation oversight
          moved from IAF/ILAC to Global Accreditation Cooperation (Global ACI) in 2026;
          CertSearch remains the practical verification tool.
        </p>
      </section>
    </div>
  )
}
