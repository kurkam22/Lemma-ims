'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const EVIDENCE_TYPES = [
  'Policy',
  'Procedure',
  'Record',
  'Certificate',
  'Training record',
  'Audit report',
  'Risk register',
  'Other',
] as const

const ACCEPT = '.pdf,.docx,.xlsx,.png,.jpg,.jpeg'

type Evidence = {
  id: string
  file_name: string | null
  evidence_type: string
  clause_ids: string[]
  expiry_date: string | null
  user_confirmed: boolean
  status: string
  created_at: string
}

type ExpiryLevel = 'none' | 'ok' | 'warn' | 'expired'

export default function EvidencePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [rows, setRows] = useState<Evidence[]>([])

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
      setCompanyId(userRow.company_id)
      const { data } = await supabase
        .from('evidence')
        .select('*')
        .eq('company_id', userRow.company_id)
        .order('created_at', { ascending: false })
      if (cancelled) return
      setRows((data ?? []) as Evidence[])
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function uploadFiles(fileList: FileList | File[]) {
    if (!companyId) return
    setError(null)
    setUploading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setUploading(false)
      return
    }

    for (const file of Array.from(fileList)) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${user.id}/evidence/${id}-${safeName}`

      const { error: upErr } = await supabase.storage
        .from('company-documents')
        .upload(path, file)
      if (upErr) {
        setError(`Upload failed for ${file.name}: ${upErr.message}`)
        continue
      }

      let classification: { evidence_type: string; clauses: string[] } = {
        evidence_type: 'Other',
        clauses: [],
      }
      try {
        const res = await fetch('/api/evidence/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name }),
        })
        if (res.ok) {
          const data = await res.json()
          classification = {
            evidence_type: typeof data.evidence_type === 'string' ? data.evidence_type : 'Other',
            clauses: Array.isArray(data.clauses) ? data.clauses : [],
          }
        }
      } catch {
        // Fall through with defaults.
      }

      const { data: ins, error: insErr } = await supabase
        .from('evidence')
        .insert({
          company_id: companyId,
          file_name: file.name,
          evidence_type: classification.evidence_type,
          clause_ids: classification.clauses,
          status: 'active',
          user_confirmed: false,
        })
        .select('*')
        .single()

      if (insErr) {
        setError(`Save failed for ${file.name}: ${insErr.message}`)
        continue
      }
      if (ins) setRows((prev) => [ins as Evidence, ...prev])
    }
    setUploading(false)
  }

  async function updateField(
    id: string,
    field: 'evidence_type' | 'expiry_date' | 'user_confirmed',
    value: string | boolean | null
  ) {
    const supabase = createClient()
    const { error: e } = await supabase
      .from('evidence')
      .update({ [field]: value })
      .eq('id', id)
    if (e) {
      setError(e.message)
      return
    }
    setRows((prev) =>
      prev.map((r) => (r.id === id ? ({ ...r, [field]: value } as Evidence) : r))
    )
  }

  async function reclassify(id: string, fileName: string | null) {
    if (!fileName) return
    setError(null)
    try {
      const res = await fetch('/api/evidence/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      })
      if (!res.ok) {
        setError('Classification failed.')
        return
      }
      const data = await res.json()
      const evidenceType =
        typeof data.evidence_type === 'string' ? data.evidence_type : 'Other'
      const clauses = Array.isArray(data.clauses) ? data.clauses : []
      const supabase = createClient()
      const { error: e } = await supabase
        .from('evidence')
        .update({ evidence_type: evidenceType, clause_ids: clauses })
        .eq('id', id)
      if (e) {
        setError(e.message)
        return
      }
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, evidence_type: evidenceType, clause_ids: clauses } : r
        )
      )
    } catch {
      setError('Classification failed.')
    }
  }

  async function deleteRow(id: string) {
    if (typeof window !== 'undefined' && !window.confirm('Delete this evidence?')) return
    const supabase = createClient()
    const { error: e } = await supabase.from('evidence').delete().eq('id', id)
    if (e) {
      setError(e.message)
      return
    }
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Evidence</h1>
          <p className="text-sm text-gray-500 mt-1">
            Records, certificates, and other proof for your ISO clauses. Files are
            classified by AI on upload.
          </p>
        </div>
        <div className="flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              if (e.target.files) uploadFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            {uploading ? 'Uploading…' : '+ Upload evidence'}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatusCard
          label="Active"
          count={rows.filter((r) => computeExpiry(r.expiry_date).level === 'ok').length}
          accent="emerald"
        />
        <StatusCard
          label="Expiring soon"
          count={rows.filter((r) => computeExpiry(r.expiry_date).level === 'warn').length}
          accent="amber"
        />
        <StatusCard
          label="Expired"
          count={
            rows.filter((r) => computeExpiry(r.expiry_date).level === 'expired').length
          }
          accent="red"
        />
        <StatusCard
          label="No expiry"
          count={rows.filter((r) => !r.expiry_date).length}
          accent="gray"
        />
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">No evidence uploaded yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Click Upload to add your first file.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5">File</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Clauses</th>
                <th className="px-4 py-2.5">Expiry</th>
                <th className="px-4 py-2.5">Confirmed</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td
                    className="px-4 py-3 text-gray-900 max-w-[240px] truncate"
                    title={r.file_name ?? ''}
                  >
                    {r.file_name}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={
                        (EVIDENCE_TYPES as readonly string[]).includes(r.evidence_type)
                          ? r.evidence_type
                          : 'Other'
                      }
                      onChange={(e) => updateField(r.id, 'evidence_type', e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                    >
                      {EVIDENCE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {r.clause_ids.length === 0 ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {r.clause_ids.map((cid) => (
                          <span
                            key={cid}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700"
                          >
                            {cid}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ExpiryCell
                      expiryDate={r.expiry_date}
                      onChange={(d) => updateField(r.id, 'expiry_date', d || null)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={r.user_confirmed}
                      onChange={(e) =>
                        updateField(r.id, 'user_confirmed', e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => reclassify(r.id, r.file_name)}
                        className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                      >
                        Reclassify
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRow(r.id)}
                        className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 font-medium"
                      >
                        Delete
                      </button>
                    </div>
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

function computeExpiry(date: string | null): {
  level: ExpiryLevel
  days: number | null
  label: string
} {
  if (!date) return { level: 'none', days: null, label: 'No expiry' }
  const t = new Date(date).getTime()
  if (Number.isNaN(t)) return { level: 'none', days: null, label: 'Invalid date' }
  const days = Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0)
    return { level: 'expired', days, label: `Expired ${Math.abs(days)}d ago` }
  if (days <= 30) return { level: 'warn', days, label: `Expires in ${days}d` }
  return { level: 'ok', days, label: `Expires in ${days}d` }
}

function ExpiryCell({
  expiryDate,
  onChange,
}: {
  expiryDate: string | null
  onChange: (d: string) => void
}) {
  const info = computeExpiry(expiryDate)
  const cls =
    info.level === 'expired'
      ? 'border-red-300 text-red-700 bg-red-50'
      : info.level === 'warn'
        ? 'border-amber-300 text-amber-700 bg-amber-50'
        : info.level === 'ok'
          ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
          : 'border-gray-200 text-gray-600 bg-white'
  return (
    <div className="space-y-1">
      <input
        type="date"
        value={expiryDate ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`text-xs border rounded px-2 py-1 ${cls}`}
      />
      {info.level !== 'none' && (
        <div
          className={`text-[10px] ${
            info.level === 'expired'
              ? 'text-red-600'
              : info.level === 'warn'
                ? 'text-amber-600'
                : 'text-emerald-600'
          }`}
        >
          {info.label}
        </div>
      )}
    </div>
  )
}

function StatusCard({
  label,
  count,
  accent,
}: {
  label: string
  count: number
  accent: 'emerald' | 'amber' | 'red' | 'gray'
}) {
  const cls = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    gray: 'text-gray-700',
  }[accent]
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className={`text-2xl font-semibold mt-1 ${cls}`}>{count}</div>
    </div>
  )
}
