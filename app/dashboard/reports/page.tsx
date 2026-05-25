'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ISO_9001_CLAUSES } from '@/lib/iso-clauses'

type ReportType =
  | 'readiness'
  | 'missing_documents'
  | 'missing_evidence'
  | 'capa_status'
  | 'audit_status'
  | 'training_completion'
  | 'supplier_expiry'
  | 'process_performance'
  | 'cert_package'

type ReportDef = {
  type: ReportType
  title: string
  description: string
}

const REPORTS: ReportDef[] = [
  { type: 'readiness', title: 'Readiness report', description: 'Overall readiness % and per-area breakdown.' },
  { type: 'missing_documents', title: 'Missing documents', description: 'Documents required by ISO clauses that you haven\'t created yet.' },
  { type: 'missing_evidence', title: 'Missing evidence', description: 'Clauses that have no evidence attached.' },
  { type: 'capa_status', title: 'CAPA status', description: 'Open and overdue CAPAs with owners and deadlines.' },
  { type: 'audit_status', title: 'Audit status', description: 'Planned, in-progress, and completed audits.' },
  { type: 'training_completion', title: 'Training completion', description: 'Per-employee training records and gaps.' },
  { type: 'supplier_expiry', title: 'Supplier expiry', description: 'Suppliers ranked by approaching certificate expiry.' },
  { type: 'process_performance', title: 'Process performance', description: 'Summary of processes and linked KPIs.' },
  { type: 'cert_package', title: 'Certification readiness package', description: 'Everything an auditor would want — combined export.' },
]

type ReportRow = { id: string; type: string; filename: string | null; created_at: string }

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [history, setHistory] = useState<ReportRow[]>([])
  const [generating, setGenerating] = useState<ReportType | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userRow } = await supabase.from('users').select('company_id').eq('id', user.id).maybeSingle()
      if (!userRow?.company_id) { setLoading(false); return }
      setCompanyId(userRow.company_id)
      const { data } = await supabase.from('reports').select('*').eq('company_id', userRow.company_id).order('created_at', { ascending: false }).limit(50)
      if (cancelled) return
      setHistory((data ?? []) as ReportRow[])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function generate(type: ReportType) {
    if (!companyId) return
    setError(null)
    setGenerating(type)
    const supabase = createClient()
    try {
      const csv = await buildReport(type, companyId, supabase)
      const filename = `${type}-${new Date().toISOString().slice(0, 10)}.csv`
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename)
      const { data } = await supabase.from('reports').insert({ company_id: companyId, type, filename }).select('*').single()
      if (data) setHistory(prev => [data as ReportRow, ...prev])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate report.')
    }
    setGenerating(null)
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate snapshots of your QMS data. Reports download as CSV.</p>
      </div>

      {error && <div role="alert" className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map(r => (
          <div key={r.type} className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">{r.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{r.description}</p>
            </div>
            <button
              type="button"
              onClick={() => generate(r.type)}
              disabled={generating !== null}
              className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium px-3 py-1.5 rounded-md w-fit"
            >
              {generating === r.type ? 'Generating…' : 'Generate'}
            </button>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Generated reports</h2>
        {history.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-sm text-gray-500">No reports generated yet.</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Filename</th>
                  <th className="px-4 py-2.5">Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map(h => {
                  const def = REPORTS.find(r => r.type === h.type)
                  return (
                    <tr key={h.id}>
                      <td className="px-4 py-3 text-gray-900">{def?.title ?? h.type}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">{h.filename ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(h.created_at).toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-[11px] text-gray-500 mt-2">History shows when each report was generated. The CSV is downloaded to your browser at generation time — we don't keep the file contents.</p>
      </div>
    </div>
  )
}

async function buildReport(type: ReportType, cid: string, supabase: ReturnType<typeof createClient>): Promise<string> {
  switch (type) {
    case 'readiness': {
      const { data: gaps } = await supabase.from('gap_answers').select('clause_id, status').eq('company_id', cid)
      const compliant = (gaps ?? []).filter(g => g.status === 'compliant' || g.status === 'user_confirmed').length
      const total = ISO_9001_CLAUSES.length
      const rows: string[][] = [['Clause', 'Title', 'Status']]
      ISO_9001_CLAUSES.forEach(c => {
        const status = (gaps ?? []).find(g => g.clause_id === c.number)?.status ?? 'pending'
        rows.push([c.number, c.title, status])
      })
      rows.unshift(['Overall readiness', `${Math.round((compliant / total) * 100)}%`, `${compliant}/${total} clauses compliant`])
      rows.unshift([])
      return toCsv(rows)
    }
    case 'missing_documents': {
      const { data: docs } = await supabase.from('documents').select('document_code, title, status').eq('company_id', cid)
      const have = new Set((docs ?? []).map(d => d.document_code).filter(Boolean))
      const rows: string[][] = [['Clause', 'Document needed', 'Status']]
      ISO_9001_CLAUSES.forEach(c => {
        if (!have.has(c.number)) rows.push([c.number, c.document, 'Missing'])
      })
      return toCsv(rows)
    }
    case 'missing_evidence': {
      const { data: ev } = await supabase.from('evidence').select('clause_ids').eq('company_id', cid)
      const covered = new Set<string>()
      ;(ev ?? []).forEach(e => ((e.clause_ids ?? []) as string[]).forEach(id => covered.add(id)))
      const rows: string[][] = [['Clause', 'Title', 'Evidence']]
      ISO_9001_CLAUSES.forEach(c => {
        rows.push([c.number, c.title, covered.has(c.number) ? 'Provided' : 'Missing'])
      })
      return toCsv(rows)
    }
    case 'capa_status': {
      const { data } = await supabase.from('capas').select('description, status, severity, due_date, current_step').eq('company_id', cid).order('created_at', { ascending: false })
      const rows: string[][] = [['Description', 'Status', 'Severity', 'Step', 'Due date']]
      ;(data ?? []).forEach(c => {
        rows.push([c.description ?? '', c.status ?? '', c.severity ?? '', `${c.current_step ?? 1}/7`, c.due_date ?? ''])
      })
      return toCsv(rows)
    }
    case 'audit_status': {
      const { data } = await supabase.from('audits').select('title, department, auditor_name, scheduled_date, status').eq('company_id', cid).order('scheduled_date', { ascending: true })
      const rows: string[][] = [['Title', 'Department', 'Auditor', 'Scheduled', 'Status']]
      ;(data ?? []).forEach(a => {
        rows.push([a.title ?? '', a.department, a.auditor_name ?? '', a.scheduled_date ?? '', a.status])
      })
      return toCsv(rows)
    }
    case 'training_completion': {
      const { data } = await supabase.from('trainings').select('employee_name, module, training_date, result, status').eq('company_id', cid).eq('kind', 'record').order('training_date', { ascending: false })
      const rows: string[][] = [['Employee', 'Module', 'Date', 'Result', 'Status']]
      ;(data ?? []).forEach(t => {
        rows.push([t.employee_name ?? '', t.module, t.training_date ?? '', t.result ?? '', t.status])
      })
      return toCsv(rows)
    }
    case 'supplier_expiry': {
      const { data } = await supabase.from('suppliers').select('name, product, criticality, cert_expiry, evaluation_score, approval_status').eq('company_id', cid).order('cert_expiry', { ascending: true, nullsFirst: false })
      const rows: string[][] = [['Name', 'Product', 'Criticality', 'Cert expiry', 'Score', 'Status']]
      ;(data ?? []).forEach(s => {
        rows.push([s.name, s.product ?? '', s.criticality, s.cert_expiry ?? '', s.evaluation_score?.toString() ?? '', s.approval_status])
      })
      return toCsv(rows)
    }
    case 'process_performance': {
      const { data: c } = await supabase.from('companies').select('processes, quality_objectives').eq('id', cid).maybeSingle()
      const processes = Array.isArray(c?.processes) ? (c!.processes as string[]) : []
      const objectives = Array.isArray(c?.quality_objectives) ? (c!.quality_objectives as Array<{ description: string; target_value?: string; deadline?: string }>) : []
      const rows: string[][] = [['Process', 'Linked objectives']]
      processes.forEach(p => rows.push([p, objectives.filter(o => o.description?.toLowerCase().includes(p.toLowerCase())).map(o => o.description).join('; ') || '—']))
      return toCsv(rows)
    }
    case 'cert_package': {
      const [readiness, docs, ev, capa, audits, suppliers] = await Promise.all([
        buildReport('readiness', cid, supabase),
        buildReport('missing_documents', cid, supabase),
        buildReport('missing_evidence', cid, supabase),
        buildReport('capa_status', cid, supabase),
        buildReport('audit_status', cid, supabase),
        buildReport('supplier_expiry', cid, supabase),
      ])
      return [
        '=== Certification readiness package ===',
        `Generated: ${new Date().toISOString()}`,
        '',
        '== Readiness ==',
        readiness,
        '== Missing documents ==',
        docs,
        '== Missing evidence ==',
        ev,
        '== CAPA status ==',
        capa,
        '== Audit status ==',
        audits,
        '== Suppliers ==',
        suppliers,
      ].join('\n')
    }
  }
}

function toCsv(rows: string[][]): string {
  return rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
