'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Tab = 'records' | 'matrix' | 'plan'

type Training = {
  id: string
  kind: 'record' | 'plan'
  employee_name: string | null
  module: string
  training_date: string | null
  scheduled_month: string | null
  result: string | null
  evidence_url: string | null
  trainer: string | null
  status: string
  created_at: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

export default function TrainingPage() {
  const [tab, setTab] = useState<Tab>('records')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [trainings, setTrainings] = useState<Training[]>([])
  const [showForm, setShowForm] = useState<null | 'record' | 'plan'>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: userRow } = await supabase.from('users').select('company_id').eq('id', user.id).maybeSingle()
      if (!userRow?.company_id) { setLoading(false); return }
      setCompanyId(userRow.company_id)
      const { data } = await supabase.from('trainings').select('*').eq('company_id', userRow.company_id).order('created_at', { ascending: false })
      if (cancelled) return
      setTrainings((data ?? []) as Training[])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function createTraining(payload: Partial<Training>) {
    if (!companyId) return
    const supabase = createClient()
    const { data, error: e } = await supabase
      .from('trainings')
      .insert({ ...payload, company_id: companyId })
      .select('*')
      .single()
    if (e) { setError(e.message); return }
    if (data) {
      setTrainings(prev => [data as Training, ...prev])
      setShowForm(null)
    }
  }

  async function deleteTraining(id: string) {
    if (typeof window !== 'undefined' && !window.confirm('Delete this entry?')) return
    const supabase = createClient()
    const { error: e } = await supabase.from('trainings').delete().eq('id', id)
    if (e) { setError(e.message); return }
    setTrainings(prev => prev.filter(t => t.id !== id))
  }

  async function generatePlan() {
    if (!companyId) return
    const supabase = createClient()
    const topics = [
      { topic: 'ISO 9001 awareness', audience: 'All employees' },
      { topic: 'Document control', audience: 'Department heads' },
      { topic: 'Internal audit techniques', audience: 'Audit team' },
      { topic: 'Root cause analysis (5 Whys)', audience: 'QMS team' },
      { topic: 'Customer requirements review', audience: 'Sales' },
      { topic: 'Supplier evaluation', audience: 'Procurement' },
    ]
    const year = new Date().getFullYear()
    const rows = topics.map((t, i) => ({
      company_id: companyId,
      kind: 'plan' as const,
      module: t.topic,
      employee_name: t.audience,
      scheduled_month: `${year}-${String(i * 2 + 1).padStart(2, '0')}`,
      trainer: null,
      status: 'planned',
    }))
    const { data, error: e } = await supabase.from('trainings').insert(rows).select('*')
    if (e) { setError(e.message); return }
    if (data) setTrainings(prev => [...(data as Training[]), ...prev])
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  const records = trainings.filter(t => t.kind === 'record')
  const plans = trainings.filter(t => t.kind === 'plan')

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Training</h1>
          <p className="text-sm text-gray-500 mt-1">Records, competence matrix, and the annual training plan.</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-md p-1 w-fit">
        <TabBtn active={tab === 'records'} onClick={() => setTab('records')}>Training records</TabBtn>
        <TabBtn active={tab === 'matrix'} onClick={() => setTab('matrix')}>Competence matrix</TabBtn>
        <TabBtn active={tab === 'plan'} onClick={() => setTab('plan')}>Training plan</TabBtn>
      </div>

      {tab === 'records' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button type="button" onClick={() => setShowForm('record')} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md">+ Add training record</button>
          </div>
          {records.length === 0 ? (
            <Empty msg="No training records yet." />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-2.5">Employee</th>
                    <th className="px-4 py-2.5">Module</th>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Result</th>
                    <th className="px-4 py-2.5">Evidence</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map(r => (
                    <tr key={r.id}>
                      <td className="px-4 py-3 text-gray-900">{r.employee_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{r.module}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{r.training_date ?? '—'}</td>
                      <td className="px-4 py-3"><ResultBadge result={r.result} /></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{r.evidence_url ? <a href={r.evidence_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a> : '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-700 capitalize">{r.status}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteTraining(r.id)} className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'matrix' && <Matrix records={records} />}

      {tab === 'plan' && (
        <div className="space-y-3">
          <div className="flex justify-end gap-2">
            <button type="button" onClick={generatePlan} className="text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md">Generate plan</button>
            <button type="button" onClick={() => setShowForm('plan')} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md">+ Add plan item</button>
          </div>
          {plans.length === 0 ? (
            <Empty msg="No plan items yet." />
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-2.5">Month</th>
                    <th className="px-4 py-2.5">Topic</th>
                    <th className="px-4 py-2.5">Who</th>
                    <th className="px-4 py-2.5">Trainer</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {plans.map(p => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 text-xs text-gray-500">{p.scheduled_month ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-900">{p.module}</td>
                      <td className="px-4 py-3 text-gray-700">{p.employee_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{p.trainer ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-700 capitalize">{p.status}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteTraining(p.id)} className="text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showForm && <TrainingForm kind={showForm} onClose={() => setShowForm(null)} onSubmit={createTraining} />}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`px-3 py-1.5 text-xs font-medium rounded ${active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
      {children}
    </button>
  )
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
      <p className="text-sm text-gray-500">{msg}</p>
    </div>
  )
}

function ResultBadge({ result }: { result: string | null }) {
  if (!result) return <span className="text-xs text-gray-400">—</span>
  const map: Record<string, [string, string]> = {
    pass: ['Pass', 'bg-emerald-50 text-emerald-700'],
    fail: ['Fail', 'bg-red-50 text-red-700'],
    pending: ['Pending', 'bg-amber-50 text-amber-700'],
  }
  const [label, cls] = map[result] ?? [result, 'bg-gray-100 text-gray-600']
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${cls}`}>{label}</span>
}

function Matrix({ records }: { records: Training[] }) {
  const employees = Array.from(new Set(records.map(r => r.employee_name).filter(Boolean) as string[])).sort()
  const modules = Array.from(new Set(records.map(r => r.module))).sort()

  if (employees.length === 0 || modules.length === 0) {
    return <Empty msg="Add training records to see the competence matrix." />
  }

  function cellResult(emp: string, mod: string) {
    const matches = records.filter(r => r.employee_name === emp && r.module === mod)
    if (matches.length === 0) return 'missing'
    if (matches.some(r => r.result === 'pass')) return 'pass'
    if (matches.some(r => r.result === 'pending')) return 'pending'
    return 'fail'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500 sticky left-0 bg-gray-50">Employee</th>
            {modules.map(m => (
              <th key={m} className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500">{m}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {employees.map(emp => (
            <tr key={emp}>
              <td className="px-4 py-3 text-gray-900 font-medium sticky left-0 bg-white">{emp}</td>
              {modules.map(mod => {
                const r = cellResult(emp, mod)
                const map: Record<string, [string, string]> = {
                  pass: ['✓', 'bg-emerald-100 text-emerald-700'],
                  pending: ['…', 'bg-amber-100 text-amber-700'],
                  fail: ['✗', 'bg-red-100 text-red-700'],
                  missing: ['·', 'bg-gray-50 text-gray-400'],
                }
                const [label, cls] = map[r]
                return (
                  <td key={mod} className="px-2 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${cls}`}>{label}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TrainingForm({ kind, onClose, onSubmit }: { kind: 'record' | 'plan'; onClose: () => void; onSubmit: (payload: Partial<Training>) => void | Promise<void> }) {
  const [form, setForm] = useState({
    employee_name: '',
    module: '',
    training_date: '',
    scheduled_month: '',
    result: 'pending',
    trainer: '',
    status: kind === 'record' ? 'completed' : 'planned',
  })
  const [submitting, setSubmitting] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.module.trim()) return
    setSubmitting(true)
    const payload: Partial<Training> = {
      kind,
      employee_name: form.employee_name || null,
      module: form.module.trim(),
      training_date: kind === 'record' ? (form.training_date || null) : null,
      scheduled_month: kind === 'plan' ? (form.scheduled_month || null) : null,
      result: kind === 'record' ? form.result : null,
      trainer: form.trainer || null,
      status: form.status,
    }
    await onSubmit(payload)
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-20 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{kind === 'record' ? 'Add training record' : 'Add plan item'}</h2>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{kind === 'record' ? 'Employee' : 'Audience'}</label>
            <input value={form.employee_name} onChange={e => setForm({ ...form, employee_name: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{kind === 'record' ? 'Module' : 'Topic'} <span className="text-red-500">*</span></label>
            <input value={form.module} onChange={e => setForm({ ...form, module: e.target.value })} className={inputCls} required />
          </div>
          {kind === 'record' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={form.training_date} onChange={e => setForm({ ...form, training_date: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Result</label>
                  <select value={form.result} onChange={e => setForm({ ...form, result: e.target.value })} className={inputCls}>
                    <option value="pending">Pending</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Month (YYYY-MM)</label>
              <input type="month" value={form.scheduled_month} onChange={e => setForm({ ...form, scheduled_month: e.target.value })} className={inputCls} />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Trainer</label>
            <input value={form.trainer} onChange={e => setForm({ ...form, trainer: e.target.value })} className={inputCls} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-sm font-medium text-gray-700 px-4 py-2">Cancel</button>
            <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-md">{submitting ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
