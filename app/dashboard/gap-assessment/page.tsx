'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ISO_9001_CLAUSES } from '@/lib/iso-clauses'

type DocStatus = 'approved' | 'in_review' | 'draft' | 'missing'
type Risk = 'low' | 'medium' | 'high' | 'na'
type FilterKey = 'all' | 'gap' | 'pending' | 'compliant'

type ClauseRow = {
  number: string
  title: string
  docStatus: DocStatus
  evidenceCount: number
  risk: Risk
  gapStatus: string
}

export default function GapAssessmentPage() {
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [rows, setRows] = useState<ClauseRow[]>([])
  const [filter, setFilter] = useState<FilterKey>('all')
  const [error, setError] = useState<string | null>(null)

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
      const cid = userRow.company_id

      const [gapsRes, docsRes, evRes] = await Promise.all([
        supabase
          .from('gap_answers')
          .select('clause_id, status')
          .eq('company_id', cid),
        supabase
          .from('documents')
          .select('document_code, status')
          .eq('company_id', cid),
        supabase.from('evidence').select('clause_ids').eq('company_id', cid),
      ])
      if (cancelled) return

      const gapMap = new Map<string, string>()
      ;(gapsRes.data ?? []).forEach((g) => {
        if (g.clause_id) gapMap.set(g.clause_id, g.status)
      })

      const docMap = new Map<string, string>()
      ;(docsRes.data ?? []).forEach((d) => {
        if (d.document_code) docMap.set(d.document_code, d.status)
      })

      const evCount = new Map<string, number>()
      ;(evRes.data ?? []).forEach((e) => {
        ;((e.clause_ids ?? []) as string[]).forEach((id) => {
          evCount.set(id, (evCount.get(id) ?? 0) + 1)
        })
      })

      const built: ClauseRow[] = ISO_9001_CLAUSES.map((c) => {
        const gap = gapMap.get(c.number) ?? 'pending'
        const doc = docMap.get(c.number) ?? null
        const evCnt = evCount.get(c.number) ?? 0

        let risk: Risk = 'medium'
        if (gap === 'compliant' || gap === 'user_confirmed') risk = 'low'
        else if (gap === 'gap') risk = 'high'
        else if (gap === 'not_applicable') risk = 'na'

        let docStatus: DocStatus = 'missing'
        if (doc === 'approved') docStatus = 'approved'
        else if (doc === 'in_review') docStatus = 'in_review'
        else if (doc === 'draft') docStatus = 'draft'

        return {
          number: c.number,
          title: c.title,
          docStatus,
          evidenceCount: evCnt,
          risk,
          gapStatus: gap,
        }
      })

      setCompanyId(cid)
      setRows(built)
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function updateStatus(clauseNumber: string, newStatus: string) {
    if (!companyId) return
    const supabase = createClient()
    setError(null)
    const { error: e } = await supabase.from('gap_answers').upsert(
      {
        company_id: companyId,
        clause_id: clauseNumber,
        status: newStatus,
      },
      { onConflict: 'company_id,clause_id' }
    )
    if (e) {
      setError(e.message)
      return
    }
    setRows((prev) =>
      prev.map((r) =>
        r.number === clauseNumber
          ? {
              ...r,
              gapStatus: newStatus,
              risk:
                newStatus === 'compliant' || newStatus === 'user_confirmed'
                  ? 'low'
                  : newStatus === 'gap'
                    ? 'high'
                    : newStatus === 'not_applicable'
                      ? 'na'
                      : 'medium',
            }
          : r
      )
    )
  }

  const compliantCount = rows.filter(
    (r) => r.gapStatus === 'compliant' || r.gapStatus === 'user_confirmed'
  ).length
  const overallPct = rows.length > 0 ? Math.round((compliantCount / rows.length) * 100) : 0

  const filteredRows = rows.filter((r) => {
    if (filter === 'all') return true
    if (filter === 'compliant')
      return r.gapStatus === 'compliant' || r.gapStatus === 'user_confirmed'
    return r.gapStatus === filter
  })

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Gap assessment</h1>
        <p className="text-sm text-gray-500 mt-1">
          Where you stand against each ISO 9001 clause. Change a status to update your
          readiness instantly.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-lg p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Overall readiness
          </div>
          <div className="flex items-end gap-3 mt-2">
            <div className="text-3xl font-semibold text-gray-900">{overallPct}%</div>
            <div className="text-xs text-gray-500 mb-1">
              {compliantCount} of {rows.length} clauses
            </div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full ${
                overallPct >= 75
                  ? 'bg-emerald-500'
                  : overallPct >= 50
                    ? 'bg-blue-500'
                    : overallPct >= 25
                      ? 'bg-amber-500'
                      : 'bg-gray-300'
              }`}
              style={{ width: `${overallPct}%` }}
            />
          </div>
        </div>
        <StatCard
          label="Gaps"
          value={rows.filter((r) => r.gapStatus === 'gap').length}
          accent="red"
        />
        <StatCard
          label="Pending"
          value={rows.filter((r) => r.gapStatus === 'pending').length}
          accent="amber"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-md p-1 w-fit">
        {(
          [
            ['all', 'All'],
            ['compliant', 'Compliant'],
            ['gap', 'Gaps'],
            ['pending', 'Pending'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              filter === k
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-2.5">Clause</th>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Document</th>
              <th className="px-4 py-2.5">Evidence</th>
              <th className="px-4 py-2.5">Risk</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  No clauses match this filter.
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.number}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{r.number}</td>
                  <td className="px-4 py-3 text-gray-900">{r.title}</td>
                  <td className="px-4 py-3">
                    <DocStatusBadge status={r.docStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <EvidenceBadge count={r.evidenceCount} />
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge risk={r.risk} />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.gapStatus}
                      onChange={(e) => updateStatus(r.number, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="compliant">Compliant</option>
                      <option value="user_confirmed">User confirmed</option>
                      <option value="gap">Gap</option>
                      <option value="not_applicable">N/A</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        href={`/dashboard/documents/generator?clause=${r.number}`}
                        className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
                      >
                        Generate doc
                      </Link>
                      <Link
                        href={`/dashboard/evidence?clause=${r.number}`}
                        className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                      >
                        Add evidence
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: 'red' | 'amber'
}) {
  const cls = accent === 'red' ? 'text-red-600' : 'text-amber-600'
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className={`text-2xl font-semibold mt-2 ${cls}`}>{value}</div>
    </div>
  )
}

function DocStatusBadge({ status }: { status: DocStatus }) {
  const map: Record<DocStatus, [string, string]> = {
    approved: ['Approved', 'bg-emerald-50 text-emerald-700'],
    in_review: ['In review', 'bg-amber-50 text-amber-700'],
    draft: ['Draft', 'bg-gray-100 text-gray-700'],
    missing: ['Missing', 'bg-red-50 text-red-700'],
  }
  const [label, cls] = map[status]
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${cls}`}>{label}</span>
  )
}

function EvidenceBadge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700">
        Missing
      </span>
    )
  }
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
      Provided ({count})
    </span>
  )
}

function RiskBadge({ risk }: { risk: Risk }) {
  const map: Record<Risk, [string, string]> = {
    low: ['Low', 'bg-emerald-50 text-emerald-700'],
    medium: ['Medium', 'bg-amber-50 text-amber-700'],
    high: ['High', 'bg-red-50 text-red-700'],
    na: ['N/A', 'bg-gray-100 text-gray-500'],
  }
  const [label, cls] = map[risk]
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${cls}`}>{label}</span>
  )
}
