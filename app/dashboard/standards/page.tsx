'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { STANDARDS, type Standard, type Clause } from '@/lib/iso-clauses'

type Tab = 'all' | 'iso9001' | 'iso14001' | 'iso45001'

export default function StandardsPage() {
  const [statusMap, setStatusMap] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [activeStandard, setActiveStandard] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [expandedStandards, setExpandedStandards] = useState<Set<string>>(new Set(['iso9001']))
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data: userRow } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle()
      if (!userRow?.company_id) {
        setLoading(false)
        return
      }
      const { data: gaps } = await supabase
        .from('gap_answers')
        .select('clause_id, status')
        .eq('company_id', userRow.company_id)
      if (cancelled) return
      const map = new Map<string, string>()
      ;(gaps ?? []).forEach((g) => {
        if (g.clause_id) map.set(g.clause_id, g.status)
      })
      setStatusMap(map)
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (query.trim()) {
      const ids = STANDARDS.filter((s) => filterClauses(s.clauses, query).length > 0).map(
        (s) => s.shortCode
      )
      setExpandedStandards(new Set(ids))
    }
  }, [query])

  const visibleStandards = STANDARDS.filter(
    (s) => activeStandard === 'all' || s.shortCode === activeStandard
  )

  function toggleStandard(code: string) {
    setExpandedStandards((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  function toggleClause(num: string) {
    setExpandedClauses((prev) => {
      const next = new Set(prev)
      if (next.has(num)) next.delete(num)
      else next.add(num)
      return next
    })
  }

  function readinessPct(s: Standard): number | null {
    if (s.clauses.length === 0) return null
    const ready = s.clauses.filter((c) => {
      const st = statusMap.get(c.number)
      return st === 'compliant' || st === 'user_confirmed'
    }).length
    return Math.round((ready / s.clauses.length) * 100)
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading…</div>
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Standards library</h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse ISO requirements, see where you stand, and jump straight to the work.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-900 flex gap-3 items-start">
        <svg
          className="w-5 h-5 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <p className="font-medium">What is this page?</p>
          <p className="text-blue-800 mt-0.5">
            Each ISO standard is a list of clauses you need to meet. Expand a clause to see
            what document and evidence is required, and what an auditor will likely ask.
            Status comes from your gap assessment.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-md p-1">
          {(
            [
              ['all', 'All standards'],
              ['iso9001', 'ISO 9001'],
              ['iso14001', 'ISO 14001'],
              ['iso45001', 'ISO 45001'],
            ] as const
          ).map(([code, label]) => (
            <button
              key={code}
              type="button"
              onClick={() => setActiveStandard(code)}
              className={`px-3 py-1.5 text-xs font-medium rounded ${
                activeStandard === code
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clauses…"
            className="pl-9 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-64"
          />
        </div>
      </div>

      <div className="space-y-4">
        {visibleStandards.map((s) => {
          const expanded = expandedStandards.has(s.shortCode)
          const filteredClauses = filterClauses(s.clauses, query)
          const pct = readinessPct(s)
          return (
            <div
              key={s.shortCode}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggleStandard(s.shortCode)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 text-left"
              >
                <svg
                  className={`w-4 h-4 text-gray-400 transition ${expanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">
                    {s.code} — {s.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.description}</div>
                </div>
                {pct !== null && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          pct >= 75
                            ? 'bg-emerald-500'
                            : pct >= 50
                              ? 'bg-blue-500'
                              : pct >= 25
                                ? 'bg-amber-500'
                                : 'bg-gray-300'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-10 text-right">
                      {pct}%
                    </span>
                  </div>
                )}
              </button>

              {expanded && (
                <div className="border-t border-gray-200">
                  {filteredClauses.length === 0 ? (
                    <div className="px-5 py-8 text-sm text-gray-500 text-center">
                      {s.clauses.length === 0
                        ? 'Clauses for this standard are coming soon.'
                        : 'No matches for your search.'}
                    </div>
                  ) : (
                    filteredClauses.map((c) => {
                      const clauseExpanded = expandedClauses.has(c.number)
                      const status = statusMap.get(c.number) ?? null
                      return (
                        <div
                          key={c.number}
                          className="border-t border-gray-100 first:border-t-0"
                        >
                          <button
                            type="button"
                            onClick={() => toggleClause(c.number)}
                            className="w-full flex items-start gap-3 px-5 py-3 hover:bg-gray-50 text-left"
                          >
                            <svg
                              className={`w-3.5 h-3.5 text-gray-400 mt-1 transition flex-shrink-0 ${
                                clauseExpanded ? 'rotate-90' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="m9 18 6-6-6-6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">
                                <span className="font-mono text-gray-500 mr-2">
                                  {c.number}
                                </span>
                                {c.title}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">{c.plain}</div>
                            </div>
                            <StatusBadge status={status} />
                          </button>

                          {clauseExpanded && (
                            <div className="px-5 pb-5 pl-12 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <DetailBlock label="Document needed" body={c.document} />
                                <DetailBlock label="Evidence needed" body={c.evidence} />
                                <DetailBlock
                                  label="Auditor will ask"
                                  body={c.auditorAsks}
                                  italic
                                />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Link
                                  href={`/dashboard/documents/generator?clause=${c.number}`}
                                  className="text-xs font-medium px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                >
                                  Generate document
                                </Link>
                                <Link
                                  href={`/dashboard/evidence?clause=${c.number}`}
                                  className="text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                  Upload evidence
                                </Link>
                                <Link
                                  href={`/dashboard/gap-assessment?clause=${c.number}`}
                                  className="text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                  Open in gap assessment
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function filterClauses(clauses: Clause[], query: string): Clause[] {
  if (!query.trim()) return clauses
  const q = query.toLowerCase()
  return clauses.filter(
    (c) =>
      c.number.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.plain.toLowerCase().includes(q)
  )
}

function StatusBadge({ status }: { status: string | null }) {
  let label = 'Not assessed'
  let cls = 'bg-gray-100 text-gray-600'
  if (status === 'compliant' || status === 'user_confirmed') {
    label = 'Ready'
    cls = 'bg-emerald-50 text-emerald-700'
  } else if (status === 'gap') {
    label = 'Gap'
    cls = 'bg-red-50 text-red-700'
  } else if (status === 'not_applicable') {
    label = 'N/A'
    cls = 'bg-gray-100 text-gray-500'
  } else if (status === 'pending') {
    label = 'Pending'
    cls = 'bg-amber-50 text-amber-700'
  }
  return (
    <span
      className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${cls}`}
    >
      {label}
    </span>
  )
}

function DetailBlock({
  label,
  body,
  italic,
}: {
  label: string
  body: string
  italic?: boolean
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </div>
      <div className={`text-xs text-gray-700 leading-relaxed ${italic ? 'italic' : ''}`}>
        {body}
      </div>
    </div>
  )
}
