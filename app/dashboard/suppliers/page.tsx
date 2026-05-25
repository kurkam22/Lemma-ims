'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Criticality = 'low' | 'medium' | 'high' | 'critical'
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

type Supplier = {
  id: string
  name: string
  product: string | null
  criticality: Criticality
  cert_expiry: string | null
  approval_status: ApprovalStatus
  evaluation_score: number | null
  certificate_path: string | null
  created_at: string
}

const CRITICALITIES: Criticality[] = ['low', 'medium', 'high', 'critical']
const STATUSES: ApprovalStatus[] = ['pending', 'approved', 'rejected', 'suspended']

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function expiryInfo(date: string | null): {
  level: 'none' | 'ok' | 'warn' | 'critical' | 'expired'
  label: string
  days: number | null
} {
  if (!date) return { level: 'none', label: 'No expiry', days: null }
  const t = new Date(date).getTime()
  if (Number.isNaN(t)) return { level: 'none', label: 'Invalid date', days: null }
  const days = Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return { level: 'expired', label: `Expired ${Math.abs(days)}d ago`, days }
  if (days < 7) return { level: 'critical', label: `Expires in ${days}d`, days }
  if (days < 30) return { level: 'warn', label: `Expires in ${days}d`, days }
  return { level: 'ok', label: `Expires in ${days}d`, days }
}

export default function SuppliersPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filterStatus, setFilterStatus] = useState<'all' | ApprovalStatus>('all')
  const [filterCriticality, setFilterCriticality] = useState<'all' | Criticality>(
    'all'
  )
  const [showForm, setShowForm] = useState(false)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        .from('suppliers')
        .select('*')
        .eq('company_id', userRow.company_id)
        .order('created_at', { ascending: false })
      if (cancelled) return
      setSuppliers((data ?? []) as Supplier[])
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function createSupplier(payload: Omit<Supplier, 'id' | 'created_at' | 'certificate_path'>) {
    if (!companyId) return
    const supabase = createClient()
    const { data, error: e } = await supabase
      .from('suppliers')
      .insert({ ...payload, company_id: companyId })
      .select('*')
      .single()
    if (e) {
      setError(e.message)
      return
    }
    if (data) {
      setSuppliers((prev) => [data as Supplier, ...prev])
      setShowForm(false)
    }
  }

  async function updateField(
    id: string,
    field: keyof Supplier,
    value: string | number | null
  ) {
    const supabase = createClient()
    const { error: e } = await supabase
      .from('suppliers')
      .update({ [field]: value })
      .eq('id', id)
    if (e) {
      setError(e.message)
      return
    }
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? ({ ...s, [field]: value } as Supplier) : s))
    )
  }

  async function deleteSupplier(id: string) {
    if (typeof window !== 'undefined' && !window.confirm('Delete this supplier?'))
      return
    const supabase = createClient()
    const { error: e } = await supabase.from('suppliers').delete().eq('id', id)
    if (e) {
      setError(e.message)
      return
    }
    setSuppliers((prev) => prev.filter((s) => s.id !== id))
  }

  function triggerUpload(supplierId: string) {
    setUploadingFor(supplierId)
    fileInputRef.current?.click()
  }

  async function handleUpload(files: FileList | null) {
    if (!files || !uploadingFor || !companyId) return
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const file = files[0]
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${user.id}/suppliers/${uploadingFor}/${Date.now()}-${safeName}`
    const { error: upErr } = await supabase.storage
      .from('company-documents')
      .upload(path, file, { upsert: true })
    if (upErr) {
      setError(upErr.message)
      setUploadingFor(null)
      return
    }
    await updateField(uploadingFor, 'certificate_path', path)
    setUploadingFor(null)
  }

  function generateApprovedList() {
    const approved = suppliers.filter((s) => s.approval_status === 'approved')
    const headers = [
      'Name',
      'Product/service',
      'Criticality',
      'Cert expiry',
      'Evaluation score',
      'Status',
    ]
    const lines = [headers, ...approved.map((s) => [
      s.name,
      s.product ?? '',
      s.criticality,
      s.cert_expiry ?? '',
      s.evaluation_score?.toString() ?? '',
      s.approval_status,
    ])]
    const csv = lines
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')
    downloadBlob(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      'approved-suppliers.csv'
    )
  }

  function generateEvaluationForm() {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Supplier Evaluation Form</title>
<style>
  body { font-family: Calibri, Arial, sans-serif; max-width: 720px; margin: 40px auto; }
  h1 { font-size: 20pt; }
  h2 { font-size: 14pt; margin-top: 24pt; }
  table { width: 100%; border-collapse: collapse; margin-top: 8pt; }
  td, th { border: 1pt solid #444; padding: 6pt; vertical-align: top; }
  .label { width: 30%; background: #f0f0f0; }
  .blank { height: 24pt; }
</style></head>
<body>
<h1>Supplier Evaluation Form</h1>
<p>Use this form to evaluate a supplier against the criteria below. One form per supplier per evaluation period.</p>

<table>
  <tr><td class="label">Supplier name</td><td class="blank"></td></tr>
  <tr><td class="label">Product / service supplied</td><td class="blank"></td></tr>
  <tr><td class="label">Evaluation date</td><td class="blank"></td></tr>
  <tr><td class="label">Evaluated by</td><td class="blank"></td></tr>
</table>

<h2>Evaluation criteria</h2>
<table>
  <tr><th>Criterion</th><th>Weight</th><th>Score (1–5)</th><th>Notes</th></tr>
  <tr><td>Quality of product / service</td><td>30%</td><td></td><td></td></tr>
  <tr><td>On-time delivery</td><td>20%</td><td></td><td></td></tr>
  <tr><td>Documentation & traceability</td><td>15%</td><td></td><td></td></tr>
  <tr><td>Responsiveness to issues</td><td>15%</td><td></td><td></td></tr>
  <tr><td>Compliance with specifications</td><td>10%</td><td></td><td></td></tr>
  <tr><td>Commercial terms</td><td>10%</td><td></td><td></td></tr>
</table>

<h2>Outcome</h2>
<table>
  <tr><td class="label">Total weighted score</td><td class="blank"></td></tr>
  <tr><td class="label">Approval decision</td><td class="blank">Approved &nbsp;/&nbsp; Conditional &nbsp;/&nbsp; Rejected</td></tr>
  <tr><td class="label">Next review date</td><td class="blank"></td></tr>
  <tr><td class="label">Signed (QMS manager)</td><td class="blank"></td></tr>
</table>

</body></html>`
    downloadBlob(
      new Blob([html], { type: 'application/msword' }),
      'supplier-evaluation-form.doc'
    )
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  const filtered = suppliers.filter((s) => {
    if (filterStatus !== 'all' && s.approval_status !== filterStatus) return false
    if (filterCriticality !== 'all' && s.criticality !== filterCriticality) return false
    return true
  })

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Approved supplier list, certificates, and evaluations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={generateApprovedList}
            className="text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md"
          >
            Approved list (CSV)
          </button>
          <button
            type="button"
            onClick={generateEvaluationForm}
            className="text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md"
          >
            Evaluation form (Word)
          </button>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            + Add supplier
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

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => {
          handleUpload(e.target.files)
          e.target.value = ''
        }}
      />

      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex gap-1 bg-gray-100 rounded-md p-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 px-2 self-center">
            Status:
          </span>
          {(['all', ...STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s as 'all' | ApprovalStatus)}
              className={`px-3 py-1.5 text-xs font-medium rounded capitalize ${
                filterStatus === s
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-md p-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 px-2 self-center">
            Criticality:
          </span>
          {(['all', ...CRITICALITIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilterCriticality(c as 'all' | Criticality)}
              className={`px-3 py-1.5 text-xs font-medium rounded capitalize ${
                filterCriticality === c
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">No suppliers match this filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Product</th>
                <th className="px-4 py-2.5">Criticality</th>
                <th className="px-4 py-2.5">Cert expiry</th>
                <th className="px-4 py-2.5">Score</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Cert</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => {
                const exp = expiryInfo(s.cert_expiry)
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-gray-900 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">
                      {s.product ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <CritBadge value={s.criticality} />
                    </td>
                    <td className="px-4 py-3">
                      <ExpiryBadge expiry={exp} date={s.cert_expiry} />
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {s.evaluation_score?.toFixed(1) ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={s.approval_status}
                        onChange={(e) =>
                          updateField(s.id, 'approval_status', e.target.value)
                        }
                        className="text-xs border border-gray-200 rounded px-2 py-1 bg-white capitalize"
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {s.certificate_path ? (
                        <span
                          className="text-[10px] text-emerald-700 font-medium"
                          title={s.certificate_path}
                        >
                          ✓ Uploaded
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => triggerUpload(s.id)}
                          className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium"
                        >
                          {s.certificate_path ? 'Replace cert' : 'Upload cert'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSupplier(s.id)}
                          className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <AddSupplierForm
          onClose={() => setShowForm(false)}
          onSubmit={createSupplier}
        />
      )}
    </div>
  )
}

function CritBadge({ value }: { value: Criticality }) {
  const map: Record<Criticality, [string, string]> = {
    low: ['Low', 'bg-gray-100 text-gray-600'],
    medium: ['Medium', 'bg-amber-50 text-amber-700'],
    high: ['High', 'bg-red-50 text-red-700'],
    critical: ['Critical', 'bg-red-100 text-red-800'],
  }
  const [label, cls] = map[value]
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${cls}`}>{label}</span>
  )
}

function ExpiryBadge({
  expiry,
  date,
}: {
  expiry: ReturnType<typeof expiryInfo>
  date: string | null
}) {
  if (expiry.level === 'none') {
    return <span className="text-xs text-gray-400">{date ?? '—'}</span>
  }
  const cls =
    expiry.level === 'expired' || expiry.level === 'critical'
      ? 'bg-red-50 text-red-700 border-red-200'
      : expiry.level === 'warn'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-700">{date}</span>
      <span
        className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border w-fit ${cls}`}
      >
        {expiry.label}
      </span>
    </div>
  )
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

function AddSupplierForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (s: Omit<Supplier, 'id' | 'created_at' | 'certificate_path'>) => void | Promise<void>
}) {
  const [form, setForm] = useState({
    name: '',
    product: '',
    criticality: 'medium' as Criticality,
    cert_expiry: '',
    approval_status: 'pending' as ApprovalStatus,
    evaluation_score: '',
  })
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    await onSubmit({
      name: form.name.trim(),
      product: form.product || null,
      criticality: form.criticality,
      cert_expiry: form.cert_expiry || null,
      approval_status: form.approval_status,
      evaluation_score: form.evaluation_score
        ? parseFloat(form.evaluation_score)
        : null,
    })
    setSubmitting(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-20 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add supplier</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Supplier name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Product / service supplied
            </label>
            <input
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
              className={inputCls}
              placeholder="e.g. Rubber soles, calibration services"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Criticality
              </label>
              <select
                value={form.criticality}
                onChange={(e) =>
                  setForm({ ...form, criticality: e.target.value as Criticality })
                }
                className={`${inputCls} capitalize`}
              >
                {CRITICALITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Approval status
              </label>
              <select
                value={form.approval_status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    approval_status: e.target.value as ApprovalStatus,
                  })
                }
                className={`${inputCls} capitalize`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Certificate expiry
              </label>
              <input
                type="date"
                value={form.cert_expiry}
                onChange={(e) => setForm({ ...form, cert_expiry: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Evaluation score (0–100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.evaluation_score}
                onChange={(e) =>
                  setForm({ ...form, evaluation_score: e.target.value })
                }
                className={inputCls}
                placeholder="e.g. 85"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium text-gray-700 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-md"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
