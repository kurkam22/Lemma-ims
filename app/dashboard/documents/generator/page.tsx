'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const DOCUMENT_TYPES = [
  'IMS Policy',
  'Quality procedure',
  'Risk register',
  'Supplier evaluation procedure',
  'CAPA procedure',
  'Internal audit procedure',
  'Training procedure',
  'Management review procedure',
  'Competence matrix',
  'Process card',
  'Approved supplier list',
] as const

type DocType = (typeof DOCUMENT_TYPES)[number]

const TEMPLATES: Record<DocType, string[]> = {
  'IMS Policy': ['Purpose', 'Scope', 'Policy statement', 'Commitments', 'Communication', 'Approval'],
  'Quality procedure': ['Purpose', 'Scope', 'Responsibilities', 'Procedure steps', 'Records', 'References'],
  'Risk register': ['Purpose', 'Scope', 'Methodology', 'Risk register table', 'Review schedule'],
  'Supplier evaluation procedure': ['Purpose', 'Scope', 'Selection criteria', 'Evaluation process', 'Approval', 'Monitoring'],
  'CAPA procedure': ['Purpose', 'Scope', 'Initiation', 'Root cause analysis', 'Corrective action', 'Verification', 'Closure'],
  'Internal audit procedure': ['Purpose', 'Scope', 'Audit programme', 'Audit execution', 'Reporting', 'Follow-up'],
  'Training procedure': ['Purpose', 'Scope', 'Needs identification', 'Training delivery', 'Evaluation', 'Records'],
  'Management review procedure': ['Purpose', 'Scope', 'Inputs', 'Review meeting', 'Outputs', 'Documentation'],
  'Competence matrix': ['Header', 'Matrix table'],
  'Process card': ['Process name', 'Owner', 'Inputs', 'Outputs', 'Steps', 'KPIs', 'Records'],
  'Approved supplier list': ['Header', 'Supplier table'],
}

const COVERED_CLAUSES: Record<DocType, string[]> = {
  'IMS Policy': ['5.2', '5.1'],
  'Quality procedure': ['7.5', '4.4'],
  'Risk register': ['6.1'],
  'Supplier evaluation procedure': ['8.4'],
  'CAPA procedure': ['10.2'],
  'Internal audit procedure': ['9.2'],
  'Training procedure': ['7.2', '7.3'],
  'Management review procedure': ['9.3'],
  'Competence matrix': ['7.2'],
  'Process card': ['4.4'],
  'Approved supplier list': ['8.4'],
}

const COMPANY_FIELDS: { key: string; label: string; isList?: boolean }[] = [
  { key: 'name', label: 'Company name' },
  { key: 'country', label: 'Country' },
  { key: 'industry', label: 'Industry' },
  { key: 'certification_goal', label: 'Certification goal' },
  { key: 'employee_count', label: 'Employee count' },
  { key: 'document_language', label: 'Document language' },
  { key: 'director_name', label: 'Director' },
  { key: 'qms_manager_name', label: 'QMS manager' },
  { key: 'target_date', label: 'Target date' },
  { key: 'consultant_name', label: 'Consultant' },
  { key: 'processes', label: 'Processes', isList: true },
  { key: 'quality_objectives', label: 'Quality objectives', isList: true },
  { key: 'department_heads', label: 'Department heads', isList: true },
  { key: 'sites', label: 'Sites', isList: true },
]

type Company = Record<string, unknown> & { id: string; name: string; document_code_prefix?: string | null }

export default function GeneratorPage() {
  const [documentType, setDocumentType] = useState<DocType>('IMS Policy')
  const [text, setText] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedDocId, setSavedDocId] = useState<string | null>(null)
  const [savedCode, setSavedCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userRow } = await supabase.from('users').select('company_id').eq('id', user.id).maybeSingle()
      if (!userRow?.company_id) { setLoading(false); return }
      const { data: c } = await supabase.from('companies').select('*').eq('id', userRow.company_id).maybeSingle()
      if (cancelled) return
      setCompanyId(userRow.company_id)
      setCompany(c as Company)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function generate() {
    if (!companyId) return
    setText('')
    setError(null)
    setNotice(null)
    setSavedDocId(null)
    setSavedCode(null)
    setStreaming(true)

    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType, companyId }),
      })

      if (!res.ok) {
        let msg = `Generation failed (${res.status})`
        try {
          const j = await res.json()
          if (j.error) msg = j.error
        } catch {
          // body wasn't json
        }
        setError(msg)
        setStreaming(false)
        return
      }

      if (!res.body) {
        setError('No response body from generator.')
        setStreaming(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setText((prev) => prev + chunk)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed.')
    }
    setStreaming(false)
  }

  async function nextDocCode(): Promise<string> {
    if (!companyId) return ''
    const supabase = createClient()
    const { count } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
    const prefix = (company?.document_code_prefix as string | undefined ?? 'DOC').toUpperCase()
    return `${prefix}-${String((count ?? 0) + 1).padStart(3, '0')}`
  }

  async function save(asOfficial: boolean) {
    if (!companyId || !text.trim()) return
    setError(null)
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const code = savedCode ?? (await nextDocCode())

    if (savedDocId) {
      const { error: e } = await supabase
        .from('documents')
        .update({
          content: text,
          status: asOfficial ? 'approved' : 'draft',
        })
        .eq('id', savedDocId)
      setSaving(false)
      if (e) { setError(e.message); return }
      setNotice(asOfficial ? `Saved as official (${code}).` : `Draft updated (${code}).`)
      return
    }

    const { data, error: e } = await supabase
      .from('documents')
      .insert({
        company_id: companyId,
        title: documentType,
        document_type: documentType,
        status: asOfficial ? 'approved' : 'draft',
        content: text,
        document_code: code,
        version: '1.0',
        language: (company?.document_language as string | undefined) ?? 'EN',
        owner_id: user.id,
      })
      .select('id, document_code')
      .single()
    setSaving(false)
    if (e) { setError(e.message); return }
    if (data) {
      setSavedDocId(data.id)
      setSavedCode(data.document_code)
      setNotice(asOfficial ? `Saved as official (${data.document_code}).` : `Draft saved (${data.document_code}).`)
    }
  }

  function exportWord() {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(documentType)}</title>
<style>body{font-family:Calibri,Arial,sans-serif;max-width:720px;margin:40px auto;line-height:1.5;}pre{white-space:pre-wrap;font-family:inherit;font-size:11pt;}</style>
</head><body><pre>${escapeHtml(text)}</pre></body></html>`
    const blob = new Blob([html], { type: 'application/msword' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${documentType.replace(/\s+/g, '-')}-${(savedCode ?? 'draft').toLowerCase()}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  const sections = TEMPLATES[documentType]
  const sectionStatuses = sections.map((name) => {
    const idx = text.toLowerCase().indexOf(name.toLowerCase())
    if (idx === -1) return { name, status: 'red' as const }
    const tail = text.slice(idx + name.length, idx + name.length + 300).trim()
    if (tail.length < 30) return { name, status: 'amber' as const }
    return { name, status: 'green' as const }
  })
  const completePct = sectionStatuses.length === 0
    ? 0
    : Math.round((sectionStatuses.filter((s) => s.status === 'green').length / sectionStatuses.length) * 100)
  const qualityIssues = qualityChecks(text)

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">AI document generator</h1>
        <p className="text-sm text-gray-500 mt-1">Pick a document type and let AI draft it from your confirmed company data.</p>
      </div>

      {error && <div role="alert" className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}
      {notice && <div className="px-4 py-3 rounded-md bg-blue-50 border border-blue-200 text-sm text-blue-700">{notice}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[240px,1fr,300px] gap-4">
        <LeftPanel sections={sectionStatuses} completePct={completePct} />
        <CenterPanel
          documentType={documentType}
          setDocumentType={(t) => { setDocumentType(t); setText(''); setSavedDocId(null); setSavedCode(null); setNotice(null) }}
          text={text}
          setText={setText}
          streaming={streaming}
          saving={saving}
          onGenerate={generate}
          onSaveDraft={() => save(false)}
          onConfirmOfficial={() => save(true)}
          onExportWord={exportWord}
          onPrint={() => window.print()}
          savedCode={savedCode}
        />
        <RightPanel
          company={company}
          documentType={documentType}
          qualityIssues={qualityIssues}
          savedDocId={savedDocId}
          savedCode={savedCode}
        />
      </div>
    </div>
  )
}

function LeftPanel({ sections, completePct }: { sections: { name: string; status: 'red' | 'amber' | 'green' }[]; completePct: number }) {
  return (
    <aside className="bg-white border border-gray-200 rounded-lg p-4 self-start">
      <h2 className="text-sm font-semibold text-gray-900 mb-3">Document structure</h2>
      <ul className="space-y-1.5">
        {sections.map((s) => (
          <li key={s.name} className="flex items-center gap-2 text-xs">
            {s.status === 'green' && <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] flex-shrink-0">✓</span>}
            {s.status === 'amber' && <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] flex-shrink-0">!</span>}
            {s.status === 'red' && <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] flex-shrink-0">×</span>}
            <span className="text-gray-700">{s.name}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
          <span>Completeness</span>
          <span>{completePct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${completePct >= 75 ? 'bg-emerald-500' : completePct >= 50 ? 'bg-blue-500' : completePct >= 25 ? 'bg-amber-500' : 'bg-gray-300'}`}
            style={{ width: `${completePct}%` }}
          />
        </div>
      </div>
    </aside>
  )
}

function CenterPanel({
  documentType, setDocumentType, text, setText, streaming, saving,
  onGenerate, onSaveDraft, onConfirmOfficial, onExportWord, onPrint, savedCode,
}: {
  documentType: DocType
  setDocumentType: (t: DocType) => void
  text: string
  setText: (t: string) => void
  streaming: boolean
  saving: boolean
  onGenerate: () => void
  onSaveDraft: () => void
  onConfirmOfficial: () => void
  onExportWord: () => void
  onPrint: () => void
  savedCode: string | null
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap gap-2 items-center">
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as DocType)}
          disabled={streaming}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white"
        >
          {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          type="button"
          onClick={onGenerate}
          disabled={streaming}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-1.5 rounded-md"
        >
          {streaming ? 'Generating…' : '✨ Generate'}
        </button>
        {savedCode && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700">
            {savedCode}
          </span>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        readOnly={streaming}
        placeholder="Document will appear here as it's generated…"
        className="flex-1 px-4 py-3 text-sm font-mono leading-relaxed text-gray-900 resize-none outline-none min-h-[480px] whitespace-pre-wrap"
      />

      <div className="px-4 py-3 border-t border-gray-200 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={!text.trim() || saving || streaming}
            className="text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-md disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            onClick={onConfirmOfficial}
            disabled={!text.trim() || saving || streaming}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-sm font-medium px-3 py-1.5 rounded-md"
          >
            Confirm as official
          </button>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onExportWord} disabled={!text.trim()} className="text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-md disabled:opacity-50">Word</button>
          <button type="button" onClick={onPrint} disabled={!text.trim()} className="text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-md disabled:opacity-50">PDF</button>
          <button type="button" onClick={onPrint} disabled={!text.trim()} className="text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-md disabled:opacity-50">Print</button>
        </div>
      </div>
    </div>
  )
}

function RightPanel({ company, documentType, qualityIssues, savedDocId, savedCode }: {
  company: Company | null
  documentType: DocType
  qualityIssues: string[]
  savedDocId: string | null
  savedCode: string | null
}) {
  return (
    <aside className="space-y-4 self-start">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Company data</h2>
        <ul className="space-y-1">
          {COMPANY_FIELDS.map((f) => {
            const value = company?.[f.key]
            let confirmed = false
            if (f.isList) {
              confirmed = Array.isArray(value) && value.length > 0
            } else {
              confirmed = value !== null && value !== undefined && value !== ''
            }
            return (
              <li key={f.key} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{f.label}</span>
                {confirmed ? (
                  <span className="text-emerald-600 text-xs font-medium">✓</span>
                ) : (
                  <span className="text-gray-300 text-xs">—</span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">ISO clauses covered</h2>
        <div className="flex flex-wrap gap-1">
          {(COVERED_CLAUSES[documentType] ?? []).map((c) => (
            <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700">{c}</span>
          ))}
          {(COVERED_CLAUSES[documentType] ?? []).length === 0 && (
            <span className="text-xs text-gray-400 italic">None mapped.</span>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">AI quality check</h2>
        {qualityIssues.length === 0 ? (
          <p className="text-xs text-emerald-700">✓ No issues detected.</p>
        ) : (
          <ul className="space-y-1.5">
            {qualityIssues.map((issue, i) => (
              <li key={i} className="text-xs text-amber-700 flex gap-1.5">
                <span className="flex-shrink-0">!</span>
                <span>{issue}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Export status</h2>
        {savedDocId ? (
          <div className="text-xs text-gray-700">
            <div className="text-emerald-700 font-medium">✓ Saved to workspace</div>
            <div className="mt-1 font-mono text-[10px] text-gray-500">{savedCode}</div>
          </div>
        ) : (
          <p className="text-xs text-gray-500">Not saved yet. Click &quot;Save draft&quot; or &quot;Confirm as official&quot; to store this document.</p>
        )}
      </div>
    </aside>
  )
}

function qualityChecks(text: string): string[] {
  const issues: string[] = []
  if (!text.trim()) return issues

  const toConfirmCount = (text.match(/\[TO CONFIRM[^\]]*\]/g) ?? []).length
  if (toConfirmCount > 0) {
    issues.push(`${toConfirmCount} [TO CONFIRM] placeholder${toConfirmCount === 1 ? '' : 's'} need real data before this can be approved`)
  }

  if (/ISO\s+9000(?!:)/i.test(text)) {
    issues.push('Found "ISO 9000" reference — should this be "ISO 9001"?')
  }
  if (/ISO\s+9002/i.test(text) || /ISO\s+9003/i.test(text)) {
    issues.push('Reference to a withdrawn ISO standard (ISO 9002/9003) — replace with ISO 9001')
  }

  if (/_{5,}/.test(text)) {
    issues.push('Blank signature fields (underscores) detected — these need names or [TO CONFIRM]')
  }

  const codeMatches = text.match(/[A-Z]{2,4}-\d{3,}/g) ?? []
  const counts = new Map<string, number>()
  for (const m of codeMatches) counts.set(m, (counts.get(m) ?? 0) + 1)
  for (const [code, n] of counts) {
    if (n > 3) issues.push(`Document code "${code}" appears ${n} times — check for duplicate references`)
  }

  return issues
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
