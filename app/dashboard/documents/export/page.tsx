'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Document = {
  id: string
  title: string
  document_code: string | null
  status: 'draft' | 'in_review' | 'approved' | 'obsolete'
  version: string
  content: string | null
  document_type: string
  updated_at: string
}

type Evidence = {
  id: string
  file_name: string | null
  evidence_type: string
  clause_ids: string[]
  expiry_date: string | null
  user_confirmed: boolean
}

type Scope =
  | 'single'
  | 'all_approved'
  | 'by_standard'
  | 'evidence_package'
  | 'full_readiness'

type Format = 'word' | 'pdf' | 'mixed'

type ReportRow = { id: string; type: string; filename: string | null; created_at: string }

export default function ExportPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [history, setHistory] = useState<ReportRow[]>([])

  const [scope, setScope] = useState<Scope>('all_approved')
  const [singleDocId, setSingleDocId] = useState<string>('')
  const [standardFilter, setStandardFilter] = useState<'iso9001' | 'iso14001' | 'iso45001'>('iso9001')
  const [format, setFormat] = useState<Format>('word')
  const [includeApproval, setIncludeApproval] = useState(true)
  const [includeHistory, setIncludeHistory] = useState(false)
  const [stampControlled, setStampControlled] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userRow } = await supabase.from('users').select('company_id').eq('id', user.id).maybeSingle()
      if (!userRow?.company_id) { setLoading(false); return }
      const cid = userRow.company_id
      const [docsRes, evRes, reportsRes] = await Promise.all([
        supabase.from('documents').select('*').eq('company_id', cid).order('updated_at', { ascending: false }),
        supabase.from('evidence').select('id, file_name, evidence_type, clause_ids, expiry_date, user_confirmed').eq('company_id', cid),
        supabase.from('reports').select('*').eq('company_id', cid).eq('type', 'export_package').order('created_at', { ascending: false }).limit(20),
      ])
      if (cancelled) return
      setCompanyId(cid)
      setDocuments((docsRes.data ?? []) as Document[])
      setEvidence((evRes.data ?? []) as Evidence[])
      setHistory((reportsRes.data ?? []) as ReportRow[])
      if (docsRes.data && docsRes.data.length > 0) setSingleDocId(docsRes.data[0].id)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const previewDocs = useMemo<Document[]>(() => {
    if (scope === 'single') {
      const d = documents.find((x) => x.id === singleDocId)
      return d ? [d] : []
    }
    if (scope === 'all_approved' || scope === 'full_readiness') {
      return documents.filter((d) => d.status === 'approved')
    }
    if (scope === 'by_standard') {
      // Only ISO 9001 has clause data; for others, return empty or approved with matching code.
      return documents.filter((d) => d.status === 'approved')
    }
    return []
  }, [scope, singleDocId, documents])

  const previewEvidence = useMemo<Evidence[]>(() => {
    if (scope === 'evidence_package' || scope === 'full_readiness') {
      return evidence.filter((e) => e.user_confirmed)
    }
    return []
  }, [scope, evidence])

  async function generate() {
    if (!companyId) return
    setError(null)
    setNotice(null)
    setGenerating(true)
    try {
      const html = buildBundleHtml({
        scope,
        format,
        documents: previewDocs,
        evidence: previewEvidence,
        includeApproval,
        includeHistory,
        stampControlled,
      })
      const filename = `lemma-export-${scope}-${new Date().toISOString().slice(0, 10)}.doc`
      downloadBlob(new Blob([html], { type: 'application/msword' }), filename)

      const supabase = createClient()
      const { data } = await supabase
        .from('reports')
        .insert({ company_id: companyId, type: 'export_package', filename })
        .select('*')
        .single()
      if (data) setHistory((prev) => [data as ReportRow, ...prev])
      setNotice(`Generated ${filename}.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate package.')
    }
    setGenerating(false)
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Export centre</h1>
        <p className="text-sm text-gray-500 mt-1">Bundle documents and evidence for auditors, regulators, or your own archive.</p>
      </div>

      {error && <div role="alert" className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      {notice && <div className="px-4 py-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-700">{notice}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">What to export</h2>
            <div className="space-y-2">
              <ScopeOption value="single" current={scope} onChange={setScope} label="Single document" />
              {scope === 'single' && (
                <select value={singleDocId} onChange={(e) => setSingleDocId(e.target.value)} className="ml-6 text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white w-[calc(100%-1.5rem)]">
                  {documents.length === 0 ? (
                    <option>(no documents)</option>
                  ) : (
                    documents.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}{d.document_code ? ` (${d.document_code})` : ''}
                      </option>
                    ))
                  )}
                </select>
              )}
              <ScopeOption value="all_approved" current={scope} onChange={setScope} label="All approved documents" />
              <ScopeOption value="by_standard" current={scope} onChange={setScope} label="By standard" />
              {scope === 'by_standard' && (
                <select value={standardFilter} onChange={(e) => setStandardFilter(e.target.value as typeof standardFilter)} className="ml-6 text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white">
                  <option value="iso9001">ISO 9001:2015</option>
                  <option value="iso14001">ISO 14001:2015</option>
                  <option value="iso45001">ISO 45001:2018</option>
                </select>
              )}
              <ScopeOption value="evidence_package" current={scope} onChange={setScope} label="Evidence package (confirmed evidence only)" />
              <ScopeOption value="full_readiness" current={scope} onChange={setScope} label="Full readiness package (approved docs + confirmed evidence)" />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Format</h2>
            <div className="flex gap-1 bg-gray-100 rounded-md p-1 w-fit">
              {(['word', 'pdf', 'mixed'] as const).map((f) => (
                <button key={f} type="button" onClick={() => setFormat(f)} className={`px-3 py-1.5 text-xs font-medium rounded capitalize ${format === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                  {f}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 mt-2">Word and Mixed download a .doc file. PDF prints via your browser; choose "Save as PDF" in the print dialog.</p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Options</h2>
            <div className="space-y-2 text-sm">
              <Check label="Include approval sheet" checked={includeApproval} onChange={setIncludeApproval} />
              <Check label="Include revision history" checked={includeHistory} onChange={setIncludeHistory} />
              <Check label="Add controlled-copy stamp" checked={stampControlled} onChange={setStampControlled} />
            </div>
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={generating || (scope === 'single' && !singleDocId) || (previewDocs.length === 0 && previewEvidence.length === 0)}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            {generating ? 'Generating…' : 'Generate package'}
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Package preview</h2>
            {previewDocs.length === 0 && previewEvidence.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Nothing to include yet — pick a scope on the left.</p>
            ) : (
              <>
                {previewDocs.length > 0 && (
                  <>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-2">Documents ({previewDocs.length})</div>
                    <ul className="space-y-1 mb-3">
                      {previewDocs.slice(0, 30).map((d) => (
                        <li key={d.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-900 truncate">{d.title}</span>
                          <span className="font-mono text-gray-400 text-[10px] flex-shrink-0 ml-2">{d.document_code ?? '—'}</span>
                        </li>
                      ))}
                      {previewDocs.length > 30 && <li className="text-[11px] text-gray-500 italic">…and {previewDocs.length - 30} more.</li>}
                    </ul>
                  </>
                )}
                {previewEvidence.length > 0 && (
                  <>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-2">Evidence ({previewEvidence.length})</div>
                    <ul className="space-y-1">
                      {previewEvidence.slice(0, 30).map((e) => (
                        <li key={e.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-900 truncate">{e.file_name ?? '(unnamed)'}</span>
                          <span className="text-gray-400 text-[10px] flex-shrink-0 ml-2">{e.evidence_type}</span>
                        </li>
                      ))}
                      {previewEvidence.length > 30 && <li className="text-[11px] text-gray-500 italic">…and {previewEvidence.length - 30} more.</li>}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Export history</h2>
            {history.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No exports generated yet.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between text-xs border border-gray-200 rounded-md px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-gray-900 truncate font-mono text-[11px]">{h.filename ?? '(no filename)'}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{new Date(h.created_at).toLocaleString()}</div>
                    </div>
                    <span className="text-[10px] text-gray-400 ml-2">downloaded</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-gray-500 mt-3">History shows when each package was generated. The file is downloaded to your browser at generation time — we don't store the bundle content.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScopeOption({ value, current, onChange, label }: { value: Scope; current: Scope; onChange: (v: Scope) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-800">
      <input
        type="radio"
        name="scope"
        value={value}
        checked={current === value}
        onChange={() => onChange(value)}
        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
      />
      <span>{label}</span>
    </label>
  )
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
      <span className="text-gray-700">{label}</span>
    </label>
  )
}

function buildBundleHtml(opts: {
  scope: Scope
  format: Format
  documents: Document[]
  evidence: Evidence[]
  includeApproval: boolean
  includeHistory: boolean
  stampControlled: boolean
}): string {
  const stamp = opts.stampControlled
    ? '<div style="position:fixed;top:20pt;right:20pt;border:2pt solid #c00;color:#c00;padding:4pt 12pt;font-size:9pt;font-weight:bold;letter-spacing:1pt;">CONTROLLED COPY</div>'
    : ''

  const docsHtml = opts.documents.map((d) => `
<section style="page-break-after:always;">
  <h1 style="font-size:18pt;border-bottom:1pt solid #888;padding-bottom:6pt;">${escapeHtml(d.title)}</h1>
  <div style="color:#666;font-size:10pt;margin-bottom:12pt;">
    Code: ${escapeHtml(d.document_code ?? '—')} · Version: ${escapeHtml(d.version)} · Status: ${escapeHtml(d.status)}
  </div>
  <pre style="white-space:pre-wrap;font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5;">${escapeHtml(d.content ?? '')}</pre>
  ${opts.includeApproval ? approvalSheet(d) : ''}
  ${opts.includeHistory ? revisionHistory(d) : ''}
</section>`).join('\n')

  const evHtml = opts.evidence.length > 0 ? `
<section style="page-break-before:always;">
  <h1 style="font-size:18pt;border-bottom:1pt solid #888;padding-bottom:6pt;">Evidence package</h1>
  <table style="width:100%;border-collapse:collapse;font-size:10pt;">
    <thead><tr style="background:#f0f0f0;">
      <th style="border:1pt solid #888;padding:4pt;text-align:left;">File</th>
      <th style="border:1pt solid #888;padding:4pt;text-align:left;">Type</th>
      <th style="border:1pt solid #888;padding:4pt;text-align:left;">Clauses</th>
      <th style="border:1pt solid #888;padding:4pt;text-align:left;">Expiry</th>
    </tr></thead>
    <tbody>
      ${opts.evidence.map((e) => `
        <tr>
          <td style="border:1pt solid #888;padding:4pt;">${escapeHtml(e.file_name ?? '')}</td>
          <td style="border:1pt solid #888;padding:4pt;">${escapeHtml(e.evidence_type)}</td>
          <td style="border:1pt solid #888;padding:4pt;">${(e.clause_ids ?? []).map(escapeHtml).join(', ')}</td>
          <td style="border:1pt solid #888;padding:4pt;">${escapeHtml(e.expiry_date ?? '—')}</td>
        </tr>`).join('')}
    </tbody>
  </table>
</section>` : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lemma IMS export</title>
<style>body{font-family:Calibri,Arial,sans-serif;max-width:760px;margin:32px auto;padding:0 16px;}h1{margin-top:0;}</style>
</head><body>
${stamp}
<h1 style="font-size:22pt;">Lemma IMS export package</h1>
<p style="color:#666;font-size:10pt;">Generated ${new Date().toISOString()} · Scope: ${escapeHtml(opts.scope)} · Format hint: ${escapeHtml(opts.format)}</p>
<hr/>
${docsHtml}
${evHtml}
</body></html>`
}

function approvalSheet(doc: Document): string {
  return `
<table style="margin-top:24pt;width:100%;border-collapse:collapse;font-size:10pt;">
  <caption style="text-align:left;font-weight:bold;padding-bottom:4pt;">Approval sheet</caption>
  <thead><tr style="background:#f0f0f0;">
    <th style="border:1pt solid #888;padding:4pt;text-align:left;">Stage</th>
    <th style="border:1pt solid #888;padding:4pt;text-align:left;">Name</th>
    <th style="border:1pt solid #888;padding:4pt;text-align:left;">Signature</th>
    <th style="border:1pt solid #888;padding:4pt;text-align:left;">Date</th>
  </tr></thead>
  <tbody>
    ${['Author', 'Reviewer', 'QMS', 'Director'].map((s) => `
      <tr><td style="border:1pt solid #888;padding:8pt;">${s}</td><td style="border:1pt solid #888;padding:8pt;">&nbsp;</td><td style="border:1pt solid #888;padding:8pt;">&nbsp;</td><td style="border:1pt solid #888;padding:8pt;">&nbsp;</td></tr>`).join('')}
  </tbody>
</table>`
}

function revisionHistory(doc: Document): string {
  return `
<table style="margin-top:18pt;width:100%;border-collapse:collapse;font-size:10pt;">
  <caption style="text-align:left;font-weight:bold;padding-bottom:4pt;">Revision history</caption>
  <thead><tr style="background:#f0f0f0;">
    <th style="border:1pt solid #888;padding:4pt;text-align:left;">Version</th>
    <th style="border:1pt solid #888;padding:4pt;text-align:left;">Date</th>
    <th style="border:1pt solid #888;padding:4pt;text-align:left;">Change</th>
  </tr></thead>
  <tbody>
    <tr>
      <td style="border:1pt solid #888;padding:4pt;">${escapeHtml(doc.version)}</td>
      <td style="border:1pt solid #888;padding:4pt;">${new Date(doc.updated_at).toLocaleDateString()}</td>
      <td style="border:1pt solid #888;padding:4pt;">Current version.</td>
    </tr>
  </tbody>
</table>`
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

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
