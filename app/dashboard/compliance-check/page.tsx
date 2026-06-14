'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { STANDARDS } from '@/lib/iso-clauses'

type Status = 'covered' | 'partial' | 'missing' | 'not_applicable'

type CheckResult = {
  clause: string
  title: string
  status: Status
  evidence: string
  gaps: string
  recommendation: string
}

type StoredDoc = { id: string; title: string; document_type: string; content: string | null }

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  covered: { label: 'Covered', cls: 'bg-green-50 text-green-700 border-green-200' },
  partial: { label: 'Partial', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  missing: { label: 'Missing', cls: 'bg-red-50 text-red-700 border-red-200' },
  not_applicable: { label: 'N/A', cls: 'bg-gray-50 text-gray-500 border-gray-200' },
}

const BATCH_HINT = 12

export default function ComplianceCheckPage() {
  const [docs, setDocs] = useState<StoredDoc[]>([])
  const [selectedDocId, setSelectedDocId] = useState('')
  const [text, setText] = useState('')
  const [standard, setStandard] = useState('iso9001')
  const [selectedClauses, setSelectedClauses] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<CheckResult[] | null>(null)
  const [summary, setSummary] = useState<Record<string, number> | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const std = STANDARDS.find((s) => s.shortCode === standard) ?? STANDARDS[0]
  const clauseOptions = std.clauses

  useEffect(() => {
    async function loadDocs() {
      const supabase = createClient()
      const { data } = await supabase
        .from('documents')
        .select('id, title, document_type, content')
        .order('updated_at', { ascending: false })
        .limit(50)
      setDocs((data as StoredDoc[]) ?? [])
    }
    loadDocs()
  }, [])

  function pickDoc(id: string) {
    setSelectedDocId(id)
    const d = docs.find((x) => x.id === id)
    if (d?.content) setText(d.content)
  }

  function toggleClause(n: string) {
    setSelectedClauses((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    )
  }

  async function runCheck() {
    setError(null)
    setResults(null)
    setSummary(null)

    if (text.trim().length < 50) {
      setError('Paste or select a document first (at least 50 characters).')
      return
    }
    const clauses =
      selectedClauses.length > 0
        ? selectedClauses
        : clauseOptions.slice(0, BATCH_HINT).map((c) => c.number)
    if (clauses.length > BATCH_HINT) {
      setError(`Select at most ${BATCH_HINT} clauses per check.`)
      return
    }

    setRunning(true)
    try {
      const res = await fetch('/api/documents/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText: text, standard, clauses }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Check failed.')
        return
      }
      setResults(data.results)
      setSummary(data.summary)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">AI compliance check</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Check a document against {std.code} clause requirements. The AI flags what is
          covered, partial, or missing — with evidence from your own text.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Standard
            </label>
            <select
              value={standard}
              onChange={(e) => {
                setStandard(e.target.value)
                setSelectedClauses([])
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {STANDARDS.filter((s) => s.clauses.length > 0).map((s) => (
                <option key={s.shortCode} value={s.shortCode}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Load a saved document (optional)
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => pickDoc(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">— paste text manually —</option>
              {docs
                .filter((d) => d.content)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.document_type})
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Document text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Paste the document to check…"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono"
          />
          <div className="text-xs text-gray-400 mt-1">{text.length.toLocaleString()} characters</div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Clauses to check{' '}
            <span className="font-normal text-gray-400">
              (none selected = first {BATCH_HINT}; max {BATCH_HINT} per run)
            </span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {clauseOptions.map((c) => {
              const on = selectedClauses.includes(c.number)
              return (
                <button
                  key={c.number}
                  type="button"
                  onClick={() => toggleClause(c.number)}
                  title={c.title}
                  className={`text-xs px-2 py-1 rounded-md border ${
                    on
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {c.number}
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={runCheck}
          disabled={running}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          {running ? 'Checking…' : 'Run compliance check'}
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['covered', 'partial', 'missing', 'not_applicable'] as Status[]).map((s) => (
            <div key={s} className={`border rounded-lg p-3 ${STATUS_META[s].cls}`}>
              <div className="text-2xl font-semibold">{summary[s] ?? 0}</div>
              <div className="text-xs font-medium">{STATUS_META[s].label}</div>
            </div>
          ))}
        </div>
      )}

      {results && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500">
                <th className="px-4 py-2 font-medium w-20">Clause</th>
                <th className="px-4 py-2 font-medium">Title</th>
                <th className="px-4 py-2 font-medium w-28">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <ResultRow
                  key={r.clause}
                  r={r}
                  open={expanded === r.clause}
                  onToggle={() =>
                    setExpanded(expanded === r.clause ? null : r.clause)
                  }
                />
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-400">
            AI assessment — review findings before relying on them for certification.
            Click a row for evidence and recommendations.
          </div>
        </div>
      )}
    </div>
  )
}

function ResultRow({
  r,
  open,
  onToggle,
}: {
  r: CheckResult
  open: boolean
  onToggle: () => void
}) {
  const meta = STATUS_META[r.status]
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
      >
        <td className="px-4 py-2.5 font-medium text-gray-900">{r.clause}</td>
        <td className="px-4 py-2.5 text-gray-700">{r.title}</td>
        <td className="px-4 py-2.5">
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${meta.cls}`}>
            {meta.label}
          </span>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-gray-100 bg-gray-50">
          <td colSpan={3} className="px-4 py-3 space-y-2">
            {r.evidence && (
              <div className="text-xs">
                <span className="font-medium text-gray-700">Evidence in your document: </span>
                <span className="text-gray-600">{r.evidence}</span>
              </div>
            )}
            {r.gaps && (
              <div className="text-xs">
                <span className="font-medium text-gray-700">Gaps: </span>
                <span className="text-gray-600">{r.gaps}</span>
              </div>
            )}
            {r.recommendation && (
              <div className="text-xs">
                <span className="font-medium text-gray-700">Recommendation: </span>
                <span className="text-gray-600">{r.recommendation}</span>
              </div>
            )}
            {!r.evidence && !r.gaps && !r.recommendation && (
              <div className="text-xs text-gray-500">Fully covered — nothing to flag.</div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
