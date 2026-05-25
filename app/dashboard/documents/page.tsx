'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ISO_9001_CLAUSES } from '@/lib/iso-clauses'

type Status = 'Ready' | 'Blocked' | 'Draft' | 'In review' | 'Approved' | 'Missing'
type DocRow = { document_code: string | null; title: string; status: string }

type Row = {
  clause: string
  name: string
  type: string
  format: string
  canAi: boolean
  status: Status
}

function typeFromName(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('policy')) return 'Policy'
  if (n.includes('procedure')) return 'Procedure'
  if (n.includes('manual')) return 'Manual'
  if (n.includes('plan')) return 'Plan'
  if (n.includes('register') || n.includes('record') || n.includes('log')) return 'Record'
  return 'Document'
}

export default function RequiredDocumentsPage() {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<Row[]>([])
  const [filterStandard, setFilterStandard] = useState<'all' | 'iso9001'>('all')
  const [filterType, setFilterType] = useState<'all' | string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | Status>('all')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userRow } = await supabase.from('users').select('company_id').eq('id', user.id).maybeSingle()
      if (!userRow?.company_id) { setLoading(false); return }
      const [docsRes, companyRes] = await Promise.all([
        supabase.from('documents').select('document_code, title, status').eq('company_id', userRow.company_id),
        supabase.from('companies').select('setup_step').eq('id', userRow.company_id).maybeSingle(),
      ])
      if (cancelled) return
      const docMap = new Map<string, DocRow>()
      ;(docsRes.data ?? []).forEach((d) => {
        if (d.document_code) docMap.set(d.document_code, d as DocRow)
      })
      const setupStep = companyRes.data?.setup_step ?? 0
      const setupDone = setupStep >= 1

      const built: Row[] = ISO_9001_CLAUSES.map((c) => {
        const doc = docMap.get(c.number)
        let status: Status
        const type = typeFromName(c.document)
        const canAi = type !== 'Record'
        if (doc) {
          if (doc.status === 'approved') status = 'Approved'
          else if (doc.status === 'in_review') status = 'In review'
          else status = 'Draft'
        } else if (!setupDone) {
          status = 'Blocked'
        } else if (canAi) {
          status = 'Ready'
        } else {
          status = 'Missing'
        }
        return {
          clause: c.number,
          name: c.document,
          type,
          format: 'DOCX',
          canAi,
          status,
        }
      })
      setRows(built)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const types = Array.from(new Set(rows.map(r => r.type))).sort()
  const filtered = rows.filter(r => {
    if (filterStandard !== 'all' && filterStandard !== 'iso9001') return false
    if (filterType !== 'all' && r.type !== filterType) return false
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    return true
  })

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Required documents</h1>
        <p className="text-sm text-gray-500 mt-1">The documents an auditor will expect to see. Generate them with AI or upload your own.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <FilterPill label="Standard" value={filterStandard} options={[['all', 'All'], ['iso9001', 'ISO 9001']]} onChange={v => setFilterStandard(v as typeof filterStandard)} />
        <FilterPill label="Type" value={filterType} options={[['all', 'All'], ...types.map(t => [t, t] as [string, string])]} onChange={setFilterType} />
        <FilterPill label="Status" value={filterStatus} options={[['all', 'All'], ['Ready', 'Ready'], ['Approved', 'Approved'], ['In review', 'In review'], ['Draft', 'Draft'], ['Missing', 'Missing'], ['Blocked', 'Blocked']]} onChange={v => setFilterStatus(v as typeof filterStatus)} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-sm text-gray-500">No documents match this filter.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Format</th>
                <th className="px-4 py-2.5">Clause</th>
                <th className="px-4 py-2.5 text-center">AI generate</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.clause + r.name}>
                  <td className="px-4 py-3 text-gray-900">{r.name}</td>
                  <td className="px-4 py-3 text-gray-700">{r.type}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs font-mono">{r.format}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.clause}</td>
                  <td className="px-4 py-3 text-center">
                    {r.canAi ? <span className="text-emerald-600 text-sm">✓</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'Blocked' ? (
                      <span title="Complete company setup first" className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="1" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                        Locked
                      </span>
                    ) : r.status === 'Ready' || r.status === 'Draft' || r.status === 'In review' ? (
                      <Link href={`/dashboard/documents/generator?clause=${r.clause}`} className="text-xs font-medium px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 inline-block">
                        {r.status === 'Ready' ? 'Generate' : 'Open'}
                      </Link>
                    ) : r.status === 'Missing' ? (
                      <Link href={`/dashboard/evidence?clause=${r.clause}`} className="text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 inline-block">
                        Upload
                      </Link>
                    ) : (
                      <Link href={`/dashboard/documents/centre`} className="text-xs font-medium text-blue-600 hover:text-blue-800">View →</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FilterPill({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-md p-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 px-2 self-center">{label}:</span>
      {options.map(([v, l]) => (
        <button key={v} type="button" onClick={() => onChange(v)} className={`px-3 py-1.5 text-xs font-medium rounded ${value === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
          {l}
        </button>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, [string, string]> = {
    Ready: ['Ready', 'bg-blue-50 text-blue-700'],
    Blocked: ['Blocked', 'bg-gray-100 text-gray-500'],
    Draft: ['Draft', 'bg-gray-100 text-gray-700'],
    'In review': ['In review', 'bg-amber-50 text-amber-700'],
    Approved: ['Approved', 'bg-emerald-50 text-emerald-700'],
    Missing: ['Missing', 'bg-red-50 text-red-700'],
  }
  const [label, cls] = map[status]
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${cls}`}>{label}</span>
}
