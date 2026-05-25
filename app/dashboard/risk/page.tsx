'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Kind = 'risk' | 'opportunity'

type Risk = {
  id: string
  kind: Kind
  description: string
  process: string | null
  clause_id: string | null
  likelihood: number
  impact: number
  treatment: string | null
  responsible_name: string | null
  review_date: string | null
  status: string
  created_at: string
}

const TREATMENTS = ['Avoid', 'Reduce', 'Transfer', 'Accept'] as const

function levelOf(l: number, i: number): { label: string; bg: string; text: string } {
  const s = l * i
  if (s <= 5) return { label: 'Low', bg: 'bg-emerald-500', text: 'text-white' }
  if (s <= 12) return { label: 'Medium', bg: 'bg-amber-500', text: 'text-white' }
  return { label: 'High', bg: 'bg-red-500', text: 'text-white' }
}

export default function RiskPage() {
  const [tab, setTab] = useState<Kind>('risk')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [risks, setRisks] = useState<Risk[]>([])
  const [filterCell, setFilterCell] = useState<{ l: number; i: number } | null>(null)
  const [showForm, setShowForm] = useState(false)

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
        .from('risks')
        .select('*')
        .eq('company_id', userRow.company_id)
        .order('created_at', { ascending: false })
      if (cancelled) return
      setRisks((data ?? []) as Risk[])
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const matrix: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0))
  risks
    .filter((r) => r.kind === tab)
    .forEach((r) => {
      if (r.likelihood >= 1 && r.likelihood <= 5 && r.impact >= 1 && r.impact <= 5) {
        matrix[r.likelihood - 1][r.impact - 1]++
      }
    })

  const filteredRisks = risks
    .filter((r) => r.kind === tab)
    .filter(
      (r) => !filterCell || (r.likelihood === filterCell.l && r.impact === filterCell.i)
    )

  async function deleteRisk(id: string) {
    if (typeof window !== 'undefined' && !window.confirm('Delete this entry?')) return
    const supabase = createClient()
    const { error: e } = await supabase.from('risks').delete().eq('id', id)
    if (e) {
      setError(e.message)
      return
    }
    setRisks((prev) => prev.filter((r) => r.id !== id))
  }

  async function handleCreate(payload: Omit<Risk, 'id' | 'created_at' | 'status'>) {
    if (!companyId) return
    const supabase = createClient()
    const { data, error: e } = await supabase
      .from('risks')
      .insert({ ...payload, company_id: companyId, status: 'open' })
      .select('*')
      .single()
    if (e) {
      setError(e.message)
      return
    }
    if (data) {
      setRisks((prev) => [data as Risk, ...prev])
      setShowForm(false)
    }
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Risk & opportunity register
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track risks and opportunities to your quality management system.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md whitespace-nowrap"
        >
          + Add {tab === 'risk' ? 'risk' : 'opportunity'}
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-md p-1 w-fit">
        <TabButton
          active={tab === 'risk'}
          onClick={() => {
            setTab('risk')
            setFilterCell(null)
          }}
        >
          Risks
        </TabButton>
        <TabButton
          active={tab === 'opportunity'}
          onClick={() => {
            setTab('opportunity')
            setFilterCell(null)
          }}
        >
          Opportunities
        </TabButton>
      </div>

      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex gap-4 items-start flex-wrap">
        <RiskMatrix
          matrix={matrix}
          selectedCell={filterCell}
          onClickCell={(l, i) =>
            setFilterCell((prev) =>
              prev?.l === l && prev?.i === i ? null : { l, i }
            )
          }
        />
        {filterCell && (
          <div className="text-xs text-gray-600 mt-6 flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-md">
            <span>
              Showing only L{filterCell.l} × I{filterCell.i}
            </span>
            <button
              type="button"
              onClick={() => setFilterCell(null)}
              className="text-blue-700 hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <RiskTable rows={filteredRisks} onDelete={deleteRisk} />

      {showForm && (
        <AddRiskForm
          kind={tab}
          onClose={() => setShowForm(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded ${
        active
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

function RiskMatrix({
  matrix,
  onClickCell,
  selectedCell,
}: {
  matrix: number[][]
  onClickCell: (l: number, i: number) => void
  selectedCell: { l: number; i: number } | null
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h3 className="text-sm font-semibold mb-3">Risk matrix</h3>
      <div className="flex items-start">
        <div className="flex flex-col items-center pr-3 pt-8">
          <div
            className="text-[10px] uppercase tracking-wider text-gray-500"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Likelihood
          </div>
        </div>
        <div>
          <table>
            <tbody>
              {[5, 4, 3, 2, 1].map((l) => (
                <tr key={l}>
                  <td className="text-center text-xs font-medium text-gray-500 px-2 w-6">
                    {l}
                  </td>
                  {[1, 2, 3, 4, 5].map((i) => {
                    const count = matrix[l - 1][i - 1]
                    const lvl = levelOf(l, i)
                    const isSelected =
                      selectedCell?.l === l && selectedCell?.i === i
                    return (
                      <td key={i} className="p-0.5">
                        <button
                          type="button"
                          onClick={() => onClickCell(l, i)}
                          className={`w-14 h-14 rounded ${lvl.bg} ${lvl.text} flex items-center justify-center text-sm font-semibold transition ${
                            isSelected
                              ? 'ring-2 ring-blue-700 ring-offset-1'
                              : 'hover:opacity-90'
                          }`}
                          title={`L${l} × I${i} = ${l * i} (${lvl.label})`}
                        >
                          {count}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr>
                <td></td>
                {[1, 2, 3, 4, 5].map((i) => (
                  <td
                    key={i}
                    className="text-center text-xs font-medium text-gray-500 pt-1"
                  >
                    {i}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 text-center mt-2">
            Impact
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-4 text-[10px] text-gray-600">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-emerald-500" /> Low (1–5)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-500" /> Medium (6–12)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500" /> High (13–25)
        </span>
      </div>
    </div>
  )
}

function RiskTable({
  rows,
  onDelete,
}: {
  rows: Risk[]
  onDelete: (id: string) => void
}) {
  if (rows.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <p className="text-sm text-gray-500">No entries yet for this view.</p>
      </div>
    )
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-4 py-2.5">Description</th>
            <th className="px-4 py-2.5">Process</th>
            <th className="px-4 py-2.5">Clause</th>
            <th className="px-4 py-2.5 text-center">L</th>
            <th className="px-4 py-2.5 text-center">I</th>
            <th className="px-4 py-2.5">Level</th>
            <th className="px-4 py-2.5">Treatment</th>
            <th className="px-4 py-2.5">Owner</th>
            <th className="px-4 py-2.5">Review</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => {
            const lvl = levelOf(r.likelihood, r.impact)
            return (
              <tr key={r.id}>
                <td
                  className="px-4 py-3 text-gray-900 max-w-[260px] truncate"
                  title={r.description}
                >
                  {r.description}
                </td>
                <td className="px-4 py-3 text-gray-500">{r.process ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {r.clause_id ?? '—'}
                </td>
                <td className="px-4 py-3 text-center text-gray-700">{r.likelihood}</td>
                <td className="px-4 py-3 text-center text-gray-700">{r.impact}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${lvl.bg} ${lvl.text}`}
                  >
                    {lvl.label} ({r.likelihood * r.impact})
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{r.treatment ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700">
                  {r.responsible_name ?? '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {r.review_date ?? '—'}
                </td>
                <td className="px-4 py-3 capitalize text-xs text-gray-700">
                  {r.status}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(r.id)}
                    className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  )
}

function AddRiskForm({
  kind,
  onClose,
  onSubmit,
}: {
  kind: Kind
  onClose: () => void
  onSubmit: (r: Omit<Risk, 'id' | 'created_at' | 'status'>) => void | Promise<void>
}) {
  const [form, setForm] = useState({
    description: '',
    process: '',
    clause_id: '',
    likelihood: 3,
    impact: 3,
    treatment: 'Reduce',
    responsible_name: '',
    review_date: '',
  })
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description.trim()) return
    setSubmitting(true)
    await onSubmit({
      kind,
      description: form.description.trim(),
      process: form.process || null,
      clause_id: form.clause_id || null,
      likelihood: form.likelihood,
      impact: form.impact,
      treatment: form.treatment,
      responsible_name: form.responsible_name || null,
      review_date: form.review_date || null,
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Add {kind === 'risk' ? 'risk' : 'opportunity'}
        </h2>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Description" required>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={inputCls}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Process">
              <input
                value={form.process}
                onChange={(e) => setForm({ ...form, process: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Clause">
              <input
                value={form.clause_id}
                onChange={(e) => setForm({ ...form, clause_id: e.target.value })}
                placeholder="e.g. 8.4"
                className={inputCls}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Likelihood (1–5)" required>
              <select
                value={form.likelihood}
                onChange={(e) =>
                  setForm({ ...form, likelihood: parseInt(e.target.value, 10) })
                }
                className={inputCls}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Impact (1–5)" required>
              <select
                value={form.impact}
                onChange={(e) =>
                  setForm({ ...form, impact: parseInt(e.target.value, 10) })
                }
                className={inputCls}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Treatment">
            <select
              value={form.treatment}
              onChange={(e) => setForm({ ...form, treatment: e.target.value })}
              className={inputCls}
            >
              {TREATMENTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Responsible person">
            <input
              value={form.responsible_name}
              onChange={(e) =>
                setForm({ ...form, responsible_name: e.target.value })
              }
              className={inputCls}
            />
          </Field>
          <Field label="Review date">
            <input
              type="date"
              value={form.review_date}
              onChange={(e) => setForm({ ...form, review_date: e.target.value })}
              className={inputCls}
            />
          </Field>

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
