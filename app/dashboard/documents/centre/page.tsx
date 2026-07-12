'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  snapshotVersion, logEvent, loadVersions, loadEvents,
  EVENT_LABELS, type DocumentVersion, type DocumentEvent,
} from '@/lib/document-control'
import { ISO_9001_CLAUSES } from '@/lib/iso-clauses'

type DocStatus = 'draft' | 'in_review' | 'approved' | 'obsolete'

type Document = {
  id: string
  title: string
  document_type: string
  status: DocStatus
  content: string | null
  document_code: string | null
  version: string
  language: string | null
  owner_id: string | null
  created_at: string
  updated_at: string
}

type Evidence = {
  id: string
  file_name: string | null
  evidence_type: string
  clause_ids: string[]
}

type DetailTab = 'document' | 'clauses' | 'evidence' | 'export' | 'versions' | 'approvals'

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

const APPROVAL_STAGES = ['Author', 'Reviewer', 'QMS', 'Director'] as const

function stageFromStatus(status: DocStatus): number {
  if (status === 'draft') return 1
  if (status === 'in_review') return 2
  if (status === 'approved') return 4
  return 1
}

export default function DocumentCentrePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | DocStatus>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<DetailTab>('document')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userRow } = await supabase.from('users').select('company_id').eq('id', user.id).maybeSingle()
      if (!userRow?.company_id) { setLoading(false); return }
      const cid = userRow.company_id
      const [docsRes, evRes] = await Promise.all([
        supabase.from('documents').select('*').eq('company_id', cid).order('updated_at', { ascending: false }),
        supabase.from('evidence').select('id, file_name, evidence_type, clause_ids').eq('company_id', cid),
      ])
      if (cancelled) return
      setCompanyId(cid)
      setDocuments((docsRes.data ?? []) as Document[])
      setEvidence((evRes.data ?? []) as Evidence[])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function updateDoc(id: string, patch: Partial<Document>) {
    const supabase = createClient()
    setError(null)
    const { data, error: e } = await supabase
      .from('documents')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()
    if (e) { setError(e.message); return }
    if (data) {
      const d = data as Document
      setDocuments((prev) => prev.map((x) => (x.id === id ? d : x)))
    }
  }

  async function deleteDoc(id: string) {
    if (typeof window !== 'undefined' && !window.confirm('Delete this document?')) return
    const supabase = createClient()
    const { error: e } = await supabase.from('documents').delete().eq('id', id)
    if (e) { setError(e.message); return }
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  if (selectedId) {
    const doc = documents.find((d) => d.id === selectedId)
    if (!doc) {
      setSelectedId(null)
      return null
    }
    return (
      <DocumentDetail
        doc={doc}
        companyId={companyId}
        evidence={evidence}
        activeTab={tab}
        setTab={setTab}
        onBack={() => { setSelectedId(null); setTab('document') }}
        onUpdate={(patch) => updateDoc(doc.id, patch)}
        onDelete={() => deleteDoc(doc.id)}
        error={error}
      />
    )
  }

  const filtered = documents.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    if (query.trim()) {
      const q = query.toLowerCase()
      if (!d.title.toLowerCase().includes(q) && !(d.document_code ?? '').toLowerCase().includes(q)) {
        return false
      }
    }
    return true
  })

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Document centre</h1>
        <p className="text-sm text-gray-500 mt-1">Everything in your workspace. Click any row to view, edit, and approve.</p>
      </div>

      {error && <div role="alert" className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or code…"
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-md p-1">
          {(['all', 'draft', 'in_review', 'approved', 'obsolete'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded capitalize ${
                statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">No documents match this filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Version</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Updated</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedId(d.id); setTab('document') }}>
                  <td className="px-4 py-3 text-gray-900">{d.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.document_code ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-700">v{d.version}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(d.updated_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-medium text-blue-600">Open →</span>
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

function StatusBadge({ status }: { status: DocStatus }) {
  const map: Record<DocStatus, [string, string]> = {
    draft: ['Draft', 'bg-gray-100 text-gray-700'],
    in_review: ['In review', 'bg-amber-50 text-amber-700'],
    approved: ['Approved', 'bg-emerald-50 text-emerald-700'],
    obsolete: ['Obsolete', 'bg-gray-100 text-gray-500'],
  }
  const [label, cls] = map[status]
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${cls}`}>{label}</span>
}

function DocumentDetail({ doc, companyId, evidence, activeTab, setTab, onBack, onUpdate, onDelete, error }: {
  doc: Document
  companyId: string | null
  evidence: Evidence[]
  activeTab: DetailTab
  setTab: (t: DetailTab) => void
  onBack: () => void
  onUpdate: (patch: Partial<Document>) => void | Promise<void>
  onDelete: () => void | Promise<void>
  error: string | null
}) {
  const [content, setContent] = useState(doc.content ?? '')
  const [title, setTitle] = useState(doc.title)
  const [code, setCode] = useState(doc.document_code ?? '')
  const [version, setVersion] = useState(doc.version)
  const [savingDoc, setSavingDoc] = useState(false)
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [events, setEvents] = useState<DocumentEvent[]>([])
  const [viewVersion, setViewVersion] = useState<DocumentVersion | null>(null)

  const refreshControl = async () => {
    const supabase = createClient()
    const [v, e] = await Promise.all([loadVersions(supabase, doc.id), loadEvents(supabase, doc.id)])
    setVersions(v)
    setEvents(e)
  }

  useEffect(() => {
    refreshControl()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id])

  async function changeStatus(status: DocStatus, action: string) {
    await onUpdate({ status })
    if (companyId) {
      const supabase = createClient()
      await logEvent(supabase, { companyId, documentId: doc.id, action })
      await refreshControl()
    }
  }

  async function restoreVersion(v: DocumentVersion) {
    if (!companyId) return
    const supabase = createClient()
    const n = await snapshotVersion(supabase, {
      companyId, documentId: doc.id, content: v.content,
      note: `Restored from v${v.version_no}`,
    })
    await onUpdate({ content: v.content, ...(n ? { version: `${n}.0` } : {}) })
    await logEvent(supabase, { companyId, documentId: doc.id, action: 'version_restored', detail: `v${v.version_no}` })
    setContent(v.content)
    setViewVersion(null)
    await refreshControl()
  }

  useEffect(() => {
    setContent(doc.content ?? '')
    setTitle(doc.title)
    setCode(doc.document_code ?? '')
    setVersion(doc.version)
  }, [doc.id, doc.content, doc.title, doc.document_code, doc.version])

  async function saveDocContent() {
    setSavingDoc(true)
    let newVersion = version
    if (companyId && content !== (doc.content ?? '')) {
      const supabase = createClient()
      const n = await snapshotVersion(supabase, { companyId, documentId: doc.id, content, note: 'Manual edit' })
      if (n) newVersion = `${n}.0`
      await logEvent(supabase, { companyId, documentId: doc.id, action: 'edited' })
    }
    await onUpdate({ content, title, document_code: code || null, version: newVersion })
    setVersion(newVersion)
    setSavingDoc(false)
    await refreshControl()
  }

  const docClauses = guessClausesForDoc(doc)
  const relatedEvidence = evidence.filter((e) =>
    (e.clause_ids ?? []).some((c) => docClauses.includes(c))
  )

  const stage = stageFromStatus(doc.status)

  return (
    <div className="space-y-6 max-w-6xl">
      <button type="button" onClick={onBack} className="text-sm text-gray-600 hover:text-gray-900">← Back to list</button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{doc.title}</h1>
          <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
            {doc.document_code && <span className="font-mono">{doc.document_code}</span>}
            <span>· v{doc.version}</span>
            <StatusBadge status={doc.status} />
          </div>
        </div>
        <button type="button" onClick={onDelete} className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded">Delete</button>
      </div>

      {error && <div role="alert" className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      <div className="flex gap-1 bg-gray-100 rounded-md p-1 w-fit overflow-x-auto">
        {(['document', 'clauses', 'evidence', 'export', 'versions', 'approvals'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-medium rounded capitalize whitespace-nowrap ${
              activeTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t === 'document' ? 'Document' : t === 'clauses' ? 'ISO clauses' : t}
          </button>
        ))}
      </div>

      {activeTab === 'document' && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} className={inputCls + ' font-mono'} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Version</label>
              <input value={version} onChange={(e) => setVersion(e.target.value)} className={inputCls + ' font-mono'} />
            </div>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className={`${inputCls} font-mono text-xs leading-relaxed`}
          />
          <div className="flex justify-end">
            <button type="button" onClick={saveDocContent} disabled={savingDoc} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-md">
              {savingDoc ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'clauses' && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs text-gray-500 mb-3">ISO 9001 clauses this document covers (inferred from document type).</p>
          {docClauses.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No clauses mapped.</p>
          ) : (
            <ul className="space-y-2">
              {docClauses.map((cn) => {
                const c = ISO_9001_CLAUSES.find((x) => x.number === cn)
                return (
                  <li key={cn} className="flex items-start gap-3 text-sm">
                    <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded flex-shrink-0">{cn}</span>
                    <span className="text-gray-700">{c?.title ?? '—'}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          {relatedEvidence.length === 0 ? (
            <p className="text-sm text-gray-500">No evidence linked to clauses covered by this document.</p>
          ) : (
            <ul className="space-y-2">
              {relatedEvidence.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 text-sm border border-gray-200 rounded-md px-3 py-2">
                  <span className="text-gray-900 truncate">{e.file_name ?? '(unnamed)'}</span>
                  <div className="flex gap-1">
                    {e.clause_ids.map((c) => (
                      <span key={c} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{c}</span>
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-500">{e.evidence_type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'export' && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs text-gray-500 mb-3">Export this document to share with auditors or your team.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => exportWord(doc, content)} className="text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md">Word (.doc)</button>
            <button type="button" onClick={() => window.print()} className="text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md">PDF (Print to PDF)</button>
            <button type="button" onClick={() => window.print()} className="text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md">Print</button>
            <button type="button" onClick={() => exportZipPlaceholder()} className="text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md">Bundle (HTML)</button>
          </div>
        </div>
      )}

      {activeTab === 'versions' && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs text-gray-500 mb-3">
            Every save creates a snapshot. Auditors can see exactly how this document evolved.
          </p>
          <div className="space-y-2">
            {versions.length === 0 && (
              <>
                <div className="flex items-center justify-between text-sm border border-gray-200 rounded-md px-3 py-2">
                  <div>
                    <span className="font-mono text-xs">v{doc.version}</span>
                    <span className="text-gray-500 ml-2">current</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(doc.updated_at).toLocaleString()}</span>
                </div>
                <p className="text-[11px] text-gray-500 italic">
                  No snapshots yet — they start with the next save. (If saves don&apos;t create
                  snapshots, run migration_document_control.sql in Supabase.)
                </p>
              </>
            )}
            {versions.map((v, i) => (
              <div key={v.id} className="border border-gray-200 rounded-md">
                <div className="flex items-center justify-between text-sm px-3 py-2">
                  <div className="min-w-0">
                    <span className="font-mono text-xs">v{v.version_no}.0</span>
                    {i === 0 && <span className="text-emerald-600 text-xs ml-2">current</span>}
                    {v.note && <span className="text-gray-500 text-xs ml-2">· {v.note}</span>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">
                      {v.created_by_email ?? ''} · {new Date(v.created_at).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewVersion(viewVersion?.id === v.id ? null : v)}
                      className="text-xs font-medium text-blue-700 hover:underline"
                    >
                      {viewVersion?.id === v.id ? 'Hide' : 'View'}
                    </button>
                    {i !== 0 && (
                      <button
                        type="button"
                        onClick={() => restoreVersion(v)}
                        className="text-xs font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 rounded px-2 py-0.5"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </div>
                {viewVersion?.id === v.id && (
                  <pre className="border-t border-gray-200 bg-gray-50 px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                    {v.content}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between gap-3 mb-5">
            {APPROVAL_STAGES.map((s, i) => {
              const idx = i + 1
              const done = stage > idx || (stage === 4 && idx <= 4)
              const current = stage === idx
              return (
                <div key={s} className="flex items-center gap-3 flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                        done ? 'bg-emerald-500 text-white' : current ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {done ? '✓' : idx}
                    </div>
                    <div className={`text-[10px] mt-1 ${current ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{s}</div>
                  </div>
                  {i < APPROVAL_STAGES.length - 1 && (
                    <div className={`flex-1 h-px ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {doc.status === 'draft' && (
              <button type="button" onClick={() => changeStatus('in_review', 'submitted_for_review')} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md">Submit for review</button>
            )}
            {doc.status === 'in_review' && (
              <>
                <button type="button" onClick={() => changeStatus('approved', 'approved')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-md">Approve (final)</button>
                <button type="button" onClick={() => changeStatus('draft', 'sent_back_to_draft')} className="text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md">Send back to draft</button>
              </>
            )}
            {doc.status === 'approved' && (
              <button type="button" onClick={() => changeStatus('obsolete', 'marked_obsolete')} className="text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md">Mark obsolete</button>
            )}
            {doc.status === 'obsolete' && (
              <button type="button" onClick={() => changeStatus('draft', 'reopened_as_draft')} className="text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md">Reopen as draft</button>
            )}
          </div>

          <div className="mt-6">
            <div className="text-xs font-semibold text-gray-700 mb-2">Audit trail</div>
            {events.length === 0 ? (
              <p className="text-[11px] text-gray-500 italic">
                No events recorded yet. (If this stays empty after actions, run
                migration_document_control.sql in Supabase.)
              </p>
            ) : (
              <ul className="space-y-1.5">
                {events.map((ev) => (
                  <li key={ev.id} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="font-medium text-gray-800">{EVENT_LABELS[ev.action] ?? ev.action}</span>
                    {ev.detail && <span className="text-gray-400">· {ev.detail}</span>}
                    <span className="text-gray-400 ml-auto shrink-0">
                      {ev.actor_email ?? 'unknown'} · {new Date(ev.created_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

function guessClausesForDoc(doc: Document): string[] {
  const type = (doc.document_type ?? '').toLowerCase()
  if (doc.document_code) {
    // If the code is itself a clause number like "4.1", surface it directly.
    if (/^\d+(\.\d+){1,3}$/.test(doc.document_code)) {
      return [doc.document_code]
    }
  }
  const map: { match: RegExp; clauses: string[] }[] = [
    { match: /ims policy|quality policy/i, clauses: ['5.2', '5.1'] },
    { match: /quality procedure/i, clauses: ['7.5', '4.4'] },
    { match: /risk/i, clauses: ['6.1'] },
    { match: /supplier evaluation|approved supplier/i, clauses: ['8.4'] },
    { match: /capa|corrective action|nonconformity/i, clauses: ['10.2'] },
    { match: /internal audit/i, clauses: ['9.2'] },
    { match: /training|competence/i, clauses: ['7.2', '7.3'] },
    { match: /management review/i, clauses: ['9.3'] },
    { match: /process card|process map/i, clauses: ['4.4'] },
  ]
  for (const { match, clauses } of map) {
    if (match.test(type) || match.test(doc.title)) return clauses
  }
  return []
}

function exportWord(doc: Document, content: string) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(doc.title)}</title>
<style>body{font-family:Calibri,Arial,sans-serif;max-width:720px;margin:40px auto;line-height:1.5;}h1{font-size:18pt;}pre{white-space:pre-wrap;font-family:inherit;font-size:11pt;}.meta{color:#666;font-size:10pt;margin-bottom:16pt;}</style></head><body>
<h1>${escapeHtml(doc.title)}</h1>
<div class="meta">Code: ${escapeHtml(doc.document_code ?? '—')} · Version: ${escapeHtml(doc.version)} · Status: ${escapeHtml(doc.status)}</div>
<pre>${escapeHtml(content)}</pre>
</body></html>`
  const blob = new Blob([html], { type: 'application/msword' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${(doc.document_code ?? doc.title).replace(/\s+/g, '-')}.doc`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(a.href)
}

function exportZipPlaceholder() {
  alert('True ZIP bundling requires adding the JSZip package. For now, use the Word button to download this document, or use the Export centre to bundle multiple documents into one HTML file.')
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
