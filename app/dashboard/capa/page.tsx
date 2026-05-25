'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type CapaStatus = 'open' | 'in_progress' | 'verified' | 'closed'
type FilterKey = 'all' | 'open' | 'in_progress' | 'overdue' | 'closed'

type Capa = {
  id: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: CapaStatus
  responsible_id: string | null
  due_date: string | null
  root_cause: string | null
  corrective_action: string | null
  immediate_fix: string | null
  five_whys: string[]
  evidence_ids: string[]
  effectiveness_check: string | null
  closed_at: string | null
  current_step: number
  created_at: string
}

type UserRow = { id: string; full_name: string | null; email: string }

type EvidenceRow = { id: string; file_name: string | null; evidence_type: string }

const STEPS = [
  {
    num: 1,
    label: 'Problem description',
    plain:
      'Describe the problem clearly. What happened? When and where? Who noticed it?',
  },
  {
    num: 2,
    label: 'Immediate fix',
    plain:
      "What you did right away to stop the bleeding — a quick fix or workaround. Doesn't address the root cause yet.",
  },
  {
    num: 3,
    label: 'Root cause (5 Whys)',
    plain:
      "Keep asking 'why' until you reach the real cause. Most problems have one — keep digging past the surface symptoms.",
  },
  {
    num: 4,
    label: 'Corrective action',
    plain:
      'The permanent fix that prevents the root cause from happening again. Different from the immediate fix.',
  },
  {
    num: 5,
    label: 'Assign owner & deadline',
    plain:
      'One person is accountable. Pick a realistic deadline. If no one owns it, nothing happens.',
  },
  {
    num: 6,
    label: 'Upload evidence',
    plain:
      "Attach evidence the corrective action was done — records, screenshots, training certificates, whatever proves it's real.",
  },
  {
    num: 7,
    label: 'Close with effectiveness check',
    plain:
      'Verify the fix actually worked. Has the problem recurred? If yes, reopen. If no, close it.',
  },
] as const

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function isOverdue(c: Capa): boolean {
  if (c.status === 'closed' || c.status === 'verified') return false
  if (!c.due_date) return false
  const t = new Date(c.due_date).getTime()
  return !Number.isNaN(t) && t < Date.now()
}

function statusFromStep(step: number, closed: boolean): CapaStatus {
  if (closed) return 'closed'
  if (step <= 2) return 'open'
  return 'in_progress'
}

export default function CapaPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [capas, setCapas] = useState<Capa[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [evidence, setEvidence] = useState<EvidenceRow[]>([])
  const [filter, setFilter] = useState<FilterKey>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newDescription, setNewDescription] = useState('')

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
      const cid = userRow.company_id
      const [capasRes, usersRes, evRes] = await Promise.all([
        supabase
          .from('capas')
          .select('*')
          .eq('company_id', cid)
          .order('created_at', { ascending: false }),
        supabase
          .from('users')
          .select('id, full_name, email')
          .eq('company_id', cid),
        supabase
          .from('evidence')
          .select('id, file_name, evidence_type')
          .eq('company_id', cid)
          .order('created_at', { ascending: false }),
      ])
      if (cancelled) return
      setCompanyId(cid)
      setCapas((capasRes.data ?? []).map(normaliseCapa))
      setUsers((usersRes.data ?? []) as UserRow[])
      setEvidence((evRes.data ?? []) as EvidenceRow[])
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function createCapa() {
    if (!companyId || !newDescription.trim()) return
    const supabase = createClient()
    const { data, error: e } = await supabase
      .from('capas')
      .insert({
        company_id: companyId,
        description: newDescription.trim(),
        severity: 'medium',
        status: 'open',
        current_step: 1,
      })
      .select('*')
      .single()
    if (e) {
      setError(e.message)
      return
    }
    if (data) {
      const c = normaliseCapa(data)
      setCapas((prev) => [c, ...prev])
      setSelectedId(c.id)
      setCreating(false)
      setNewDescription('')
    }
  }

  async function updateCapa(id: string, patch: Partial<Capa>) {
    const supabase = createClient()
    setError(null)
    const dbPatch: Record<string, unknown> = { ...patch }
    // jsonb fields need direct array values; supabase-js stringifies them properly
    const { data, error: e } = await supabase
      .from('capas')
      .update(dbPatch)
      .eq('id', id)
      .select('*')
      .single()
    if (e) {
      setError(e.message)
      return
    }
    if (data) {
      const c = normaliseCapa(data)
      setCapas((prev) => prev.map((x) => (x.id === id ? c : x)))
    }
  }

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>

  const selectedCapa = selectedId ? capas.find((c) => c.id === selectedId) ?? null : null

  if (selectedCapa) {
    return (
      <CapaDetail
        capa={selectedCapa}
        users={users}
        evidence={evidence}
        onBack={() => setSelectedId(null)}
        onUpdate={(patch) => updateCapa(selectedCapa.id, patch)}
        error={error}
      />
    )
  }

  const filtered = capas.filter((c) => {
    if (filter === 'all') return true
    if (filter === 'overdue') return isOverdue(c)
    return c.status === filter
  })

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Corrective and preventive actions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Investigate problems, fix root causes, and verify the fix worked.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md whitespace-nowrap"
        >
          + New CAPA
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-md p-1 w-fit overflow-x-auto">
        {(
          [
            ['all', 'All'],
            ['open', 'Open'],
            ['in_progress', 'In progress'],
            ['overdue', 'Overdue'],
            ['closed', 'Closed'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap ${
              filter === k
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">No CAPAs match this filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5">Severity</th>
                <th className="px-4 py-2.5">Step</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Due</th>
                <th className="px-4 py-2.5 text-right">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedId(c.id)}
                >
                  <td
                    className="px-4 py-3 text-gray-900 max-w-[400px] truncate"
                    title={c.description}
                  >
                    {c.description}
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={c.severity} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    Step {c.current_step} / 7
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} overdue={isOverdue(c)} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {c.due_date ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-medium text-blue-600">Open →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <div
          className="fixed inset-0 bg-black/40 z-20 flex items-center justify-center p-4"
          onClick={() => setCreating(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-2">New CAPA</h2>
            <p className="text-xs text-gray-500 mb-4">
              Start with a short description of the problem. You'll walk through the
              7-step workflow next.
            </p>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="What happened?"
              rows={4}
              className={inputCls}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="text-sm font-medium text-gray-700 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createCapa}
                disabled={!newDescription.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-2 rounded-md"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function normaliseCapa(row: any): Capa {
  return {
    id: row.id,
    description: row.description ?? '',
    severity: row.severity ?? 'medium',
    status: row.status ?? 'open',
    responsible_id: row.responsible_id ?? null,
    due_date: row.due_date ?? null,
    root_cause: row.root_cause ?? null,
    corrective_action: row.corrective_action ?? null,
    immediate_fix: row.immediate_fix ?? null,
    five_whys: Array.isArray(row.five_whys) ? row.five_whys : [],
    evidence_ids: Array.isArray(row.evidence_ids) ? row.evidence_ids : [],
    effectiveness_check: row.effectiveness_check ?? null,
    closed_at: row.closed_at ?? null,
    current_step: row.current_step ?? 1,
    created_at: row.created_at,
  }
}

function CapaDetail({
  capa,
  users,
  evidence,
  onBack,
  onUpdate,
  error,
}: {
  capa: Capa
  users: UserRow[]
  evidence: EvidenceRow[]
  onBack: () => void
  onUpdate: (patch: Partial<Capa>) => void | Promise<void>
  error: string | null
}) {
  const [step, setStep] = useState(capa.current_step)
  const [draft, setDraft] = useState(capa)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setStep(capa.current_step)
    setDraft(capa)
  }, [capa.id, capa.current_step])

  function patchDraft<K extends keyof Capa>(key: K, value: Capa[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function patchWhy(index: number, value: string) {
    setDraft((prev) => {
      const next = [...prev.five_whys]
      while (next.length < 5) next.push('')
      next[index] = value
      return { ...prev, five_whys: next }
    })
  }

  function toggleEvidence(id: string) {
    setDraft((prev) => {
      const has = prev.evidence_ids.includes(id)
      return {
        ...prev,
        evidence_ids: has
          ? prev.evidence_ids.filter((x) => x !== id)
          : [...prev.evidence_ids, id],
      }
    })
  }

  async function saveStepAndNext() {
    setSaving(true)
    const closing = step === 7
    const newStep = closing ? 7 : Math.min(step + 1, 7)
    const newStatus: CapaStatus = closing
      ? 'closed'
      : statusFromStep(newStep, false)
    const patch: Partial<Capa> = {
      description: draft.description,
      immediate_fix: draft.immediate_fix,
      five_whys: draft.five_whys,
      root_cause: draft.root_cause,
      corrective_action: draft.corrective_action,
      responsible_id: draft.responsible_id,
      due_date: draft.due_date,
      evidence_ids: draft.evidence_ids,
      effectiveness_check: draft.effectiveness_check,
      current_step: newStep,
      status: newStatus,
    }
    if (closing) {
      ;(patch as Record<string, unknown>).closed_at = new Date().toISOString()
    }
    await onUpdate(patch)
    setSaving(false)
    if (!closing) setStep(newStep)
  }

  async function saveDraft() {
    setSaving(true)
    await onUpdate({
      description: draft.description,
      immediate_fix: draft.immediate_fix,
      five_whys: draft.five_whys,
      root_cause: draft.root_cause,
      corrective_action: draft.corrective_action,
      responsible_id: draft.responsible_id,
      due_date: draft.due_date,
      evidence_ids: draft.evidence_ids,
      effectiveness_check: draft.effectiveness_check,
    })
    setSaving(false)
  }

  const stepInfo = STEPS.find((s) => s.num === step)!

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to list
        </button>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          {capa.description.slice(0, 80) || 'CAPA'}
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Created {new Date(capa.created_at).toLocaleDateString()} ·{' '}
          <StatusBadge status={capa.status} overdue={isOverdue(capa)} inline />
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,260px] gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">
              Step {step} of 7
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mt-1">
              {stepInfo.label}
            </h2>
            <p className="text-xs text-gray-500 mt-1">{stepInfo.plain}</p>
          </div>

          <StepFields
            step={step}
            draft={draft}
            users={users}
            evidence={evidence}
            patchDraft={patchDraft}
            patchWhy={patchWhy}
            toggleEvidence={toggleEvidence}
          />

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 disabled:opacity-50"
              >
                Save draft
              </button>
              <button
                type="button"
                onClick={saveStepAndNext}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium px-4 py-1.5 rounded-md"
              >
                {saving
                  ? 'Saving…'
                  : step === 7
                    ? 'Close CAPA'
                    : 'Save & continue'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 self-start lg:sticky lg:top-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
            Progress
          </h3>
          <ol className="space-y-2">
            {STEPS.map((s) => {
              const isCurrent = s.num === step
              const isDone = s.num < capa.current_step || capa.status === 'closed'
              return (
                <li key={s.num}>
                  <button
                    type="button"
                    onClick={() => setStep(s.num)}
                    className={`w-full text-left flex items-start gap-2 px-2 py-1.5 rounded ${
                      isCurrent ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isDone ? '✓' : s.num}
                    </span>
                    <span
                      className={`text-xs ${
                        isCurrent
                          ? 'text-gray-900 font-medium'
                          : isDone
                            ? 'text-gray-700'
                            : 'text-gray-500'
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}

function StepFields({
  step,
  draft,
  users,
  evidence,
  patchDraft,
  patchWhy,
  toggleEvidence,
}: {
  step: number
  draft: Capa
  users: UserRow[]
  evidence: EvidenceRow[]
  patchDraft: <K extends keyof Capa>(k: K, v: Capa[K]) => void
  patchWhy: (i: number, v: string) => void
  toggleEvidence: (id: string) => void
}) {
  switch (step) {
    case 1:
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Problem description
          </label>
          <textarea
            value={draft.description}
            onChange={(e) => patchDraft('description', e.target.value)}
            rows={6}
            className={inputCls}
            placeholder="What happened? When and where? Who noticed it?"
          />
        </div>
      )
    case 2:
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Immediate fix
          </label>
          <textarea
            value={draft.immediate_fix ?? ''}
            onChange={(e) => patchDraft('immediate_fix', e.target.value)}
            rows={5}
            className={inputCls}
            placeholder="What did you do right away to contain the problem?"
          />
        </div>
      )
    case 3: {
      const whys = [...draft.five_whys]
      while (whys.length < 5) whys.push('')
      return (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Ask "why?" five times. Each answer becomes the next question's subject.
          </p>
          {whys.slice(0, 5).map((w, i) => (
            <div key={i}>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Why #{i + 1}
              </label>
              <input
                value={w}
                onChange={(e) => patchWhy(i, e.target.value)}
                className={inputCls}
                placeholder={
                  i === 0 ? 'Why did the problem happen?' : 'Why did the previous thing happen?'
                }
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Root cause (summary)
            </label>
            <textarea
              value={draft.root_cause ?? ''}
              onChange={(e) => patchDraft('root_cause', e.target.value)}
              rows={2}
              className={inputCls}
              placeholder="In one sentence, the underlying cause."
            />
          </div>
        </div>
      )
    }
    case 4:
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Corrective action
          </label>
          <textarea
            value={draft.corrective_action ?? ''}
            onChange={(e) => patchDraft('corrective_action', e.target.value)}
            rows={5}
            className={inputCls}
            placeholder="The permanent fix that addresses the root cause."
          />
        </div>
      )
    case 5:
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Responsible person
            </label>
            <select
              value={draft.responsible_id ?? ''}
              onChange={(e) =>
                patchDraft('responsible_id', e.target.value || null)
              }
              className={inputCls}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Deadline
            </label>
            <input
              type="date"
              value={draft.due_date ?? ''}
              onChange={(e) => patchDraft('due_date', e.target.value || null)}
              className={inputCls}
            />
          </div>
        </div>
      )
    case 6:
      return (
        <div>
          <p className="text-xs text-gray-500 mb-3">
            Check the evidence files that prove the corrective action was completed.
            Upload new files from the Evidence page first if needed.
          </p>
          {evidence.length === 0 ? (
            <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-md p-6 text-center">
              No evidence files in your workspace yet. Upload some from the Evidence
              page.
            </div>
          ) : (
            <ul className="space-y-1 max-h-64 overflow-y-auto border border-gray-200 rounded-md p-2">
              {evidence.map((e) => (
                <li key={e.id}>
                  <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.evidence_ids.includes(e.id)}
                      onChange={() => toggleEvidence(e.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900 truncate">
                      {e.file_name ?? '(unnamed)'}
                    </span>
                    <span className="text-[10px] text-gray-500 ml-auto">
                      {e.evidence_type}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-gray-500 mt-2">
            {draft.evidence_ids.length} file
            {draft.evidence_ids.length === 1 ? '' : 's'} attached.
          </p>
        </div>
      )
    case 7:
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Effectiveness check
            </label>
            <textarea
              value={draft.effectiveness_check ?? ''}
              onChange={(e) =>
                patchDraft('effectiveness_check', e.target.value)
              }
              rows={5}
              className={inputCls}
              placeholder="How did you confirm the fix worked? Has the problem recurred? What's the verification date?"
            />
          </div>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
            Clicking "Close CAPA" sets the status to closed and stamps the closure date.
            Only do this once you've confirmed the fix worked.
          </p>
        </div>
      )
    default:
      return null
  }
}

function SeverityBadge({ severity }: { severity: Capa['severity'] }) {
  const map: Record<Capa['severity'], [string, string]> = {
    low: ['Low', 'bg-gray-100 text-gray-600'],
    medium: ['Medium', 'bg-amber-50 text-amber-700'],
    high: ['High', 'bg-red-50 text-red-700'],
    critical: ['Critical', 'bg-red-100 text-red-800'],
  }
  const [label, cls] = map[severity]
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${cls}`}>{label}</span>
  )
}

function StatusBadge({
  status,
  overdue,
  inline,
}: {
  status: CapaStatus
  overdue: boolean
  inline?: boolean
}) {
  let label = 'Open'
  let cls = 'bg-blue-50 text-blue-700'
  if (overdue) {
    label = 'Overdue'
    cls = 'bg-red-50 text-red-700'
  } else if (status === 'in_progress') {
    label = 'In progress'
    cls = 'bg-amber-50 text-amber-700'
  } else if (status === 'verified') {
    label = 'Verified'
    cls = 'bg-emerald-50 text-emerald-700'
  } else if (status === 'closed') {
    label = 'Closed'
    cls = 'bg-gray-100 text-gray-600'
  }
  return (
    <span
      className={`${inline ? 'inline-block' : ''} text-[10px] font-semibold px-2 py-0.5 rounded ${cls}`}
    >
      {label}
    </span>
  )
}
